import { useEffect, useState } from 'react';
import { search, searchState, type SearchHit } from '../lib/api';
import {
  Badge,
  Button,
  Card,
  CardFootnote,
  CardHeader,
  Counter,
  ErrorBanner,
  TextInput,
} from './ui';

interface Props {
  indexedHint: number | null;
}

export function SearchCard({ indexedHint }: Props) {
  const [query, setQuery] = useState('');
  const [indexed, setIndexed] = useState<number>(0);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshIndexed() {
    try {
      const data = await searchState();
      setIndexed(data.indexed);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    void refreshIndexed();
  }, []);

  useEffect(() => {
    if (indexedHint != null) setIndexed(indexedHint);
  }, [indexedHint]);

  async function onSearch() {
    setBusy(true);
    setError(null);
    try {
      // Pull the live DOM value so a fast fill+click sequence in
      // browser automation reaches the network request even if React's
      // controlled-state update hasn't yet flushed to a re-render.
      const input = document.querySelector<HTMLInputElement>(
        "[data-feature='search-input']",
      );
      const liveValue = input?.value ?? query;
      const trimmed = liveValue.trim();
      setLastQuery(trimmed);
      const data = await search(trimmed, 10);
      setHits(data.hits);
      setTotal(data.total);
      setIndexed(data.indexed);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card data-feature="search-card">
      <CardHeader
        title="Search"
        subtitle="meilisearch@1.20 — full-text"
        status={{ tone: indexed > 0 ? 'ok' : 'idle', label: 'live' }}
      />
      <div className="flex items-end justify-between gap-4">
        <Counter label="indexed" value={indexed} testId="search-indexed" />
        <Counter
          label="last result count"
          value={total}
          testId="search-total"
          tone="muted"
        />
      </div>
      <ErrorBanner message={error} />
      <div className="flex flex-col gap-2">
        <TextInput
          placeholder="search (e.g. cache, queue, welcome)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void onSearch();
          }}
          data-feature="search-input"
        />
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void onSearch()}
            disabled={busy}
            data-feature="search"
          >
            {busy ? 'Searching…' : 'Search'}
          </Button>
        </div>
      </div>
      <span className="hidden" data-test="search-last-query">
        {lastQuery}
      </span>
      <ol
        className="flex flex-col gap-1.5"
        aria-label="Search results"
        data-test="search-results"
      >
        {hits.length === 0 ? (
          <li className="text-xs text-[var(--zerops-on-surface-muted)]">
            {lastQuery ? 'No matches.' : 'Type a query to search the items index.'}
          </li>
        ) : null}
        {hits.slice(0, 5).map((hit) => (
          <li
            key={hit.id}
            className="flex items-center justify-between gap-2 rounded-[8px] border border-[var(--zerops-outline-variant)] px-3 py-1.5"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-[var(--zerops-on-surface)]">
                {hit.name}
              </div>
              {hit.description ? (
                <div className="truncate text-xs text-[var(--zerops-on-surface-muted)]">
                  {hit.description}
                </div>
              ) : null}
            </div>
            <Badge tone="muted">#{hit.id}</Badge>
          </li>
        ))}
      </ol>
      <CardFootnote>
        Ranked by relevance, not recency. Indexed count updates after
        item create / queue publish.
      </CardFootnote>
    </Card>
  );
}
