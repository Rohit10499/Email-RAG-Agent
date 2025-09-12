import React from "react";
import { cn } from "../lib/utils";

export const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-white rounded-lg shadow-md border border-gray-200",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

export const CardHeader = ({ className, ...props }) => (
  <div className={cn("p-4 border-b border-gray-100", className)} {...props} />
);
CardHeader.displayName = "CardHeader";

export const CardTitle = ({ className, ...props }) => (
  <h2 className={cn("text-xl font-bold", className)} {...props} />
);
CardTitle.displayName = "CardTitle";

export const CardContent = ({ className, ...props }) => (
  <div className={cn("p-4", className)} {...props} />
);
CardContent.displayName = "CardContent";

export default Card;
