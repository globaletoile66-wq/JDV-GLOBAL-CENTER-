import PasswordCard from '@/components/security/PasswordCard';
import MfaCard from '@/components/security/MfaCard';
import SessionsCard from '@/components/security/SessionsCard';

export const metadata = { title: 'Sécurité du compte' };

export default function SecurityPage() {
  return (
    <main className="jdv-home min-h-screen px-5 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--jdv-primary-text)' }}>Sécurité du compte</h1>
        <PasswordCard />
        <MfaCard />
        <SessionsCard />
      </div>
    </main>
  );
}
