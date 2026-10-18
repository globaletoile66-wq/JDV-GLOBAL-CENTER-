import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type HistoryMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;

  if (authError || !user) {
    return NextResponse.json({ error: 'Connexion requise.' }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      error: 'Le tuteur IA est prêt, mais le fournisseur IA n’est pas configuré. Ajoute OPENAI_API_KEY comme variable secrète Netlify (scope Functions/Runtime), puis redéploie.',
      code: 'AI_PROVIDER_NOT_CONFIGURED',
    }, { status: 503 });
  }

  let body: { conversationId?: string; prompt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Requête JSON invalide.' }, { status: 400 });
  }

  const conversationId = typeof body.conversationId === 'string' ? body.conversationId : '';
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
    return NextResponse.json({ error: 'Impossible de charger l’historique pédagogique.' }, { status: 500 });
  }

  const context = conversation.context || {};
  const courseTitle = typeof context.course_title === 'string' ? context.course_title.slice(0, 200) : '';
  const systemPrompt = [
    'Tu es le tuteur pédagogique de JDV Academy, au service d’apprenants adultes et de jeunes en Afrique et à l’international.',
    'Explique avec clarté, exemples concrets, étapes courtes et vocabulaire adapté au niveau de l’apprenant. Réponds dans la langue utilisée par l’apprenant.',
    'Favorise la compréhension : pose des questions de réflexion et propose des exercices d’entraînement.',
    'Ne prétends jamais être un enseignant humain, ne fabrique pas de notes, d’attestations, de résultats ni de sources.',
    'Ne révèle jamais de corrigé privé, de clé de réponse ou de contenu d’évaluation non fourni dans le contexte de la conversation.',
    'Pour une question d’évaluation active, aide à comprendre le concept et propose un exemple analogue plutôt que de fournir une réponse destinée à contourner l’examen.',
    'Si tu n’es pas sûr, dis-le et propose une façon de vérifier.',
    courseTitle ? 'Cours de contexte : ' + courseTitle : '',
  ].filter(Boolean).join('\n');

  const { error: userMessageError } = await supabase.rpc('ai_add_message', {
    p_conversation_id: conversationId,
    p_role: 'user',
    p_content: prompt,
    p_provider: null,
    p_model: null,
    p_metadata: { feature: 'academy_tutor' },
  });
  if (userMessageError) {
    return NextResponse.json({ error: 'La question n’a pas pu être enregistrée.' }, { status: 500 });
  }

  const history: HistoryMessage[] = ((previousMessages || []) as { role: string; content: string }[])
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .reverse()
    .map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content }));
  history.push({ role: 'user', content: prompt });

  const model = process.env.JDV_ACADEMY_TUTOR_MODEL || 'gpt-4o-mini';
  let response: Response;
  try {
    response = await fetch(process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'system', content: systemPrompt }, ...history],
        temperature: 0.35,
        max_tokens: 1200,
      }),
      signal: AbortSignal.timeout(30000),
    });
  } catch {
    await supabase.rpc('ai_log_access', { p_action_type: 'message', p_scope: 'academy_tutor', p_organization_id: null, p_conversation_id: conversationId, p_result_count: 0, p_success: false });
    return NextResponse.json({ error: 'Le service IA n’a pas répondu. Ta question est enregistrée ; réessaie dans un instant.' }, { status: 502 });
  }

  const payload = await response.json().catch(() => null) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  } | null;

  if (!response.ok || !payload?.choices?.[0]?.message?.content) {
    await supabase.rpc('ai_log_access', { p_action_type: 'message', p_scope: 'academy_tutor', p_organization_id: null, p_conversation_id: conversationId, p_result_count: 0, p_success: false });
    return NextResponse.json({
      error: response.status === 401 ? 'Le secret du fournisseur IA est invalide.' : 'Le service IA a refusé la demande. Vérifie la clé et le modèle configurés.',
      code: 'AI_PROVIDER_REQUEST_FAILED',
    }, { status: response.status === 401 ? 503 : 502 });
  }

  const answer = payload.choices[0].message.content.trim();
  const inputTokens = Math.max(0, payload.usage?.prompt_tokens || 0);
  const outputTokens = Math.max(0, payload.usage?.completion_tokens || 0);
  const { data: assistantMessageId, error: assistantMessageError } = await supabase.rpc('ai_add_message', {
    p_conversation_id: conversationId,
    p_role: 'assistant',
    p_content: answer,
    p_provider: 'openai',
    p_model: model,
    p_token_input: inputTokens,
    p_token_output: outputTokens,
    p_metadata: { feature: 'academy_tutor' },
  });

  await supabase.rpc('ai_log_access', {
    p_action_type: 'message',
    p_scope: 'academy_tutor',
    p_organization_id: null,
    p_conversation_id: conversationId,
    p_result_count: 1,
    p_success: !assistantMessageError,
  });

  if (assistantMessageError) {
    return NextResponse.json({ error: 'La réponse est arrivée mais n’a pas pu être enregistrée. Actualise la conversation avant de continuer.' }, { status: 500 });
  }

  return NextResponse.json({
    answer,
    model,
    inputTokens,
    outputTokens,
    assistantMessageId,
  });
}
