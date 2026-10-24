export function BrandMark({ compact = false }: { compact?: boolean } = {}) {
  return (
    <span
      className={`brand-mark-shell ${compact ? 'is-compact size-8' : 'size-10'} grid flex-none place-items-center rounded-lg border border-outline bg-surface-low text-primary`}
      aria-hidden="true"
    >
      <svg
        className={`brand-mark ${compact ? 'size-5' : 'size-6'} fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round] [stroke-width:1.8]`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle cx="9" cy="12" r="5" />
        <circle cx="15" cy="12" r="5" />
        <path d="M12 9a3 3 0 0 1 0 6" />
      </svg>
    </span>
  );
}
