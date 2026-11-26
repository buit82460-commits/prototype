import React, { useEffect } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  PauseCircle,
  RefreshCw,
  ShieldAlert,
  X,
  XCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { TaskProgress, TaskStatus } from '../../domain/types';
import { computeProgressPercent } from '../../domain/taskMachine';
import { useTranslation } from '../../i18n/useTranslation';

/* ============================================================================
   BUTTON (Miro Design System: 36px standard / 40px primary, 6px radius)
   ============================================================================ */

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap shrink-0 rounded-[6px] text-[13px] font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-focus-ring)] disabled:pointer-events-none disabled:opacity-45 cursor-pointer select-none',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-accent)] text-[var(--color-text-on-accent)] hover:bg-[var(--color-accent-hover)] active:bg-[var(--color-accent-active)]',
        secondary:
          'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-surface-3)]',
        ghost:
          'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text-primary)]',
        destructive:
          'bg-[var(--color-error-bg)] text-[var(--color-error)] border border-[var(--color-error)]/30 hover:bg-[var(--color-error)] hover:text-white',
        subtleAccent:
          'bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border border-[var(--color-accent-border)] hover:brightness-110',
      },
      size: {
        sm: 'h-8 px-2.5 text-[12px]',
        md: 'h-9 px-3.5',
        lg: 'h-10 px-4',
        icon: 'h-8 w-8 p-0',
        iconMd: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';

/* ============================================================================
   INPUT, TEXTAREA, SELECT
   ============================================================================ */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  highlighted?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, highlighted, id, ...props }, ref) => {
    const inputId = id || (label ? `miro-in-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-[12px] font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-9 w-full rounded-[6px] bg-[var(--color-surface-2)] px-3 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] border transition-colors duration-150 focus:border-[var(--color-focus-ring)] focus:outline-none',
            highlighted
              ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/40 bg-[var(--color-accent-subtle)]/40'
              : error
              ? 'border-[var(--color-error)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
            className
          )}
          {...props}
        />
        {error && <p className="text-[12px] text-[var(--color-error)]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  highlighted?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, highlighted, id, ...props }, ref) => {
    const fieldId = id || (label ? `miro-ta-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-[12px] font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={fieldId}
          className={cn(
            'min-h-[84px] w-full rounded-[6px] bg-[var(--color-surface-2)] px-3 py-2 text-[14px] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] border transition-colors duration-150 focus:border-[var(--color-focus-ring)] focus:outline-none resize-y',
            highlighted
              ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/40 bg-[var(--color-accent-subtle)]/40'
              : error
              ? 'border-[var(--color-error)]'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
            className
          )}
          {...props}
        />
        {error && <p className="text-[12px] text-[var(--color-error)]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  highlighted?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, highlighted, id, children, ...props }, ref) => {
    const fieldId = id || (label ? `miro-sel-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={fieldId} className="text-[12px] font-medium text-[var(--color-text-secondary)]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={fieldId}
          className={cn(
            'h-9 w-full rounded-[6px] bg-[var(--color-surface-2)] px-2.5 text-[13px] text-[var(--color-text-primary)] border transition-colors duration-150 focus:border-[var(--color-focus-ring)] focus:outline-none',
            highlighted
              ? 'border-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/40'
              : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]',
            className
          )}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = 'Select';

/* ============================================================================
   SWITCH
   ============================================================================ */

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors duration-150 cursor-pointer disabled:opacity-45',
        checked
          ? 'bg-[var(--color-accent)] border-[var(--color-accent)]'
          : 'bg-[var(--color-surface-3)] border-[var(--color-border-strong)]'
      )}
    >
      <span
        className={cn(
          'inline-block h-3.5 w-3.5 rounded-full transition-transform duration-150',
          checked
            ? 'translate-x-4 bg-[var(--color-text-on-accent)]'
            : 'translate-x-0.5 bg-[var(--color-text-secondary)]'
        )}
      />
    </button>
  );
}

/* ============================================================================
   CARD & BADGE
   ============================================================================ */

export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[10px] bg-[var(--color-surface-1)] border border-[var(--color-border)] p-4',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export type BadgeTone = 'neutral' | 'accent' | 'success' | 'warning' | 'error' | 'info';

export function StatusTag({
  tone = 'neutral',
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const toneClasses: Record<BadgeTone, string> = {
    neutral: 'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
    accent: 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-text)] border-[var(--color-accent-border)]',
    success: 'bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]/30',
    warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)] border-[var(--color-warning)]/30',
    error: 'bg-[var(--color-error-bg)] text-[var(--color-error)] border-[var(--color-error)]/30',
    info: 'bg-[var(--color-info-bg)] text-[var(--color-info)] border-[var(--color-info)]/30',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 h-[22px] px-2 rounded-[4px] border text-[11px] font-medium whitespace-nowrap shrink-0',
        toneClasses[tone],
        className
      )}
    >
      {icon}
      <span>{children}</span>
    </span>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const { t } = useTranslation();
  const label = t.status[status];

  switch (status) {
    case 'running':
      return <StatusTag tone="accent" icon={<Loader2 className="w-3 h-3 animate-spin" />}>{label}</StatusTag>;
    case 'planning':
    case 'recovering':
      return <StatusTag tone="info" icon={<RefreshCw className="w-3 h-3 animate-spin" />}>{label}</StatusTag>;
    case 'waiting_for_approval':
      return <StatusTag tone="warning" icon={<ShieldAlert className="w-3 h-3" />}>{label}</StatusTag>;
    case 'waiting_for_resource':
      return <StatusTag tone="warning" icon={<Clock className="w-3 h-3" />}>{label}</StatusTag>;
    case 'completed':
      return <StatusTag tone="success" icon={<CheckCircle2 className="w-3 h-3" />}>{label}</StatusTag>;
    case 'partial':
      return <StatusTag tone="warning" icon={<AlertTriangle className="w-3 h-3" />}>{label}</StatusTag>;
    case 'failed':
      return <StatusTag tone="error" icon={<XCircle className="w-3 h-3" />}>{label}</StatusTag>;
    case 'paused':
    case 'pausing':
      return <StatusTag tone="neutral" icon={<PauseCircle className="w-3 h-3" />}>{label}</StatusTag>;
    case 'cancelled':
    case 'cancelling':
      return <StatusTag tone="neutral" icon={<X className="w-3 h-3" />}>{label}</StatusTag>;
    case 'queued':
    default:
      return <StatusTag tone="neutral" icon={<Clock className="w-3 h-3" />}>{label}</StatusTag>;
  }
}

/* ============================================================================
   PROGRESS BAR
   ============================================================================ */

export function TaskProgressBar({
  progress,
  status,
  prominent = false,
}: {
  progress: TaskProgress;
  status: TaskStatus;
  prominent?: boolean;
}) {
  const pct = computeProgressPercent(progress);
  const barHeight = prominent ? 'h-2' : 'h-1.5';

  const fillColor =
    status === 'completed'
      ? 'bg-[var(--color-success)]'
      : status === 'failed'
      ? 'bg-[var(--color-error)]'
      : status === 'partial' || status === 'waiting_for_approval' || status === 'waiting_for_resource'
      ? 'bg-[var(--color-warning)]'
      : status === 'paused' || status === 'cancelled'
      ? 'bg-[var(--color-text-muted)]'
      : 'bg-[var(--color-accent)]';

  return (
    <div className="w-full space-y-1">
      <div className={cn('w-full overflow-hidden rounded-full bg-[var(--color-surface-3)]', barHeight)}>
        {pct === null ? (
          status === 'waiting_for_approval' || status === 'waiting_for_resource' ? (
            <div className={cn('h-full w-2/3 rounded-full opacity-80', fillColor)} />
          ) : (
            <div className={cn('h-full w-1/3 rounded-full animate-miro-indeterminate', fillColor)} />
          )
        ) : (
          <div
            className={cn('h-full rounded-full transition-all duration-300', fillColor)}
            style={{ width: `${pct}%` }}
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 text-[12px] text-[var(--color-text-muted)]">
        <span className="truncate">{progress.stageLabel}</span>
        <span className="font-mono-tech shrink-0 text-[var(--color-text-secondary)]">
          {progress.mode === 'count' && progress.total !== null
            ? `${progress.current}/${progress.total} ${progress.unitLabel} — ${pct ?? 0}%`
            : progress.mode === 'stage' && progress.total !== null
            ? `${progress.current}/${progress.total} ${progress.unitLabel} · ${pct ?? 0}%`
            : progress.mode === 'waiting'
            ? 'Waiting'
            : 'In progress'}
        </span>
      </div>
    </div>
  );
}

/* ============================================================================
   MODAL DIALOG (12px radius, Escape close, accessible)
   ============================================================================ */

export function Modal({
  open,
  onClose,
  title,
  description,
  widthClass = 'max-w-[480px]',
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  widthClass?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          'w-full rounded-[12px] bg-[var(--color-surface-1)] border border-[var(--color-border-strong)] shadow-[var(--shadow-lg)] overflow-hidden flex flex-col max-h-[88vh]',
          widthClass
        )}
      >
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-h4 text-[var(--color-text-primary)]">{title}</h2>
            {description && (
              <p className="mt-0.5 text-[13px] text-[var(--color-text-secondary)]">{description}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" aria-label="Close modal" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================================
   SLIDE-OVER DRAWER
   ============================================================================ */

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  widthClass = 'w-full sm:w-[420px]',
  headerExtra,
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  widthClass?: string;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-[var(--color-overlay)]"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        className={cn(
          'h-full bg-[var(--color-surface-1)] border-l border-[var(--color-border)] shadow-[var(--shadow-lg)] flex flex-col',
          widthClass
        )}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-[var(--color-border)] shrink-0">
          <div className="min-w-0">
            <h2 className="text-h4 text-[var(--color-text-primary)] truncate">{title}</h2>
            {subtitle && (
              <p className="text-[12px] text-[var(--color-text-muted)] truncate">{subtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {headerExtra}
            <Button variant="ghost" size="icon" aria-label={`Close ${title}`} onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
        {footer && (
          <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-2)]/50 shrink-0">
            {footer}
          </div>
        )}
      </aside>
    </div>
  );
}

/* ============================================================================
   SEGMENTED TABS
   ============================================================================ */

export function SegmentedTabs<T extends string>({
  value,
  onChange,
  items,
  className,
}: {
  value: T;
  onChange: (val: T) => void;
  items: { value: T; label: string; count?: number }[];
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-[8px] bg-[var(--color-surface-2)] p-1 border border-[var(--color-border)]',
        className
      )}
    >
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[5px] text-[12px] font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer',
              active
                ? 'bg-[var(--color-surface-1)] text-[var(--color-text-primary)] shadow-[var(--shadow-sm)] border border-[var(--color-border)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
          >
            <span>{item.label}</span>
            {item.count !== undefined && (
              <span className="font-mono-tech text-[11px] text-[var(--color-text-muted)]">{item.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
