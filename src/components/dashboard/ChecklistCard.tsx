import Link from 'next/link';
import type { ChecklistItem } from '@/lib/dashboard/types';

export default function ChecklistCard({ items }: { items: ChecklistItem[] }) {
  const todo = items.filter((i) => !i.done);
  if (todo.length === 0) return null;
  const done = items.length - todo.length;
  return (
    <section aria-labelledby="todo-title" className="jdv-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 id="todo-title" className="font-bold text-foreground">Pour bien démarrer</h2>
        <p className="text-xs text-muted-foreground">{done} sur {items.length} terminé(s)</p>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={done} aria-label="Progression">
        <div className="h-full rounded-full bg-accent" style={{ width: `${(done / items.length) * 100}%` }} />
      </div>
      <ul className="mt-4 space-y-2">
        {items.map((i) => (
          <li key={i.key} className="flex items-center justify-between gap-3 text-sm">
            <span className={i.done ? 'text-muted-foreground line-through' : 'text-foreground'}>
              <span aria-hidden className="mr-2">{i.done ? '✓' : '○'}</span>{i.label}
              {!i.done && i.detail && i.detail.length > 0 ? <span className="text-xs text-muted-foreground"> ({i.detail.join(', ')})</span> : null}
            </span>
            {!i.done && <Link href={i.href} className="shrink-0 text-xs font-medium text-accent hover:underline">Faire</Link>}
          </li>
        ))}
      </ul>
    </section>
  );
}
