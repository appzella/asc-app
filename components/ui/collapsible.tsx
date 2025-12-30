'use client'

import * as React from 'react'
import * as CollapsiblePrimitive from '@radix-ui/react-collapsible'
import { AnimatePresence, motion } from 'motion/react'

const Collapsible = CollapsiblePrimitive.Root

const CollapsibleTrigger = CollapsiblePrimitive.CollapsibleTrigger

// Animated CollapsibleContent with smooth height transition
const CollapsibleContent = React.forwardRef<
    React.ElementRef<typeof CollapsiblePrimitive.CollapsibleContent>,
    React.ComponentPropsWithoutRef<typeof CollapsiblePrimitive.CollapsibleContent>
>(({ children, className, ...props }, ref) => {
    return (
        <CollapsiblePrimitive.CollapsibleContent
            ref={ref}
            className={className}
            {...props}
            asChild
            forceMount
        >
            <AnimatePresence initial={false}>
                <motion.div
                    key="collapsible-content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{
                        height: { type: 'spring', stiffness: 500, damping: 40 },
                        opacity: { duration: 0.15 }
                    }}
                    style={{ overflow: 'hidden' }}
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </CollapsiblePrimitive.CollapsibleContent>
    )
})
CollapsibleContent.displayName = 'CollapsibleContent'

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
