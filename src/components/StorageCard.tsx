import { useEffect, useRef, useState } from 'react';
import {
  storageState,
  storageUploadBlob,
  storageUploadFile,
  type StorageObject,
} from '../lib/api';
import {
  Badge,
  Button,
  Card,
  CardFootnote,
  CardHeader,
  Counter,
  ErrorBanner,
} from './ui';

export function StorageCard() {
  const [count, setCount] = useState(0);
  const [recent, setRecent] = useState<StorageObject[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function refresh() {
    try {
      const data = await storageState();
      setCount(data.count);
      setRecent(data.recent);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function onBlobUpload() {
    setBusy(true);
    setError(null);
    setAttempts((n) => n + 1);
    try {
      const stamp = Date.now();
      const blob = new Blob(
        [`dashboard upload generated at ${new Date(stamp).toISOString()}\n`],
        { type: 'text/plain' },
      );
      await storageUploadBlob(`dashboard-upload-${stamp}.txt`, blob);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onFileUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError('Choose a file first');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await storageUploadFile(file);
      setSelectedName(null);
      if (fileRef.current) fileRef.current.value = '';
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card data-feature="storage">
      <CardHeader
        title="Storage"
        subtitle="object-storage — signed URLs"
        status={{ tone: count > 0 ? 'ok' : 'idle', label: 'live' }}
      />
      <div className="flex items-end justify-between gap-4">
        <Counter label="objects" value={count} testId="storage-objects" />
        <Counter
          label="upload attempts"
          value={attempts}
          testId="storage-upload-attempts"
          tone="muted"
        />
      </div>
      <ErrorBanner message={error} />

      {/* File selector — for human porters. Native chrome is hidden via
          sr-only; the label projects the design-token vocabulary so the
          card stays visually consistent. */}
      <div className="flex flex-col gap-2 rounded-[8px] border border-[var(--zerops-outline-variant)] p-3">
        <span className="text-xs uppercase tracking-wide text-[var(--zerops-on-surface-muted)]">
          Upload your own file
        </span>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-[var(--zerops-radius-pill)] border border-[var(--zerops-outline-variant)] bg-[var(--zerops-surface)] px-4 py-2 text-sm text-[var(--zerops-on-surface)] hover:border-[var(--zerops-primary)]">
            <input
              ref={fileRef}
              type="file"
              data-feature="upload-file"
              className="sr-only"
              onChange={(e) => setSelectedName(e.target.files?.[0]?.name ?? null)}
            />
            Select file
          </label>
          <span className="truncate text-xs text-[var(--zerops-on-surface-muted)]">
            {selectedName ?? 'No file chosen'}
          </span>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void onFileUpload()}
            disabled={busy || !selectedName}
            data-feature="upload-selected"
          >
            Upload selected
          </Button>
        </div>
      </div>

      {/* Blob fallback — the browser-walk path (no file dialog). */}
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => void onBlobUpload()}
          disabled={busy}
          data-feature="upload"
        >
          {busy ? 'Uploading…' : 'Upload sample blob'}
        </Button>
      </div>
      <ul
        className="flex flex-col gap-1.5"
        aria-label="Recent uploads"
        data-test="storage-recent"
      >
        {recent.length === 0 ? (
          <li>
            <Badge tone="muted">No uploads yet</Badge>
          </li>
        ) : null}
        {recent.slice(0, 3).map((obj) => (
          <li
            key={obj.key}
            className="flex items-center justify-between gap-2 rounded-[8px] border border-[var(--zerops-outline-variant)] px-3 py-1.5"
          >
            <span className="truncate font-mono text-xs text-[var(--zerops-on-surface)]">
              {obj.key.replace(/^uploads\//, '')}
            </span>
            <span className="font-mono text-xs text-[var(--zerops-on-surface-muted)]">
              {obj.size}B
            </span>
          </li>
        ))}
      </ul>
      <CardFootnote>
        Signed URLs expire in 5min. Object count survives container
        restarts (object-storage). Sample-blob path is the
        zerops_browser-friendly affordance.
      </CardFootnote>
    </Card>
  );
}
