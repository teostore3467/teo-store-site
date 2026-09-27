import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: ButtonVariant
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]',
  secondary:
    'border border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-bg-soft)]',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-soft)]',
}

function Button({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        'inline-flex h-10 items-center justify-center rounded-[var(--radius-sm)] px-4 text-sm font-semibold transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button