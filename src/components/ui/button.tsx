import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium shadow-[0_1px_1px_rgba(0,0,0,0.28),0_10px_24px_rgba(0,0,0,0.16)] transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-amber-600 to-orange-700 text-white shadow-[0_1px_1px_rgba(0,0,0,0.28),0_14px_28px_rgba(120,53,15,0.28)] hover:from-amber-500 hover:to-orange-600 hover:shadow-[0_1px_1px_rgba(0,0,0,0.28),0_18px_32px_rgba(120,53,15,0.34)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-[#2f2925] bg-transparent text-[#e8e4e0] shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_8px_20px_rgba(0,0,0,0.16)] hover:border-[#3a3430] hover:bg-[#2a2420]/55",
        secondary:
          "bg-[#2a2420] text-[#e8e4e0] shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_8px_20px_rgba(0,0,0,0.16)] hover:bg-[#3a3430]",
        ghost: "text-[#8a8078] shadow-none hover:bg-[#2a2420]/50 hover:text-[#e8e4e0]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-10 px-4 py-2",
        sm: "min-h-10 rounded-lg px-3 text-xs",
        lg: "min-h-11 rounded-xl px-8",
        icon: "size-10",
      },
      static: {
        true: "active:scale-100",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      static: false,
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  static?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, static: isStatic = false, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, static: isStatic, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
