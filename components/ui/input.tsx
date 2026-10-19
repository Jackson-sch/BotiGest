import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.12] bg-white/80 dark:bg-zinc-900/80 px-3.5 py-2 text-sm text-foreground shadow-inner transition-all duration-150',
          'placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:border-[#0071e3] focus-visible:ring-4 focus-visible:ring-[#0071e3]/15 dark:focus-visible:ring-[#2997ff]/20',
          'disabled:cursor-not-allowed disabled:opacity-50',
          '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
