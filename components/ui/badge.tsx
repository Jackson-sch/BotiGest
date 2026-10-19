import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import type { CondicionVenta } from '@/types/database';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors select-none tracking-apple-body',
  {
    variants: {
      variant: {
        default:
          'bg-[#0071e3]/10 text-[#0071e3] border border-[#0071e3]/20 dark:bg-[#2997ff]/15 dark:text-[#2997ff]',
        secondary:
          'bg-black/[0.04] text-foreground border border-black/[0.06] dark:bg-white/[0.08] dark:border-white/[0.08]',
        success:
          'bg-[#34c759]/12 text-[#248a3d] dark:text-[#30d158] border border-[#34c759]/25',
        warning:
          'bg-[#ff9f0a]/12 text-[#b25e00] dark:text-[#ffd60a] border border-[#ff9f0a]/25',
        destructive:
          'bg-[#ff3b30]/12 text-[#c92a2a] dark:text-[#ff453a] border border-[#ff3b30]/25',
        purple:
          'bg-[#af52de]/12 text-[#7928ca] dark:text-[#bf5af2] border border-[#af52de]/25',
        outline:
          'border border-border text-foreground bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

/**
 * Badge específico para la condición de venta sanitaria (DIGEMID / Perú)
 */
export function CondicionVentaBadge({ condicion }: { condicion: CondicionVenta }) {
  switch (condicion) {
    case 'sin_receta':
      return <Badge variant="secondary">OTC · Venta libre</Badge>;
    case 'con_receta':
      return <Badge variant="default">Con Receta</Badge>;
    case 'receta_retenida':
      return <Badge variant="warning">Receta Retenida</Badge>;
    case 'psicotropico':
      return <Badge variant="purple">Psicotrópico (Fiscalizado)</Badge>;
    case 'estupefaciente':
      return <Badge variant="destructive">Estupefaciente (Controlado)</Badge>;
    default:
      return <Badge variant="secondary">{condicion}</Badge>;
  }
}

export { Badge, badgeVariants };
