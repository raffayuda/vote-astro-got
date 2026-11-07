"use client";

import { Toaster as Sonner, toast as sonnerToast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Modern shadcn-style Toast menggunakan Sonner
 * Diposisikan di bawah (bottom-right / bottom-center on mobile)
 */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      richColors
      closeButton
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-ink group-[.toaster]:border-2 group-[.toaster]:border-line group-[.toaster]:shadow-2xl group-[.toaster]:rounded-2xl group-[.toaster]:p-4 group-[.toaster]:font-sans",
          title: "group-[.toast]:font-extrabold group-[.toast]:text-astro-navy group-[.toast]:text-sm",
          description: "group-[.toast]:text-muted group-[.toast]:text-xs group-[.toast]:mt-1 font-medium leading-relaxed",
          actionButton:
            "group-[.toast]:bg-astro-navy group-[.toast]:text-white group-[.toast]:font-bold",
          cancelButton:
            "group-[.toast]:bg-surface-2 group-[.toast]:text-muted",
          closeButton:
            "group-[.toast]:bg-white group-[.toast]:border group-[.toast]:border-line group-[.toast]:text-muted hover:group-[.toast]:text-ink",
          success: "group-[.toaster]:border-ok/40",
          error: "group-[.toaster]:border-bad/40",
          info: "group-[.toaster]:border-astro-blue/40",
        },
      }}
      {...props}
    />
  );
}

// Wrapper fleksibel yang mendukung:
// toast.success("Judul", "Deskripsi") ATAU toast.success("Judul", { description: "..." })
export const toast = Object.assign(
  (message: string | React.ReactNode, data?: Parameters<typeof sonnerToast>[1]) => sonnerToast(message, data),
  sonnerToast,
  {
    success: (
      title: string | React.ReactNode,
      descriptionOrOpts?: string | Parameters<typeof sonnerToast.success>[1],
    ) => {
      if (typeof descriptionOrOpts === "string") {
        return sonnerToast.success(title, { description: descriptionOrOpts });
      }
      return sonnerToast.success(title, descriptionOrOpts);
    },
    error: (
      title: string | React.ReactNode,
      descriptionOrOpts?: string | Parameters<typeof sonnerToast.error>[1],
    ) => {
      if (typeof descriptionOrOpts === "string") {
        return sonnerToast.error(title, { description: descriptionOrOpts });
      }
      return sonnerToast.error(title, descriptionOrOpts);
    },
    info: (
      title: string | React.ReactNode,
      descriptionOrOpts?: string | Parameters<typeof sonnerToast.info>[1],
    ) => {
      if (typeof descriptionOrOpts === "string") {
        return sonnerToast.info(title, { description: descriptionOrOpts });
      }
      return sonnerToast.info(title, descriptionOrOpts);
    },
  },
);
