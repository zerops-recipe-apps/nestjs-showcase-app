import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';

/*
 * Token-driven UI primitives. Every visual property the design-system
 * spec calls out (color, radius, type) flows through CSS variables
 * declared in styles.css — the component classes consume them via the
 * Tailwind arbitrary-property syntax (`bg-[var(--zerops-primary)]`)
 * rather than hardcoded hex codes or Tailwind palette names.
 */

type CardProps = HTMLAttributes<HTMLElement> & { as?: keyof JSX.IntrinsicElements };

export function Card({ as, className = '', children, ...rest }: CardProps) {
  const Tag = (as ?? 'section') as keyof JSX.IntrinsicElements;
  return (
    <Tag
      className={[
        'rounded-[var(--zerops-radius-card)] border bg-[var(--zerops-surface)] p-6',
        'border-[var(--zerops-outline-variant)] shadow-sm/0',
        'flex flex-col gap-4',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  subtitle,
  status,
  className = '',
}: {
  title: string;
  subtitle?: string;
  status?: { tone: 'ok' | 'down' | 'idle'; label?: string };
  className?: string;
}) {
  const dotColor =
    status?.tone === 'ok'
      ? 'bg-[var(--zerops-success)]'
      : status?.tone === 'down'
        ? 'bg-[var(--zerops-error)]'
        : 'bg-[var(--zerops-outline-variant)]';
  return (
    <header className={['flex items-start justify-between gap-3', className].join(' ')}>
      <div className="flex flex-col gap-1">
        <h2 className="font-[var(--zerops-font-head)] text-xl font-semibold leading-tight text-[var(--zerops-on-surface)]">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm text-[var(--zerops-on-surface-muted)]">{subtitle}</p>
        ) : null}
      </div>
      {status ? (
        <div className="mt-1 flex items-center gap-2 whitespace-nowrap">
          <span className={`inline-block h-2 w-2 rounded-full ${dotColor}`} aria-hidden />
          <span className="text-xs uppercase tracking-wide text-[var(--zerops-on-surface-muted)]">
            {status.label ?? status.tone}
          </span>
        </div>
      ) : null}
    </header>
  );
}

export function Counter({
  label,
  value,
  testId,
  tone,
}: {
  label: string;
  value: ReactNode;
  testId?: string;
  tone?: 'primary' | 'success' | 'warning' | 'muted';
}) {
  const color =
    tone === 'success'
      ? 'text-[var(--zerops-success)]'
      : tone === 'warning'
        ? 'text-[var(--zerops-warning)]'
        : tone === 'muted'
          ? 'text-[var(--zerops-on-surface-muted)]'
          : 'text-[var(--zerops-primary)]';
  return (
    <div className="flex flex-col gap-0.5">
      <span
        className={`font-[var(--zerops-font-head)] text-3xl font-semibold leading-none ${color}`}
        data-test={testId}
      >
        {value}
      </span>
      <span className="text-xs uppercase tracking-wide text-[var(--zerops-on-surface-muted)]">
        {label}
      </span>
    </div>
  );
}

export function Badge({
  tone,
  children,
  testId,
}: {
  tone: 'success' | 'warning' | 'error' | 'primary' | 'muted';
  children: ReactNode;
  testId?: string;
}) {
  const bg =
    tone === 'success'
      ? 'bg-[var(--zerops-success)]'
      : tone === 'warning'
        ? 'bg-[var(--zerops-warning)]'
        : tone === 'error'
          ? 'bg-[var(--zerops-error)]'
          : tone === 'primary'
            ? 'bg-[var(--zerops-primary)]'
            : 'bg-[var(--zerops-outline-variant)]';
  const fg =
    tone === 'muted'
      ? 'text-[var(--zerops-on-surface)]'
      : 'text-[var(--zerops-primary-on)]';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-[var(--zerops-radius-pill)] px-3 py-1 text-xs font-semibold uppercase tracking-wide ${bg} ${fg}`}
      data-test={testId}
    >
      {children}
    </span>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>(
  function Button({ variant = 'primary', className = '', ...rest }, ref) {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-[var(--zerops-radius-pill)] px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60';
    const variantClasses =
      variant === 'primary'
        ? 'bg-[var(--zerops-primary)] text-[var(--zerops-primary-on)] hover:opacity-90'
        : variant === 'secondary'
          ? 'border border-[var(--zerops-outline-variant)] bg-[var(--zerops-surface)] text-[var(--zerops-on-surface)] hover:border-[var(--zerops-primary)]'
          : 'text-[var(--zerops-primary)] hover:underline';
    return <button ref={ref} className={[base, variantClasses, className].join(' ')} {...rest} />;
  },
);

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className = '', ...rest }, ref) {
    return (
      <input
        ref={ref}
        className={[
          'w-full rounded-[8px] border border-[var(--zerops-outline-variant)] bg-[var(--zerops-surface)] px-3 py-2 text-sm text-[var(--zerops-on-surface)] outline-none transition',
          'placeholder:text-[var(--zerops-on-surface-muted)]',
          'focus:border-[var(--zerops-primary)] focus:ring-2 focus:ring-[var(--zerops-primary)]/30',
          className,
        ].join(' ')}
        {...rest}
      />
    );
  },
);

export function Chip({ children, testId }: { children: ReactNode; testId?: string }) {
  return (
    <span
      className="inline-flex max-w-full items-center gap-1 truncate rounded-[var(--zerops-radius-pill)] border border-[var(--zerops-outline-variant)] bg-[var(--zerops-surface)] px-3 py-1 text-xs text-[var(--zerops-on-surface)]"
      data-test={testId}
    >
      {children}
    </span>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      className="rounded-[8px] border border-[var(--zerops-error)] bg-[var(--zerops-error)]/10 px-3 py-2 text-xs text-[var(--zerops-error)]"
      role="alert"
    >
      {message}
    </p>
  );
}

export function MutedText({ children }: { children: ReactNode }) {
  return <span className="text-xs text-[var(--zerops-on-surface-muted)]">{children}</span>;
}

export function CardFootnote({ children }: { children: ReactNode }) {
  return (
    <p className="text-xs text-[var(--zerops-on-surface-muted)]">{children}</p>
  );
}
