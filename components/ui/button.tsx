import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-colors outline-none select-none apple-press-feedback disabled:pointer-events-none disabled:opacity-40 disabled:scale-100',
  {
    variants: {
      variant: {
        default:
          'bg-[#0071e3] text-white hover:bg-[#0077ed] active:bg-[#0064c8] shadow-[0_1px_2px_rgba(0,113,227,0.2)]',
        secondary:
          'bg-black/[0.05] text-foreground hover:bg-black/[0.08] active:bg-black/[0.12] dark:bg-white/[0.08] dark:hover:bg-white/[0.12]',
        glass:
          'apple-glass text-foreground hover:bg-white/90 dark:hover:bg-white/10 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.06)]',
        destructive:
          'bg-[#ff3b30] text-white hover:bg-[#ff453a] active:bg-[#e03126] shadow-[0_1px_2px_rgba(255,59,48,0.2)]',
        outline:
          'border border-black/[0.1] dark:border-white/[0.14] bg-transparent hover:bg-black/[0.04] dark:hover:bg-white/[0.06] text-foreground',
        ghost:
          'text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.06]',
        link: 'text-[#0071e3] underline-offset-4 hover:underline p-0 h-auto font-normal',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-2xl px-6 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
