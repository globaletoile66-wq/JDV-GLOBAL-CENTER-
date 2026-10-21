import { extraMessages } from './i18n-extra';

export type JDVLanguage = 'fr' | 'en' | 'pt' | 'es' | 'ar';

const messages: Record<JDVLanguage, Record<string, string>> = {
  fr: {
    branches:'Explorer les branches', analytics:'Mode analytique', settings:'Paramétrage', marketplace:'Explorer Marketplace',
    registerBusiness:'Enregistrer mon entreprise', superAdmin:'Super Admin', designerStudio:'Studio Concepteur',
    login:'Connexion', mySpace:'Mon espace', studioTitle:'Studio de configuration globale',
    studioDescription:'Personnalisez l’identité visuelle et choisissez la langue préférée de l’interface.',
    visualIdentity:'Identité visuelle', primaryColor:'Couleur principale', accentColor:'Couleur d’accent',
    applyTheme:'Appliquer le thème', reset:'Réinitialiser', language:'Langue de l’interface',
    preferredLanguage:'Langue préférée', preview:'Aperçu', savedTheme:'Thème appliqué et enregistré sur cet appareil.',
  },
  en: {
    branches:'Explore branches', analytics:'Analytics mode', settings:'Settings', marketplace:'Explore Marketplace',
    registerBusiness:'Register my business', superAdmin:'Super Admin', designerStudio:'Designer Studio',
    login:'Sign in', mySpace:'My space', studioTitle:'Global configuration studio',
    studioDescription:'Customize the visual identity and choose the preferred interface language.',
    visualIdentity:'Visual identity', primaryColor:'Primary color', accentColor:'Accent color',
    applyTheme:'Apply theme', reset:'Reset', language:'Interface language',
    preferredLanguage:'Preferred language', preview:'Preview', savedTheme:'Theme applied and saved on this device.',
  },
  pt: {
    branches:'Explorar áreas', analytics:'Modo analítico', settings:'Configurações', marketplace:'Explorar Marketplace',
    registerBusiness:'Registar a minha empresa', superAdmin:'Super Admin', designerStudio:'Estúdio do Designer',
    login:'Entrar', mySpace:'O meu espaço', studioTitle:'Estúdio de configuração global',
    studioDescription:'Personalize a identidade visual e escolha o idioma preferido da interface.',
    visualIdentity:'Identidade visual', primaryColor:'Cor principal', accentColor:'Cor de destaque',
    applyTheme:'Aplicar tema', reset:'Repor', language:'Idioma da interface',
    preferredLanguage:'Idioma preferido', preview:'Pré-visualização', savedTheme:'Tema aplicado e guardado neste dispositivo.',
  },
  es: {
    branches:'Explorar áreas', analytics:'Modo analítico', settings:'Configuración', marketplace:'Explorar Marketplace',
    registerBusiness:'Registrar mi empresa', superAdmin:'Super Admin', designerStudio:'Estudio del diseñador',
    login:'Iniciar sesión', mySpace:'Mi espacio', studioTitle:'Estudio de configuración global',
    studioDescription:'Personalice la identidad visual y elija el idioma preferido de la interfaz.',
    visualIdentity:'Identidad visual', primaryColor:'Color principal', accentColor:'Color de acento',
    applyTheme:'Aplicar tema', reset:'Restablecer', language:'Idioma de la interfaz',
    preferredLanguage:'Idioma preferido', preview:'Vista previa', savedTheme:'Tema aplicado y guardado en este dispositivo.',
  },
  ar: {
    branches:'استكشاف الفروع', analytics:'الوضع التحليلي', settings:'الإعدادات', marketplace:'استكشاف السوق',
    registerBusiness:'تسجيل شركتي', superAdmin:'المشرف الأعلى', designerStudio:'استوديو المصمم',
    login:'تسجيل الدخول', mySpace:'مساحتي', studioTitle:'استوديو الإعدادات العامة',
    studioDescription:'خصص الهوية البصرية واختر اللغة المفضلة للواجهة.',
    visualIdentity:'الهوية البصرية', primaryColor:'اللون الأساسي', accentColor:'لون التمييز',
    applyTheme:'تطبيق المظهر', reset:'إعادة ضبط', language:'لغة الواجهة',
    preferredLanguage:'اللغة المفضلة', preview:'معاينة', savedTheme:'تم تطبيق المظهر وحفظه على هذا الجهاز.',
  },
};

function lookup(language: string, key: string): string | undefined {
  const locale = (language in messages ? language : 'fr') as JDVLanguage;
  return messages[locale][key] ?? extraMessages[locale]?.[key] ?? messages.fr[key] ?? extraMessages.fr[key];
}

function interpolate(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export function translate(language: string, key: string, vars?: Record<string, string | number>): string {
  return interpolate(lookup(language, key) ?? key, vars);
}

/** Comme translate, mais renvoie le texte de repli (au lieu de la clé) si la clé n’existe dans aucune langue. */
export function translateOr(language: string, key: string, fallback: string, vars?: Record<string, string | number>): string {
  return interpolate(lookup(language, key) ?? fallback, vars);
}
