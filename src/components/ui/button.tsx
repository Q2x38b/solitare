import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { motion, type HTMLMotionProps } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-semibold tracking-tight",
    "transition-[background-color,color,border-color,filter] duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]",
    "disabled:pointer-events-none disabled:opacity-40 select-none",
  ],
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--accent)] text-[color:var(--accent-ink)] hover:brightness-110",
        secondary:
          "bg-[color:var(--surface)] text-[color:var(--fg)] border border-[color:var(--line)] hover:bg-[color:var(--surface-2)]",
        ghost:
          "bg-transparent text-[color:var(--fg-soft)] hover:bg-[color:var(--surface)] hover:text-[color:var(--fg)]",
        outline:
          "bg-transparent text-[color:var(--fg)] border border-[color:var(--line)] hover:bg-[color:var(--surface)]",
      },
      size: {
        sm: "h-8 px-3 text-[12px] rounded-full",
        md: "h-9 px-4 text-[13px] rounded-full",
        lg: "h-11 px-5 text-[14px] rounded-full",
        icon: "h-9 w-9 rounded-full text-[color:var(--fg-soft)] hover:text-[color:var(--fg)]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends Omit<HTMLMotionProps<"button">, "ref">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

// Button with built-in press-scale feedback. Wraps <motion.button> so every
// button in the app gets springy tap feedback for free.
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, disabled, ...props },
  ref,
) {
  if (asChild) {
    // When asChild, we can't animate through motion; consumer should wrap
    // the child themselves. Render via Slot for composition.
    const slotProps = props as unknown as ButtonHTMLAttributes<HTMLButtonElement>;
    return (
      <Slot
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cn(buttonVariants({ variant, size }), className)}
        {...slotProps}
      />
    );
  }
  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: size === "icon" ? 0.94 : 0.97 }}
      transition={{ type: "spring", stiffness: 700, damping: 30, mass: 0.5 }}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
});

export { Button, buttonVariants };
