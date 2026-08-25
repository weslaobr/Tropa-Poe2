import { cn } from '@/lib/utils';

import type { ButtonHTMLAttributes } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}

const VARIANT_CLASSES = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
} as const;

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return <button className={cn(VARIANT_CLASSES[variant], className)} {...props} />;
}
