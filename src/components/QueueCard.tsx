import { useEffect, useState } from 'react';
import {
  queuePublish,
  queueState,
  searchState,
  type QueueEvent,
} from '../lib/api';
import {
  Badge,
  Button,
  Card,
  CardFootnote,
  CardHeader,
  Chip,
  Counter,
  ErrorBanner,
} from './ui';

interface Props {
  onIndexedChanged?: (indexed: number) => void;
}

export function QueueCard({ onIndexedChanged }: Props) {
  const [processed, setProcessed] = useState(0);
  const [events, setEvents] = useState<QueueEvent[]>([]);
  const [pending, setPending] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastConverged, setLastConverged] = useState<string | null>(null);

  async function refresh() {
    try {
      const data = await queueState();
      setProcessed(data.processed);
      setEvents(data.events);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onPublish() {
    setBusy(true);
    setError(null);
    setLastConverged(null);
    setPending((p) => p + 1);
    try {
      const stamp = new Date().toISOString();
      const message = `dashboard publish at ${stamp}`;
      await queuePublish('dashboard', message);
      // Bounded poll: the worker writes the item into postgres + nudges
      // meilisearch; converge once the searched-index count grows or
      // queue.processed increments. 500ms tick, 5s ceiling.
      const before = (await searchState()).indexed;
      const deadline = Date.now() + 5000;
      let converged = false;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 500));
        const [q, s] = await Promise.all([queueState(), searchState()]);
        setProcessed(q.processed);
        setEvents(q.events);
        if (s.indexed > before) {
          converged = true;
          onIndexedChanged?.(s.indexed);
          setLastConverged(`+${s.indexed - before} indexed within ${(5000 - (deadline - Date.now())) / 1000}s`);
          break;
        }
      }
      if (!converged) {
        setLastConverged('processed but index did not change within 5s');
      }
      setPending((p) => Math.max(0, p - 1));
    } catch (err) {
      setError((err as Error).message);
      setPending((p) => Math.max(0, p - 1));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card data-feature="queue">
      <CardHeader
        title="Queue / Broker"
        subtitle="nats@2.12 — worker round-trip"
        status={{ tone: processed > 0 ? 'ok' : 'idle', label: 'live' }}
      />
      <div className="flex items-end justify-between gap-4">
        <Counter label="processed" value={processed} testId="queue-processed" />
        <Counter label="pending" value={pending} testId="queue-pending" tone="warning" />
      </div>
      <ErrorBanner message={error} />
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => void onPublish()}
          disabled={busy}
          data-feature="publish"
        >
          {busy ? 'Publishing…' : 'Publish job'}
        </Button>
      </div>
      <ul
        className="flex flex-wrap gap-2"
        aria-label="Recent queue events"
        data-test="queue-events"
      >
        {events.length === 0 ? (
          <li>
            <Badge tone="muted">No events yet</Badge>
          </li>
        ) : null}
        {events.slice(0, 3).map((evt, i) => (
          <li key={`${evt.receivedAt}-${i}`}>
            <Chip>
              <span className="font-mono">{evt.subject}</span>
            </Chip>
          </li>
        ))}
      </ul>
      <CardFootnote>
        Publishes <code className="font-mono">showcase.jobs.dashboard</code>;
        worker consumes and persists. The search card's indexed count
        increments within 5s on success.{' '}
        {lastConverged ? <span className="font-mono">[{lastConverged}]</span> : null}
      </CardFootnote>
    </Card>
  );
}
