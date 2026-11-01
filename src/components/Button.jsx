export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  disabled = false,
  className = '',
  icon = null,
  title = '',
  ...props
}) {
  let baseClass = 'btn-primary';
  if (variant === 'secondary') baseClass = 'icon-btn';
  else if (variant === 'danger') baseClass = 'btn-danger';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${baseClass} ${className}`}
      {...props}
    >
      {icon && <span className="flex-none">{icon}</span>}
      {children}
    </button>
  );
}
