import React from "react";
import { cn } from "../lib/utils";

const VARIANTS = {
  default: "bg-blue-600 hover:bg-blue-700 text-white",
  outline: "border border-blue-600 text-blue-600 bg-white hover:bg-blue-50",
  ghost: "bg-transparent hover:bg-blue-50 text-blue-600",
};

export const Button = React.forwardRef(
  (
    { className, variant = "default", type = "button", ...props },
    ref
  ) => {
    return (
      <button
        type={type}
        className={cn(
          "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:pointer-events-none",
          VARIANTS[variant] || VARIANTS.default,
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export default Button;
