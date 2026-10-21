import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

function isAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function getModel() {
  return process.env.JDV_AI_MODEL?.trim()
    || process.env.JDV_ASSISTANT_MODEL?.trim()
    || process.env.JDV_ACADEMY_TUTOR_MODEL?.trim()
    || 'gpt-5-mini';
}

export async function GET() {
  const configured = isAIConfigured();
  return NextResponse.json({
    configured,
    model: configured ? getModel() : null,
    customEndpoint: configured && Boolean(process.env.OPENAI_BASE_URL?.trim()),
  }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  const { data: appMembership, error: membershipError } = await supabase
    .from('app_memberships')
    .select('id,status')
    .eq('user_id', user.id)
    .eq('app_key', 'ai')
    .maybeSingle();

  if (membershipError || !appMembership || appMembership.status !== 'active') {
    return NextResponse.json({
      error: 'Inscris-toi à JDV AI avant d’utiliser l’assistant.',
      code: 'APP_MEMBERSHIP_REQUIRED',
    }, { status: 403 });
  }

  let body: { conversationId?: unknown; prompt?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête JSON invalide.' }, { status: 400 });
  }

  const conversationId = typeof body.conversationId === 'string' ? body.conversationId.trim() : '';
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!conversationId || !prompt || prompt.length > 4000) {
    return NextResponse.json({ error: 'Conversation et question obligatoires (4 000 caractères maximum).' }, { status: 400 });
  }

  const { data: conversation, error: conversationError } = await supabase
    .from('ai_conversations')
    .select('id,title,context,organization_id')
    .eq('id', conversationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (conversationError || !conversation) {
    return NextResponse.json({ error: 'Conversation introuvable ou accès refusé.' }, { status: 404 });
  }

  if (!isAIConfigured()) {
    return NextResponse.json({
      error: 'JDV AI n’est pas encore configuré côté serveur. Ajoute OPENAI_API_KEY dans les secrets du déploiement ; ne place jamais cette clé dans le navigateur.',
      code: 'AI_PROVIDER_NOT_CONFIGURED',
    }, { status: 503 });
  }

  const { data: rateData, error: rateError } = await supabase.rpc('ai_check_rate_limit', {
    p_max_requests: 10,
    p_window_seconds: 60,
  });
  if (rateError) {
    return NextResponse.json({ error: 'Le contrôle de quota IA est indisponible. Réessaie plus tard.' }, { status: 503 });
  }
  if (!(rateData as { allowed?: boolean } | null)?.allowed) {
    return NextResponse.json({ error: 'Limite atteinte : attends une minute avant de poser une autre question.' }, { status: 429 });
  }

  const { data: previousMessages, error: historyError } = await supabase
    .from('ai_messages')
    .select('role,content')
    .eq('conversation_id', conversationId)
    .in('role', ['user', 'assistant'])
    .order('created_at', { ascending: false })
    .limit(12);

  if (historyError) {
    return NextResponse.json({ error: 'Impossible de charger l’historique de conversation.' }, { status: 500 });
  }

  const systemPrompt = [
    'Tu es JDV AI, l’assistant intelligent de JDV Global Center, conçu pour aider les utilisateurs à apprendre, créer, analyser et entreprendre.',
    'Réponds dans la langue de l’utilisateur. Sois clair, professionnel, structuré et adapté au contexte demandé.',
    'Distingue les faits des hypothèses. N’invente pas de sources, de données, de fonctionnalités JDV, de résultats d’actions ni de faits d’actualité.',
    'Tu ne peux pas prétendre avoir effectué une action dans une application ou consulté une donnée privée si aucun outil autorisé ne l’a réellement fait.',
    'Pour les questions médicales, juridiques ou financières à fort enjeu, donne des informations générales, signale les limites et recommande un professionnel qualifié lorsque nécessaire.',
    'Ne demande jamais de mots de passe, de clés secrètes ni de codes de sécurité.',
  ].join('\n');

  const { error: userMessageError } = await supabase.rpc('ai_add_message', {
    p_conversation_id: conversationId,
    p_role: 'user',
    p_content: prompt,
    p_provider: null,
    p_model: null,
    p_metadata: { feature: 'jdv_ai_chat' },
  });
  if (userMessageError) {
    return NextResponse.json({ error: 'La question n’a pas pu être enregistrée.' }, { status: 500 });
  }

  const history: HistoryMessage[] = ((previousMessages || []) as { role: string; content: string }[])
    .filter((item) => item.role === 'user' || item.role === 'assistant')
    .reverse()
    .map((item) => ({ role: item.role as 'user' | 'assistant', content: item.content }));
  history.push({ role: 'user', content: prompt });

  const model = getModel();
  let completion;
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      ...(process.env.OPENAI_BASE_URL?.trim() ? { baseURL: process.env.OPENAI_BASE_URL.trim() } : {}),
      timeout: 30000,
      maxRetries: 1,
    });
    completion = await openai.chat.completions.create({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...history],
      max_completion_tokens: 1200,
    });
  } catch {
    await supabase.rpc('ai_log_access', {
      p_action_type: 'message', p_scope: 'jdv_ai_chat', p_organization_id: conversation.organization_id,
      p_conversation_id: conversationId, p_result_count: 0, p_success: false,
    });
    return NextResponse.json({
      error: 'Le fournisseur IA n’a pas répondu. Vérifie la configuration serveur puis réessaie.',
      code: 'AI_PROVIDER_REQUEST_FAILED',
    }, { status: 502 });
  }

  const answer = completion.choices[0]?.message?.content?.trim();
  if (!answer) {
    await supabase.rpc('ai_log_access', {
      p_action_type: 'message', p_scope: 'jdv_ai_chat', p_organization_id: conversation.organization_id,
      p_conversation_id: conversationId, p_result_count: 0, p_success: false,
    });
    return NextResponse.json({ error: 'Le modèle n’a pas retourné de réponse exploitable.', code: 'AI_EMPTY_RESPONSE' }, { status: 502 });
  }

  const inputTokens = Math.max(0, completion.usage?.prompt_tokens || 0);
  const outputTokens = Math.max(0, completion.usage?.completion_tokens || 0);
  const { data: assistantMessageId, error: assistantMessageError } = await supabase.rpc('ai_add_message', {
    p_conversation_id: conversationId,
    p_role: 'assistant',
    p_content: answer,
    p_provider: 'openai',
    p_model: model,
    p_token_input: inputTokens,
    p_token_output: outputTokens,
    p_metadata: { feature: 'jdv_ai_chat' },
  });

  await supabase.rpc('ai_log_access', {
    p_action_type: 'message', p_scope: 'jdv_ai_chat', p_organization_id: conversation.organization_id,
    p_conversation_id: conversationId, p_result_count: 1, p_success: !assistantMessageError,
  });

  if (assistantMessageError) {
    return NextResponse.json({ error: 'La réponse a été générée mais n’a pas pu être enregistrée. Actualise la conversation.' }, { status: 500 });
  }

  return NextResponse.json({
    answer, model, inputTokens, outputTokens, assistantMessageId,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
