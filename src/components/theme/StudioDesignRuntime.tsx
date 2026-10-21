'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

type Rule = { selector: string; styles: Record<string, string> };
type EditorConfig = { rulesByPath?: Record<string, Rule[]> };

function cssEscape(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

export default function StudioDesignRuntime() {
  useEffect(() => {
    let active = true;
    const styleId = 'jdv-visual-design-overrides';
    const load = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from('jdv_studio_settings').select('config').eq('scope_key', 'global').maybeSingle();
        if (!active || error) return;
        const config = data?.config as { designEditor?: EditorConfig } | null;
        const path = window.location.pathname;
        const rules = config?.designEditor?.rulesByPath?.[path] ?? [];
        const css = rules.map(rule => {
          const declarations = Object.entries(rule.styles)
            .filter(([key, value]) => /^[a-z-]+$/.test(key) && typeof value === 'string' && !/[{};]/.test(value))
            .map(([key, value]) => `${key}: ${value} !important;`).join(' ');
          return declarations ? `${rule.selector} { ${declarations} }` : '';
        }).filter(Boolean).join('\n');
        document.getElementById(styleId)?.remove();
        if (!css) return;
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = css;
        document.head.appendChild(style);
      } catch {
        // L'application continue de fonctionner si les réglages du Studio ne sont pas accessibles.
      }
    };
    void load();
    return () => { active = false; };
  }, []);
  return null;
}
