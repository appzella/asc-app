"use client"

import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { cn } from "@/lib/utils"

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

// Animated CollapsibleContent using CSS grid-based height animation
// This approach works reliably with Radix's data-state attribute
const CollapsibleContent = React.forwardRef<
    React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
    React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ className, children, ...props }, ref) => (
    <CollapsiblePrimitive.CollapsibleContent
        ref={ref}
        className={cn(
            // Grid-based height animation trick for smooth transitions
            "grid transition-all duration-300 ease-out",
            "data-[state=closed]:grid-rows-[0fr] data-[state=open]:grid-rows-[1fr]",
            className
        )}
        {...props}
    >
        <div className="overflow-hidden">
            {children}
        </div>
    </CollapsiblePrimitive.CollapsibleContent>
))
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
