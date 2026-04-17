import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "../../lib/utils";

const Switch = forwardRef<
  ElementRef<typeof SwitchPrimitives.Root>,
  ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-[26px] w-[44px] shrink-0 cursor-pointer items-center rounded-full",
      "transition-colors duration-150",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bg)]",
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Off: neutral; On: accent
      "data-[state=unchecked]:bg-[color:var(--surface-2)] data-[state=unchecked]:border data-[state=unchecked]:border-[color:var(--line)]",
      "data-[state=checked]:bg-[color:var(--accent)]",
      className,
    )}
    {...props}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-[20px] w-[20px] rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.25)]",
        "transition-transform duration-[180ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        "data-[state=checked]:translate-x-[20px] data-[state=unchecked]:translate-x-[2px]",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
