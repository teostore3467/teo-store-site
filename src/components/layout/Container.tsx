import type { ReactNode } from 'react'

type ContainerProps = {
  children: ReactNode
  className?: string
}

function Container({ children, className = '' }: ContainerProps) {
  return (
    <div
      className={[
        'mx-auto w-full max-w-[var(--container-max)] px-4 sm:px-6 lg:px-8',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}

export default Container