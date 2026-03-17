import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex min-h-10 w-full rounded-xl border border-[#2f2925] bg-[#1a1614]/80 px-3 py-2 text-base text-[#e8e4e0] shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_10px_24px_rgba(0,0,0,0.14)] transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)] file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-[#6a6460] focus:border-amber-600/50 focus:ring-2 focus:ring-amber-600/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
