import React from "react";
import { cn } from "../lib/utils";

export const Switch = React.forwardRef(
  ({ checked, onCheckedChange, className, ...props }, ref) => {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange && onCheckedChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400",
          checked ? "bg-blue-600" : "bg-gray-300",
          className
        )}
        ref={ref}
        {...props}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-1"
          )}
        />
      </button>
    );
  }
);
Switch.displayName = "Switch";

export default Switch;
