export default function Chip({
  label,
  onRemove = null,
  active = false,
  className = '',
  icon = null,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
        active
          ? 'bg-gradient-to-r from-[var(--brand)] to-[var(--brand-2)] text-white border-transparent shadow-sm'
          : 'bg-[var(--soft)] text-[var(--ink)] border-[var(--line)]'
      } ${className}`}
    >
      {icon && <span className="flex-none">{icon}</span>}
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/15 text-current cursor-pointer leading-none"
          aria-label="Remove"
        >
          ×
        </button>
      )}
    </span>
  );
}
