import { useEffect, useState } from 'react';
import { servicesState, type ServiceStatus } from '../lib/api';
import { MutedText } from './ui';

/*
 * Status strip — leading dashboard element answering "is anything
 * wired?" before the porter touches a card. Each provisioned managed
 * service renders as `[data-test="status-<service>"]` with a colored
 * dot mirroring the per-card status indicator. The strip refetches on
 * mount and exposes a manual refresh affordance.
 */
export function StatusStrip() {
  const [services, setServices] = useState<ServiceStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const data = await servicesState();
      setServices(data.services);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  return (
    <section
      aria-label="Status strip"
      className="rounded-[var(--zerops-radius-card)] border border-[var(--zerops-outline-variant)] bg-[var(--zerops-surface)] p-4"
      data-feature="status-strip"
    >
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--zerops-on-surface-muted)]">
            Services
          </span>
          <MutedText>
            {loading
              ? 'Probing…'
              : error
                ? `Error: ${error}`
                : `${services?.filter((s) => s.status === 'ok').length ?? 0}/${services?.length ?? 0} ok`}
          </MutedText>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {(services ?? []).map((s) => (
            <li key={s.name} className="flex items-center gap-2" data-test={`status-${s.name}`}>
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  s.status === 'ok'
                    ? 'bg-[var(--zerops-success)]'
                    : 'bg-[var(--zerops-error)]'
                }`}
                aria-hidden
              />
              <span className="font-mono text-xs text-[var(--zerops-on-surface)]">
                {s.name}
              </span>
              <span className="text-xs uppercase tracking-wide text-[var(--zerops-on-surface-muted)]">
                {s.status}
              </span>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => void refresh()}
          className="ml-auto text-xs text-[var(--zerops-primary)] hover:underline"
          data-feature="status-refresh"
        >
          Refresh
        </button>
      </div>
    </section>
  );
}
