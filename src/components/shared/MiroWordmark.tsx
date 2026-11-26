import { cn } from '../../lib/utils';

export function MiroWordmark({
  compact = false,
  size = 'md',
  className,
}: {
  compact?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClass =
    size === 'sm'
      ? 'text-[18px] leading-none'
      : size === 'lg'
      ? 'text-[28px] leading-none'
      : 'text-[21px] leading-none';

  return (
    <span
      className={cn(
        'inline-flex items-baseline font-semibold tracking-[-0.04em] text-[var(--color-text-primary)] select-none whitespace-nowrap shrink-0',
        sizeClass,
        className
      )}
      aria-label="miro."
    >
      {compact ? 'm' : 'miro'}
      <span className="text-[var(--color-accent)]">.</span>
    </span>
  );
}
