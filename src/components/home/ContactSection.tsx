'use client';
import { useState } from 'react';
import { getSupabase } from '../../lib/jdv/supabase';
import { CONTACT } from '../../lib/jdv/contact';

export default function ContactSection() {
  const [f, setF] = useState({ name: '', email: '', subject: '', message: '' });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null);
    const { error } = await getSupabase().rpc('public_submit_contact_message', { p_name: f.name, p_email: f.email, p_subject: f.subject, p_message: f.message });
    setBusy(false);
    if (!error) { setMsg({ ok: true, text: 'Merci ! Votre message a bien été envoyé. Nous vous répondrons par email.' }); setF({ name: '', email: '', subject: '', message: '' }); }
    else if (String(error.message).includes('TOO_MANY')) setMsg({ ok: false, text: 'Vous avez déjà envoyé plusieurs messages. Réessayez dans une heure.' });
    else setMsg({ ok: false, text: 'Le message n’a pas pu être envoyé. Vérifiez les champs et réessayez.' });
  }

  const channels: { label: string; value: string; href?: string }[] = [];
  if (CONTACT.email) channels.push({ label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}` });
  if (CONTACT.phone) channels.push({ label: 'Téléphone', value: CONTACT.phone, href: `tel:${CONTACT.phone.replace(/\s/g, '')}` });
  if (CONTACT.whatsapp) channels.push({ label: 'WhatsApp', value: 'Nous écrire sur WhatsApp', href: `https://wa.me/${CONTACT.whatsapp}` });
  if (CONTACT.address) channels.push({ label: 'Adresse', value: CONTACT.address });
  if (CONTACT.hours) channels.push({ label: 'Horaires', value: CONTACT.hours });
  CONTACT.socials.forEach((s) => channels.push({ label: s.label, value: s.url.replace(/^https?:\/\//, ''), href: s.url }));

  const input = 'mt-1 w-full rounded-lg border border-[var(--jdv-border)] px-3 py-2';
  return (
    <section id="contact" aria-labelledby="contact-title" className="bg-[var(--jdv-primary-soft)] py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
        <div>
          <h2 id="contact-title" className="text-3xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>Contact</h2>
          <p className="mt-3 text-[var(--jdv-muted)]">Une question, un partenariat, une démonstration ? Écrivez-nous.</p>
          {channels.length > 0 && (
            <dl className="mt-6 space-y-3 text-sm">
              {channels.map((c) => (
                <div key={c.label}><dt className="font-semibold">{c.label}</dt>
                  <dd>{c.href ? <a href={c.href} className="underline" style={{ color: 'var(--jdv-primary-text)' }} {...(c.href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{c.value}</a> : c.value}</dd></div>
              ))}
            </dl>
          )}
        </div>
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-[var(--jdv-border)] bg-white p-6">
          <label className="block text-sm">Nom<input required maxLength={100} value={f.name} onChange={set('name')} className={input} /></label>
          <label className="block text-sm">Email<input required type="email" maxLength={200} value={f.email} onChange={set('email')} className={input} /></label>
          <label className="block text-sm">Sujet (facultatif)<input maxLength={150} value={f.subject} onChange={set('subject')} className={input} /></label>
          <label className="block text-sm">Message<textarea required minLength={5} maxLength={2000} rows={5} value={f.message} onChange={set('message')} className={input} /></label>
          <button disabled={busy} className="rounded-lg px-4 py-2 font-medium disabled:opacity-60" style={{ background: 'var(--jdv-primary)', color: 'var(--jdv-on-primary)' }}>{busy ? 'Envoi…' : 'Envoyer'}</button>
          {msg && <p role="status" className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-700'}`}>{msg.text}</p>}
        </form>
      </div>
    </section>
  );
}
