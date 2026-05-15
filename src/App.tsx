import { useState } from 'react';
import { API_BASE } from './lib/api';
import { StatusStrip } from './components/StatusStrip';
import { ItemsCard } from './components/ItemsCard';
import { CacheCard } from './components/CacheCard';
import { QueueCard } from './components/QueueCard';
import { StorageCard } from './components/StorageCard';
import { SearchCard } from './components/SearchCard';

/*
 * Dashboard layout — full-width status strip on top, then a 3→2→1 col
 * responsive grid of category cards in the canonical order Items /
 * Cache / Queue / Storage / Search. Each card owns its own state +
 * trigger; cross-card integration (queue → search) is wired via a
 * single shared "indexed" hint propagated from QueueCard upward.
 */

export default function App() {
  const [indexedHint, setIndexedHint] = useState<number | null>(null);
  const [itemsBumpedAt, setItemsBumpedAt] = useState(0);

  return (
    <div className="min-h-screen bg-[var(--zerops-bg)] text-[var(--zerops-on-surface)]">
      <header className="border-b border-[var(--zerops-outline-variant)] bg-[var(--zerops-surface)]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-baseline justify-between gap-3 px-6 py-4">
          <div className="flex items-baseline gap-3">
            <h1 className="font-[var(--zerops-font-head)] text-2xl font-semibold">
              NestJS Showcase
            </h1>
            <span className="text-xs uppercase tracking-wide text-[var(--zerops-on-surface-muted)]">
              dashboard
            </span>
          </div>
          <p className="font-mono text-xs text-[var(--zerops-on-surface-muted)]">
            api: {API_BASE || '(unset)'}
          </p>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1280px] flex-col gap-6 px-6 py-6">
        <StatusStrip />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ItemsCard
            key={itemsBumpedAt}
            onItemsChanged={() => setItemsBumpedAt(Date.now())}
          />
          <CacheCard />
          <QueueCard onIndexedChanged={(n) => setIndexedHint(n)} />
          <StorageCard />
          <SearchCard indexedHint={indexedHint} />
        </div>
      </main>
    </div>
  );
}
