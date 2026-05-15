import { useEffect, useState } from 'react';
import { cacheDemo, cacheState } from '../lib/api';
import {
  Badge,
  Button,
  Card,
  CardFootnote,
  CardHeader,
  Counter,
  ErrorBanner,
} from './ui';

export function CacheCard() {
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [headerCache, setHeaderCache] = useState<string | null>(null);
  const [headerElapsedMs, setHeaderElapsedMs] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const data = await cacheState();
      setHits(data.hits);
      setMisses(data.misses);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onFetch() {
    setBusy(true);
    setError(null);
    try {
      const data = await cacheDemo();
      setHeaderCache(data.headerCache);
      setHeaderElapsedMs(data.headerElapsedMs);
      // The body's hits/misses snapshot is authoritative because it
      // captures the increment for THIS request without an extra round
      // trip; we refetch /api/cache/state afterwards so the panel keeps
      // the canonical source-of-truth lane intact (state endpoint).
      setHits(data.body.hits);
      setMisses(data.body.misses);
      // Belt-and-braces refresh in case another tab triggered a
      // concurrent request.
      void refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const tone =
    headerCache === 'HIT' ? 'success' : headerCache === 'MISS' ? 'warning' : 'muted';
  const badgeLabel = headerCache ?? '—';

  return (
    <Card data-feature="cache">
      <CardHeader
        title="Cache"
        subtitle="valkey@7.2 — read-through demo"
        status={{ tone: hits + misses > 0 ? 'ok' : 'idle', label: 'live' }}
      />
      <div className="flex items-center justify-between gap-4">
        <Badge tone={tone} testId="cache-state-badge">
          {badgeLabel}
        </Badge>
        <span className="font-mono text-xs text-[var(--zerops-on-surface-muted)]">
          {headerElapsedMs ? `${headerElapsedMs}ms` : '—'}
        </span>
      </div>
      <div className="flex items-end justify-between gap-4">
        <Counter label="hits" value={hits} testId="cache-hits" tone="success" />
        <Counter label="misses" value={misses} testId="cache-misses" tone="warning" />
      </div>
      <ErrorBanner message={error} />
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => void onFetch()}
          disabled={busy}
          data-feature="cache-fetch"
        >
          {busy ? 'Fetching…' : 'Fetch demo payload'}
        </Button>
      </div>
      <CardFootnote>
        First call is a MISS (60s TTL), subsequent calls are HITs until
        the key expires. The badge value is the X-Cache header, the
        load-bearing proof.
      </CardFootnote>
    </Card>
  );
}
