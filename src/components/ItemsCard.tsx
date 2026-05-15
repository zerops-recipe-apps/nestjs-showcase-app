import { useEffect, useState } from 'react';
import { createItem, deleteItem, listItems, type Item } from '../lib/api';
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
  onItemsChanged?: () => void;
}

export function ItemsCard({ onItemsChanged }: Props) {
  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const data = await listItems(10);
      setItems(data.items);
      setTotal(data.total);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onCreate() {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Name is required');
      return;
    }
    setBusy(true);
    try {
      await createItem(trimmed, description.trim() || null);
      setName('');
      setDescription('');
      await refresh();
      onItemsChanged?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: number) {
    setBusy(true);
    try {
      await deleteItem(id);
      await refresh();
      onItemsChanged?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card data-feature="items">
      <CardHeader
        title="Items / DB"
        subtitle="postgres@18 — CRUD"
        status={{ tone: total > 0 ? 'ok' : 'idle', label: 'live' }}
      />
      <div className="flex items-center justify-between gap-4">
        <Counter label="rows" value={total} testId="items-count" />
        <Badge tone="muted">SELECT COUNT(*) FROM items</Badge>
      </div>
      <ErrorBanner message={error} />
      <div className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-xs text-[var(--zerops-on-surface-muted)]">
          Name
          <TextInput
            value={name}
            placeholder="e.g. queued job"
            onChange={(e) => setName(e.target.value)}
            data-feature="create-item-name"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-[var(--zerops-on-surface-muted)]">
          Description (optional)
          <TextInput
            value={description}
            placeholder="short description"
            onChange={(e) => setDescription(e.target.value)}
            data-feature="create-item-description"
          />
        </label>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void onCreate()}
            disabled={busy}
            data-feature="create-item"
          >
            {busy ? 'Saving…' : 'Create item'}
          </Button>
        </div>
      </div>
      <ul
        className="flex flex-col gap-1.5"
        aria-label="Recent items"
        data-test="items-list"
      >
        {items.length === 0 ? (
          <li className="text-xs text-[var(--zerops-on-surface-muted)]">
            No items yet — create one above.
          </li>
        ) : null}
        {items.slice(0, 5).map((it) => (
          <li
            key={it.id}
            className="flex items-center justify-between gap-2 rounded-[8px] border border-[var(--zerops-outline-variant)] px-3 py-1.5"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm text-[var(--zerops-on-surface)]">
                {it.name}
              </div>
              {it.description ? (
                <div className="truncate text-xs text-[var(--zerops-on-surface-muted)]">
                  {it.description}
                </div>
              ) : null}
            </div>
            <Button
              variant="ghost"
              type="button"
              onClick={() => void onDelete(it.id)}
              disabled={busy}
              className="text-[var(--zerops-error)]"
              data-feature={`delete-item-${it.id}`}
            >
              Delete
            </Button>
          </li>
        ))}
      </ul>
      <CardFootnote>
        Newest-first. Row count survives container restarts (postgres
        persistent volume).
      </CardFootnote>
    </Card>
  );
}
