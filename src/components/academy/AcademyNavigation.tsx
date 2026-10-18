import Link from 'next/link';

type AcademyNavigationKey = 'academy' | 'demo' | 'live' | 'ai' | 'revenue' | 'intelligence';

const links: { key: AcademyNavigationKey; href: string; label: string }[] = [
  { key: 'academy', href: '/academy', label: 'Catalogue & apprentissages' },
  { key: 'demo', href: '/academy/demo', label: 'Démo & tests' },
  { key: 'live', href: '/academy/live', label: 'Academy Live' },
  { key: 'ai', href: '/academy/ai', label: 'Tuteur IA' },
  { key: 'revenue', href: '/academy/revenue', label: 'Tarification' },
  { key: 'intelligence', href: '/academy/intelligence', label: 'Indicateurs' },
];

export default function AcademyNavigation({ current }: { current?: AcademyNavigationKey }) {
  return (
    <nav aria-label="Navigation JDV Academy" className="mb-5 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[.03] p-3">
      {links.map((link) => {
        const active = link.key === current;
        return (
          <Link
            key={link.key}
            href={link.href}
            aria-current={active ? 'page' : undefined}
            className={active
              ? 'rounded-xl bg-[#F28C28] px-3 py-2 text-xs font-bold text-[#0B1B3D]'
              : 'rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-[#F28C28]/50 hover:text-white'}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
