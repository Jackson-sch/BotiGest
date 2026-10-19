'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      richColors
      closeButton
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-sidebar/95 group-[.toaster]:backdrop-blur-md group-[.toaster]:text-foreground group-[.toaster]:border-sidebar-border group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:text-xs group-[.toaster]:p-4',
          description: 'group-[.toast]:text-muted-foreground group-[.toast]:text-[11px] group-[.toast]:mt-1',
          actionButton:
            'group-[.toast]:bg-[#0071e3] hover:group-[.toast]:bg-[#0077ed] group-[.toast]:text-white group-[.toast]:rounded-xl group-[.toast]:text-xs group-[.toast]:font-semibold group-[.toast]:px-3.5 group-[.toast]:py-1.5 group-[.toast]:shadow-sm transition-all',
          cancelButton:
            'group-[.toast]:bg-white/10 hover:group-[.toast]:bg-white/15 group-[.toast]:text-muted-foreground group-[.toast]:rounded-xl group-[.toast]:text-xs group-[.toast]:px-3 group-[.toast]:py-1.5 transition-all',
        },
      }}
      {...props}
    />
  );
}

export { toast } from 'sonner';
