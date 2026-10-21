'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Building2, ShoppingBag, Sparkles, BriefcaseBusiness, Settings2, GitMerge, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AppLogo from '@/components/ui/AppLogo';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import AssistantWidget from '@/components/home/AssistantWidget';
import { useT } from '@/hooks/useT';
import { getGroupedJDVModules } from '@/lib/jdv/application-registry';

export default function HomePage() {
  const { user, loading, isSuperAdmin } = useAuth();
  const { t, tOr, language } = useT();
  const [moduleSearch, setModuleSearch] = useState('');

  // Les noms de marque (JDV PAY, JDV CRM…) restent tels quels ; descriptions et titres de pôles suivent la langue active.
  const moduleGroups = useMemo(
    () =>
      getGroupedJDVModules().map((group) => ({
        ...group,
        title: tOr(`group.${group.id}.title`, group.title),
        description: tOr(`group.${group.id}.desc`, group.description),
        modules: group.modules.map((module) => ({ ...module, description: tOr(`module.${module.id}.desc`, module.description) })),
      })),
    [tOr],
  );
  const moduleCount = moduleGroups.reduce((total, group) => total + group.modules.length, 0);
  const visibleGroups = useMemo(() => {
    const query = moduleSearch.trim().toLocaleLowerCase(language);
    if (!query) return moduleGroups;
    return moduleGroups
      .map((group) => ({
        ...group,
        modules: group.modules.filter((module) =>
          `${module.name} ${module.description} ${group.title}`.toLocaleLowerCase(language).includes(query),
        ),
      }))
      .filter((group) => group.modules.length > 0);
  }, [moduleGroups, moduleSearch, language]);
  const visibleCount = visibleGroups.reduce((total, group) => total + group.modules.length, 0);
  const spaceHref = user ? '/espace' : '/auth/login';

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3"><AppLogo size={40}/><div><div className="font-extrabold">JDV</div><div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Global Center</div></div></Link>
          <div className="flex items-center gap-2">
            {!loading && user && isSuperAdmin && <><Link href="/super-admin" className="inline-flex btn-secondary"><ShieldCheck size={16}/>{t('superAdmin')}</Link><Link href="/hidden-concepteur-gate/dashboard/studio" className="inline-flex btn-secondary"><SlidersHorizontal size={16}/>{t('designerStudio')}</Link></>}
            <Link href="/architecture/branches" className="hidden lg:inline-flex btn-secondary"><GitMerge size={16}/>{t('analytics')}</Link><Link href="/parametres/branches" className="hidden md:inline-flex btn-secondary"><Settings2 size={16}/>{t('settings')}</Link><Link href="/marketplace" className="hidden sm:inline-flex btn-secondary"><ShoppingBag size={16}/>{t('marketplace')}</Link><Link href="/business/create" className="hidden lg:inline-flex btn-secondary"><BriefcaseBusiness size={16}/>{t('registerBusiness')}</Link>
            <LanguageSwitcher />
            {!loading && <Link href={spaceHref} className="btn-primary">{user ? t('mySpace') : t('login')}<ArrowRight size={16}/></Link>}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-10 pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.2fr_.8fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent"><Sparkles size={14}/>{t('home.badge')}</span>
            <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-6xl">{t('home.title1')} <span className="text-accent">{t('home.title2')}</span></h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{t('home.intro')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/marketplace" className="btn-primary px-6 py-3"><ShoppingBag size={18}/>{t('home.ctaMarketplace')}<ArrowRight size={17}/></Link>
              <Link href="/business/create" className="btn-secondary px-6 py-3"><Building2 size={18}/>{t('registerBusiness')}</Link>
              <Link href={user ? '/espace' : '/auth/register'} className="btn-secondary px-6 py-3">{user ? t('home.openSpace') : t('home.createAccount')}</Link>
            </div>
            <div className="mt-7 grid max-w-xl grid-cols-3 gap-3">
              {['home.pill1', 'home.pill2', 'home.pill3'].map((key) => <div key={key} className="rounded-xl border border-border bg-card p-3 text-center text-xs font-semibold">{t(key)}</div>)}
            </div>
          </div>
          <div className="rounded-3xl border border-accent/20 bg-card p-6 shadow-2xl">
            <div className="mb-5 flex items-center gap-3"><div className="rounded-xl bg-accent/10 p-3 text-accent"><Building2 size={22}/></div><div><p className="font-bold">{t('home.bizTitle')}</p><p className="text-xs text-muted-foreground">{t('home.bizSubtitle')}</p></div></div>
            <div className="space-y-3">
              {['home.biz1', 'home.biz2', 'home.biz3', 'home.biz4', 'home.biz5'].map((key, i) => <div key={key} className="flex items-center gap-3 rounded-xl border border-border p-3 text-sm"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-xs text-accent">{i + 1}</span>{t(key)}</div>)}
            </div>
            <Link href="/business/create" className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 font-bold text-black">{t('home.bizStart')}<ArrowRight size={17}/></Link>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-accent">{t('home.ecoLabel')}</p><h2 className="mt-1 text-2xl font-extrabold">{t('home.ecoTitle')}</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{t('home.ecoDesc')}</p></div><span className="text-sm text-muted-foreground">{t('home.count', { apps: moduleCount, poles: moduleGroups.length })}</span></div>
        {isSuperAdmin && <div className="mt-6 mb-5 rounded-2xl border border-accent/30 bg-accent/5 p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-accent">{t('home.adminLabel')}</p><h3 className="mt-1 font-bold">{t('home.adminTitle')}</h3><p className="mt-1 text-sm text-muted-foreground">{t('home.adminDesc')}</p></div><Link href="/hidden-concepteur-gate/dashboard" className="btn-primary shrink-0">{t('home.adminOpen')}<ArrowRight size={16}/></Link></div></div>}
        <div className="mt-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
          <label htmlFor="jdv-module-search" className="mb-2 block text-sm font-bold">{t('home.searchLabel')}</label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input id="jdv-module-search" type="search" value={moduleSearch} onChange={(event) => setModuleSearch(event.target.value)} placeholder={t('home.searchPlaceholder')} className="min-h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20" />
            <span className="shrink-0 text-sm text-muted-foreground">{t('home.searchCount', { shown: visibleCount, total: moduleCount })}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{t('home.searchHint')}</p>
        </div>
        <div className="mt-6 space-y-8">
          {visibleGroups.map((group, groupIndex) => <section key={group.id} aria-labelledby={`module-group-${group.id}`} className="rounded-3xl border border-border bg-card/50 p-4 sm:p-6">
            <div className="mb-5 flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full" style={{backgroundColor:group.accent}}/><h3 id={`module-group-${group.id}`} className="text-lg font-extrabold">{group.title}</h3></div><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{group.description}</p></div>
              <span className="shrink-0 text-xs font-semibold text-muted-foreground">{String(groupIndex + 1).padStart(2, '0')} · {t(group.modules.length > 1 ? 'home.groupMany' : 'home.groupOne', { n: group.modules.length })}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.modules.map(({id,name,description,href,icon:Icon})=><Link href={href} key={id} className="group rounded-2xl border border-border bg-background p-4 text-start transition hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg"><div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><Icon size={19}/></div><h4 className="font-bold">{name}</h4><p className="mt-1 min-h-10 text-sm leading-5 text-muted-foreground">{description}</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-accent">{t('home.open')} <ArrowRight size={13} className="rtl:rotate-180"/></span></Link>)}
            </div>
          </section>)}
          {visibleGroups.length === 0 && <div className="rounded-2xl border border-dashed border-border p-8 text-center"><h3 className="font-bold">{t('home.noneTitle')}</h3><p className="mt-2 text-sm text-muted-foreground">{t('home.noneDesc')}</p></div>}
        </div>
      </section>
      <AssistantWidget />
    </main>
  );
}
