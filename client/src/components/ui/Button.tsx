import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'outline-white' | 'outline-navy' | 'white' | 'navy' | 'ghost';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  'outline-white': 'border-[1.5px] border-white text-white hover:bg-white/10',
  'outline-navy': 'border-[1.5px] border-navy text-navy hover:bg-navy/5',
  white: 'bg-white text-navy hover:bg-card',
  navy: 'bg-navy text-white hover:bg-navy/90',
  ghost: 'text-navy hover:bg-navy/5',
};

const sizes = {
  md: 'h-12 px-7 text-base',
  sm: 'h-10 px-5 text-sm',
  lg: 'h-14 px-8 text-lg',
};

interface CommonProps {
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
  fullWidth?: boolean;
}

export const buttonClasses = ({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: Omit<CommonProps, 'children'>) =>
  cn(
    'inline-flex select-none items-center justify-center gap-2 rounded-full font-serif font-bold tracking-[-0.005em] transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60',
    variants[variant],
    sizes[size],
    fullWidth && 'w-full',
    className,
  );

type ButtonProps = CommonProps & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, className, fullWidth, children, type = 'button', ...rest }, ref) => (
    <button ref={ref} type={type} className={buttonClasses({ variant, size, fullWidth, className })} {...rest}>
      {children}
    </button>
  ),
);
Button.displayName = 'Button';

interface LinkButtonProps extends CommonProps {
  to: string;
  external?: boolean;
  'aria-label'?: string;
}

export function LinkButton({ to, external, variant, size, className, fullWidth, children, ...rest }: LinkButtonProps) {
  const classes = buttonClasses({ variant, size, fullWidth, className });
  if (external || /^https?:/.test(to)) {
    return (
      <a href={to} className={classes} target="_blank" rel="noopener noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={classes} {...rest}>
      {children}
    </Link>
  );
}
