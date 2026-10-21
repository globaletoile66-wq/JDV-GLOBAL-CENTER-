'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Rule = { selector: string; styles: Record<string, string>; text?: string; blockId?: string };
type StudioBlock = { id: string; kind: 'section' | 'text' | 'button' | 'card'; text: string };
type EditorConfig = {
  rulesByPath?: Record<string, Rule[]>;
  blocksByPath?: Record<string, StudioBlock[]>;
};

const blockStyles: Record<StudioBlock['kind'], string> = {
  button: 'display:inline-block;padding:12px 18px;margin:10px;background:#4f46e5;color:#fff;border:0;border-radius:10px;font-weight:700;cursor:pointer',
  card: 'display:block;padding:24px;margin:16px 0;background:#fff;color:#172033;border:1px solid #dbeafe;border-radius:16px;box-shadow:0 8px 24px #0f172a12',
  section: 'display:block;min-height:100px;padding:28px;margin:16px 0;background:#f1f5f9;color:#172033;border-radius:16px',
  text: 'padding:8px;margin:8px 0;font-size:18px;color:#172033',
};

export default function StudioDesignRuntime() {
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    const styleId = 'jdv-visual-design-overrides';

    const load = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('jdv_studio_settings')
          .select('config')
          .eq('scope_key', 'global')
          .maybeSingle();
        if (!active || error) return;

        const config = data?.config as { designEditor?: EditorConfig } | null;
        const editor = config?.designEditor;
        const rules = editor?.rulesByPath?.[pathname] ?? [];
        const blocks = editor?.blocksByPath?.[pathname] ?? [];

        document.getElementById(styleId)?.remove();
        const css = rules
          .filter(rule => !rule.blockId)
          .map(rule => {
            let selector = '';
            try {
              // Ignore invalid or empty selectors rather than breaking the rest of the design.
              selector = rule.selector.trim();
              if (!selector) return '';
              document.createDocumentFragment().querySelector(selector);
            } catch {
              return '';
            }
            const declarations = Object.entries(rule.styles ?? {})
              .filter(([key, value]) => /^[a-z-]+$/.test(key) && typeof value === 'string' && !/[{};]/.test(value))
              .map(([key, value]) => `${key}: ${value} !important;`)
              .join(' ');
            return declarations ? `${selector} { ${declarations} }` : '';
          })
          .filter(Boolean)
          .join('\n');

        if (css) {
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = css;
          document.head.appendChild(style);
        }

        // Direct text changes are applied only to leaf nodes to preserve React component structure.
        for (const rule of rules) {
          if (typeof rule.text !== 'string' || rule.blockId) continue;
          try {
            const element = document.querySelector(rule.selector);
            if (element && element.children.length === 0) element.textContent = rule.text;
          } catch {
            // A stale selector is ignored; the rest of the page remains available.
          }
        }

        // Remove previous page-specific custom blocks before restoring the saved composition.
        document.querySelectorAll('[data-jdv-studio-block]').forEach(node => node.remove());
        const host = document.querySelector('main') ?? document.body;
        for (const block of blocks) {
          const element = document.createElement(block.kind === 'button' ? 'button' : block.kind === 'text' ? 'p' : 'section');
          element.dataset.jdvStudioBlock = block.id;
          element.textContent = block.text;
          (element as HTMLElement).style.cssText = blockStyles[block.kind] ?? blockStyles.text;
          const rule = rules.find(item => item.blockId === block.id);
          if (rule) {
            for (const [key, value] of Object.entries(rule.styles ?? {})) {
              if (/^[a-z-]+$/.test(key) && !/[{};]/.test(value)) {
                (element as HTMLElement).style.setProperty(key, value);
              }
            }
          }
          host.appendChild(element);
        }
      } catch {
        // L'application continue de fonctionner si les réglages du Studio ne sont pas accessibles.
      }
    };

    void load();
    return () => {
      active = false;
      document.getElementById(styleId)?.remove();
    };
  }, [pathname]);

  return null;
}
