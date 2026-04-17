import {
  createContext,
  forwardRef,
  useContext,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const toggleGroupVariants = cva(
  "inline-flex items-center rounded-full p-0.5 border",
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--surface-2)] border-[color:var(--line)]",
      },
      size: {
        sm: "",
      },
    },
    defaultVariants: { variant: "default", size: "sm" },
  },
);

const ToggleGroupCtx = createContext<{
  variant?: "default";
  size?: "sm";
}>({});

const ToggleGroup = forwardRef<
  ElementRef<typeof ToggleGroupPrimitive.Root>,
  ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleGroupVariants>
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn(toggleGroupVariants({ variant, size }), className)}
    {...props}
  >
    <ToggleGroupCtx.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupCtx.Provider>
  </ToggleGroupPrimitive.Root>
));
ToggleGroup.displayName = "ToggleGroup";

const toggleGroupItemVariants = cva(
  [
    "inline-flex items-center justify-center rounded-full px-3 h-7 text-[12.5px] font-semibold",
    "transition-[background-color,color] duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--surface)]",
    "text-[color:var(--fg-soft)] hover:text-[color:var(--fg)]",
    "data-[state=on]:bg-[color:var(--accent)] data-[state=on]:text-[color:var(--accent-ink)]",
    "select-none",
  ],
);

const ToggleGroupItem = forwardRef<
  ElementRef<typeof ToggleGroupPrimitive.Item>,
  ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  // Keep ctx pull for API symmetry with shadcn; not currently used for variants.
  useContext(ToggleGroupCtx);
  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(toggleGroupItemVariants(), className)}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});
ToggleGroupItem.displayName = "ToggleGroupItem";

export { ToggleGroup, ToggleGroupItem };
