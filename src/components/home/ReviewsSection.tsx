'use client';
import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '../../lib/jdv/supabase';

type Review = { id: string; rating: number; title: string | null; comment: string | null; display_name: string; created_at: string };
const Stars = ({ n }: { n: number }) => <span aria-label={`${n} sur 5`} style={{ color: 'var(--jdv-accent)' }}>{'★'.repeat(n)}<span className="text-slate-300">{'★'.repeat(5 - n)}</span></span>;

export default function ReviewsSection({ loginHref = '/auth/login' }: { loginHref?: string }) {
  const sb = getSupabase();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<{ count: number; avg: number | null }>({ count: 0, avg: null });
  const [userId, setUserId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [name, setName] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [list, st] = await Promise.all([sb.rpc('public_platform_reviews', { p_limit: 12 }), sb.rpc('public_platform_review_stats')]);
    if (list.data) setReviews(list.data as Review[]);
    const s = (st.data as { review_count: number; average_rating: number | null }[] | null)?.[0];
    if (s) setStats({ count: Number(s.review_count), avg: s.average_rating == null ? null : Number(s.average_rating) });
  }, [sb]);

  useEffect(() => { load(); sb.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null)); }, [sb, load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    if (rating < 1) { setMsg({ ok: false, text: 'Choisissez une note de 1 à 5 étoiles.' }); return; }
    if (!name.trim()) { setMsg({ ok: false, text: 'Indiquez le nom à afficher.' }); return; }
    setBusy(true); setMsg(null);
    const { error } = await sb.from('platform_reviews').upsert(
      { user_id: userId, rating, title: title || null, comment: comment || null, display_name: name }, { onConflict: 'user_id' });
    setBusy(false);
    if (error) setMsg({ ok: false, text: 'Votre avis n’a pas pu être enregistré. Réessayez dans un instant.' });
    else { setMsg({ ok: true, text: 'Merci ! Votre avis sera publié après vérification.' }); setComment(''); setTitle(''); }
  }

  return (
    <section id="avis" aria-labelledby="avis-title" className="mx-auto max-w-6xl px-5 py-16">
      <h2 id="avis-title" className="text-center text-3xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>Ce que disent nos utilisateurs</h2>
      <p className="mt-3 text-center text-[var(--jdv-muted)]">
        {stats.count > 0 ? <>Note moyenne <strong>{stats.avg?.toFixed(1)}/5</strong> sur {stats.count} avis vérifiés.</> : 'Soyez le premier à donner votre avis.'}
      </p>

      {reviews.length > 0 && (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border border-[var(--jdv-border)] bg-white p-5">
              <Stars n={r.rating} />
              {r.title && <p className="mt-2 font-semibold">{r.title}</p>}
              {r.comment && <p className="mt-1 text-sm text-[var(--jdv-muted)]">{r.comment}</p>}
              <p className="mt-3 text-xs text-[var(--jdv-muted)]">{r.display_name} · {new Date(r.created_at).toLocaleDateString('fr-FR')}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-[var(--jdv-border)] bg-white p-6">
        <h3 className="text-lg font-semibold">Donnez votre avis</h3>
        {!userId ? (
          <p className="mt-2 text-sm text-[var(--jdv-muted)]">Connectez-vous pour noter JDV GLOBAL. <a href={loginHref} className="font-medium underline" style={{ color: 'var(--jdv-primary-text)' }}>Se connecter</a></p>
        ) : (
          <form onSubmit={submit} className="mt-3 space-y-3">
            <fieldset>
              <legend className="mb-1 text-sm">Votre note</legend>
              <div role="radiogroup" aria-label="Note de 1 à 5" className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} étoile${n > 1 ? 's' : ''}`} onClick={() => setRating(n)}
                    className="text-3xl leading-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--jdv-accent)]"
                    style={{ color: n <= rating ? 'var(--jdv-accent)' : '#CBD5E1' }}>★</button>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm">Nom affiché
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required className="mt-1 w-full rounded-lg border border-[var(--jdv-border)] px-3 py-2" />
            </label>
            <label className="block text-sm">Titre (facultatif)
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="mt-1 w-full rounded-lg border border-[var(--jdv-border)] px-3 py-2" />
            </label>
            <label className="block text-sm">Votre commentaire (facultatif)
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000} rows={4} className="mt-1 w-full rounded-lg border border-[var(--jdv-border)] px-3 py-2" />
            </label>
            <button disabled={busy} className="rounded-lg px-4 py-2 font-medium disabled:opacity-60" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>{busy ? 'Envoi…' : 'Envoyer mon avis'}</button>
            {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-700'}`}>{msg.text}</p>}
          </form>
        )}
      </div>
    </section>
  );
}
