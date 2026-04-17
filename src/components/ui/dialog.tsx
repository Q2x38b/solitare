import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/utils";

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogPortal = DialogPrimitive.Portal;
const DialogClose = DialogPrimitive.Close;

// Shadcn-style overlay, with framer motion for the fade.
const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay asChild ref={ref} {...props}>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16, ease: [0.22, 0.61, 0.36, 1] }}
      className={cn(
        "fixed inset-0 z-50 bg-black/70",
        "backdrop-blur-[4px]",
        className,
      )}
    />
  </DialogPrimitive.Overlay>
));
DialogOverlay.displayName = "DialogOverlay";

interface ContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  width?: number;
}

const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  ContentProps
>(({ className, children, width = 420, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content asChild ref={ref} {...props}>
      <motion.div
        initial={{ y: 6, scale: 0.96, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 4, scale: 0.98, opacity: 0 }}
        transition={{
          duration: 0.18,
          ease: [0.2, 0.8, 0.2, 1],
          opacity: { duration: 0.14 },
        }}
        style={{ maxWidth: width, willChange: "transform, opacity" }}
        className={cn(
          "fixed left-1/2 top-1/2 z-50 w-[calc(100%-32px)]",
          "-translate-x-1/2 -translate-y-1/2",
          "rounded-[22px] p-6",
          "bg-[color:var(--surface)] border border-[color:var(--line)]",
          "shadow-2xl",
          className,
        )}
      >
        {children}
      </motion.div>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = "DialogContent";

// Motion-wrapped animated version that plays nicely with AnimatePresence.
// Radix manages open state; we expose `open` to the caller so they can
// render the whole tree inside AnimatePresence.
interface AnimatedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  width?: number;
  children: ReactNode;
}

function AnimatedDialog({
  open,
  onOpenChange,
  title,
  width,
  children,
}: AnimatedDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <DialogPrimitive.Root open onOpenChange={onOpenChange}>
          <DialogContent width={width} aria-label={title}>
            {title && (
              <div className="flex items-center justify-between mb-5">
                <DialogTitle>{title}</DialogTitle>
                <DialogClose asChild>
                  <button
                    aria-label="Close"
                    className={cn(
                      "w-8 h-8 grid place-items-center rounded-full",
                      "text-[color:var(--fg-soft)] hover:text-[color:var(--fg)]",
                      "hover:bg-[color:var(--surface-2)] transition",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]",
                    )}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </button>
                </DialogClose>
              </div>
            )}
            {children}
          </DialogContent>
        </DialogPrimitive.Root>
      )}
    </AnimatePresence>
  );
}

const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    style={{ fontSize: "clamp(16px, 1.4vw, 18px)" }}
    className={cn(
      "font-semibold tracking-tight leading-none text-[color:var(--fg)]",
      className,
    )}
    {...props}
  />
));
DialogTitle.displayName = "DialogTitle";

const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-[13px] text-[color:var(--fg-soft)]", className)}
    {...props}
  />
));
DialogDescription.displayName = "DialogDescription";

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogClose,
  DialogTitle,
  DialogDescription,
  AnimatedDialog,
};
