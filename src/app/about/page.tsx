'use client';

import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BriefcaseBusiness, Building2, CheckCircle2,
  Compass, Globe2, Handshake, HeartHandshake, Layers3, LockKeyhole, ShieldCheck,
  Sparkles, Target, Users,
} from 'lucide-react';
import AppLogo from '@/components/ui/AppLogo';
import GlobalHeader from '@/components/navigation/GlobalHeader';
import { getGroupedJDVModules } from '@/lib/jdv/application-registry';

const principles = [
  { icon: ShieldCheck, title: 'Confiance et responsabilité', description: 'Les accès, les données et les opérations doivent être encadrés par des permissions et des contrôles adaptés à chaque service.' },
  { icon: Users, title: 'Accessibilité et inclusion', description: 'Des parcours compréhensibles pour les particuliers, les professionnels, les organisations et les communautés.' },
  { icon: Sparkles, title: 'Innovation utile', description: 'Des outils numériques conçus pour répondre à des besoins concrets et évoluer avec les usages.' },
];

const audiences = [
  { icon: Users, title: 'Particuliers et communautés', text: 'Découvrir des services, rejoindre des espaces collectifs et retrouver des outils adaptés à ses besoins.' },
  { icon: BriefcaseBusiness, title: 'Entrepreneurs et professionnels', text: 'Présenter son activité, organiser ses opérations, développer sa visibilité et recevoir des demandes.' },
  { icon: Building2, title: 'Organisations et entreprises', text: 'Explorer des outils de gestion, de collaboration et de suivi selon les modules disponibles.' },
  { icon: Handshake, title: 'Partenaires et institutions', text: 'Identifier des possibilités de coopération et construire des collaborations adaptées à des objectifs communs.' },
];

export default function AboutPage() {
  const groups = getGroupedJDVModules();
  const moduleCount = groups.reduce((total, group) => total + group.modules.length, 0);

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F8FC] text-slate-900">
      <GlobalHeader />

      <section className="relative isolate border-b border-[#1A2B58] bg-[#0B1534] text-white">
        <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-24 -top-28 h-[26rem] w-[26rem] rounded-full bg-[#D4AC61]/15 blur-3xl" />
          <div className="absolute -bottom-40 left-1/4 h-[25rem] w-[25rem] rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute inset-0 opacity-[.08]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.25) 1px, transparent 1px)', backgroundSize: '44px 44px' }} />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.2fr_.8fr] lg:px-8 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AC61]/40 bg-[#D4AC61]/10 px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-[.2em] text-[#F0D8A7] sm:text-xs">
              <Globe2 size={14} /> Une ambition panafricaine, une ouverture internationale
            </span>
            <h1 className="mt-7 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              Un écosystème numérique.
              <span className="mt-2 block text-[#E5C47F]">Des possibilités à construire ensemble.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              JDV Global Center rassemble progressivement des applications et des services complémentaires pour rapprocher les personnes, les professionnels, les entreprises et les communautés.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/branches" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AC61] px-5 py-3.5 text-sm font-extrabold text-[#101B3D] transition hover:bg-[#E5C47F]">
                Explorer les branches <ArrowRight size={17} />
              </Link>
              <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/[.04] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">
                Rejoindre la plateforme <ArrowUpRight size={16} />
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-slate-300 sm:text-sm">
              <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#E5C47F]" /> Des univers complémentaires</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#E5C47F]" /> Des parcours spécialisés</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 size={16} className="text-[#E5C47F]" /> Une évolution progressive</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-4 rounded-[2rem] border border-[#D4AC61]/20" />
            <div className="relative rounded-[1.7rem] border border-white/10 bg-white/[.06] p-5 shadow-2xl backdrop-blur sm:p-6">
              <div className="flex items-center gap-4 border-b border-white/10 pb-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D4AC61]/30 bg-[#D4AC61]/10"><AppLogo size={44} /></div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.18em] text-[#E5C47F]">Le point d’entrée commun</p>
                  <p className="mt-1 text-lg font-extrabold">JDV Global Center</p>
                  <p className="mt-1 text-xs text-slate-400">Découvrir · S’orienter · Agir</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { icon: Layers3, label: 'Services spécialisés' },
                  { icon: LockKeyhole, label: 'Accès encadrés' },
                  { icon: Users, label: 'Profils variés' },
                  { icon: Compass, label: 'Parcours guidés' },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-[#07102A]/70 p-4">
                    <Icon size={20} className="text-[#E5C47F]" />
                    <p className="mt-3 text-sm font-bold">{label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-[#D4AC61]/20 bg-[#D4AC61]/[.07] p-4">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-[#E5C47F]">Une approche commune</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">Une expérience cohérente, tout en préservant les parcours, les permissions et les responsabilités propres à chaque application.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="vision" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[.75fr_1.25fr] lg:gap-16">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[.22em] text-[#A77C2C]">01 · Identité et ambition</p>
            <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#101B3D] sm:text-4xl">Une vision ancrée dans les réalités, tournée vers l’avenir.</h2>
          </div>
          <div className="space-y-5 text-base leading-8 text-slate-600">
            <p><strong className="text-slate-900">Notre vision :</strong> contribuer à un écosystème numérique africain utile, accessible et ouvert sur le monde, dans lequel les utilisateurs peuvent découvrir des services et saisir de nouvelles possibilités.</p>
            <p><strong className="text-slate-900">Notre mission :</strong> faciliter l’accès aux outils numériques, rapprocher les besoins des services adaptés et offrir un point d’entrée commun vers des applications spécialisées.</p>
            <p><strong className="text-slate-900">Notre identité :</strong> une ambition panafricaine, une approche inclusive et une volonté d’amélioration continue, avec des expériences conçues pour des besoins différents sans effacer les spécificités de chaque métier.</p>
          </div>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, description }, index) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101B3D] text-[#E5C47F]"><Icon size={23} /></div>
              <p className="mt-5 text-xs font-extrabold tracking-[.16em] text-[#A77C2C]">0{index + 1}</p>
              <h3 className="mt-2 text-lg font-extrabold text-[#101B3D]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="ecosysteme" className="scroll-mt-24 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl">
              <p className="text-xs font-extrabold uppercase tracking-[.22em] text-[#A77C2C]">02 · Les sections de la plateforme</p>
              <h2 className="mt-4 text-3xl font-black tracking-tight text-[#101B3D] sm:text-4xl">Des univers distincts, reliés par une expérience commune.</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">Les applications sont regroupées par grands domaines pour aider chacun à comprendre leur rôle et à accéder directement au service concerné.</p>
            </div>
            <div className="flex shrink-0 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-[#F7F8FC] px-4 py-3">
                <p className="text-2xl font-black text-[#101B3D]">{groups.length}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">Pôles</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-[#F7F8FC] px-4 py-3">
                <p className="text-2xl font-black text-[#101B3D]">{moduleCount}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">Applications répertoriées</p>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-6">
            {groups.map((group, index) => (
              <section key={group.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-[#F9FAFD]">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-start gap-4">
                    <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: group.accent }} />
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-slate-500">Pôle {String(index + 1).padStart(2, '0')}</p>
                      <h3 className="mt-1 text-xl font-extrabold text-[#101B3D]">{group.title}</h3>
                      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{group.description}</p>
                    </div>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 sm:self-center"><Layers3 size={14} /> {group.modules.length} service{group.modules.length > 1 ? 's' : ''}</span>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
                  {group.modules.map(({ id, name, description, href, icon: Icon, protected: protectedModule }) => (
                    <Link key={id} href={href} className="group flex min-h-[138px] gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-[#D4AC61] hover:shadow-md">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: group.accent + '20', color: group.accent }}><Icon size={21} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-sm font-extrabold leading-5 text-[#101B3D]">{name}</span>
                          <ArrowUpRight size={15} className="shrink-0 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#A77C2C]" />
                        </span>
                        <span className="mt-2 block text-xs leading-5 text-slate-600">{description}</span>
                        {protectedModule && <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600"><LockKeyhole size={11} /> Accès selon autorisations</span>}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <div className="mt-8 flex flex-col gap-4 rounded-3xl bg-[#101B3D] p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h3 className="text-xl font-extrabold">Vous cherchez une branche en particulier ?</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Consultez l’explorateur des branches pour découvrir les univers, leurs parcours et leurs accès.</p>
            </div>
            <Link href="/branches" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#D4AC61] px-5 py-3 text-sm font-extrabold text-[#101B3D] transition hover:bg-[#E5C47F]">Ouvrir l’explorateur <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>

      <section id="confiance" className="scroll-mt-24 bg-[#EEF1F7] py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-16">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.22em] text-[#A77C2C]">03 · Sécurité et confiance</p>
              <h2 className="mt-4 text-3xl font-black leading-tight tracking-tight text-[#101B3D] sm:text-4xl">La confiance se construit par des contrôles concrets.</h2>
              <p className="mt-5 text-base leading-7 text-slate-600">La sécurité n’est pas une promesse absolue. Elle dépend de la conception, de la configuration et de la vérification régulière des protections de chaque service.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { icon: LockKeyhole, title: 'Comptes et permissions', text: 'Les espaces et les actions sensibles doivent être accessibles uniquement aux profils autorisés.' },
                { icon: ShieldCheck, title: 'Protection des données', text: 'Les règles d’accès et la séparation des données doivent être adaptées au type d’information et au service concerné.' },
                { icon: BadgeCheck, title: 'Vérifications et validations', text: 'Les opérations sensibles peuvent nécessiter des contrôles, des justificatifs ou une validation selon le parcours.' },
                { icon: CheckCircle2, title: 'Traçabilité et vigilance', text: 'Les contrôles, les signalements et le suivi des incidents doivent soutenir l’amélioration continue.' },
              ].map(({ icon: Icon, title, text }) => (
                <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <Icon size={22} className="text-[#A77C2C]" />
                  <h3 className="mt-4 font-extrabold text-[#101B3D]">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
          <p className="mt-6 rounded-xl border border-slate-300 bg-white/70 p-4 text-xs leading-6 text-slate-600">Les contrôles effectivement disponibles peuvent varier selon le service et son état de déploiement. Les descriptions de cette page ne remplacent pas les conditions d’utilisation ni la politique de confidentialité applicables.</p>
        </div>
      </section>

      <section id="opportunites" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-xs font-extrabold uppercase tracking-[.22em] text-[#A77C2C]">04 · Opportunités et avantages</p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-[#101B3D] sm:text-4xl">Un écosystème pensé pour différents besoins et différents parcours.</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">JDV Global Center vise à faciliter la découverte des services et à ouvrir des possibilités de collaboration. Les résultats dépendent des fonctionnalités disponibles, du profil de l’utilisateur et de son activité.</p>
        </div>
        <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {audiences.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101B3D] text-[#E5C47F]"><Icon size={22} /></div>
              <h3 className="mt-5 text-lg font-extrabold text-[#101B3D]">{title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{text}</p>
            </article>
          ))}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#D4AC61]/30 bg-gradient-to-br from-white to-[#FBF5E8] p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D4AC61]/20 text-[#8A6422]"><Target size={23} /></div>
            <h3 className="mt-5 text-xl font-extrabold text-[#101B3D]">Notre engagement de développement</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">Faire évoluer la plateforme de façon progressive, clarifier les parcours, améliorer l’accessibilité et renforcer les contrôles au rythme de la validation des fonctionnalités.</p>
          </article>
          <article className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#101B3D] text-[#E5C47F]"><HeartHandshake size={23} /></div>
            <h3 className="mt-5 text-xl font-extrabold text-[#101B3D]">Construire des partenariats utiles</h3>
            <p className="mt-3 text-sm leading-7 text-slate-600">Nous souhaitons favoriser les échanges avec les professionnels, les entreprises, les associations et les institutions autour de besoins identifiés et d’objectifs partagés.</p>
            <Link href="/business/create" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#8A6422] hover:text-[#101B3D]">Découvrir l’espace entreprise <ArrowRight size={15} /></Link>
          </article>
        </div>
      </section>

      <section className="bg-[#0B1534] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[.22em] text-[#E5C47F]">05 · Rejoindre l’écosystème</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Découvrez les services qui correspondent à votre prochain projet.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Explorez les applications, créez votre espace si vous le souhaitez ou consultez le Centre d’aide pour mieux comprendre les parcours disponibles.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link href="/auth/register" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#D4AC61] px-5 py-3.5 text-sm font-extrabold text-[#101B3D] transition hover:bg-[#E5C47F]">Créer un compte <ArrowRight size={16} /></Link>
              <Link href="/help" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10">Visiter le Centre d’aide <ArrowUpRight size={16} /></Link>
            </div>
          </div>
          <footer className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><AppLogo size={32} /><span>© {new Date().getFullYear()} JDV GLOBAL CENTER. Tous droits réservés.</span></div>
            <div className="flex flex-wrap gap-x-5 gap-y-2 font-semibold">
              <Link href="/" className="hover:text-white">Accueil</Link>
              <Link href="/branches" className="hover:text-white">Nos branches</Link>
              <Link href="/help" className="hover:text-white">Centre d’aide</Link>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
