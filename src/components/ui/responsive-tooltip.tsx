"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/src/lib/utils"

interface ResponsiveTooltipProps {
    children: React.ReactNode
    content: React.ReactNode
    side?: "top" | "right" | "bottom" | "left"
    align?: "start" | "center" | "end"
    className?: string
    contentClassName?: string
    delayDuration?: number
}

export const ResponsiveTooltip = ({
    children,
    content,
    side = "top",
    align = "center",
    className,
    contentClassName,
    delayDuration = 300,
}: ResponsiveTooltipProps) => {
    const [isOpen, setIsOpen] = React.useState(false)
    const [isMobile, setIsMobile] = React.useState(false)
    const triggerRef = React.useRef<HTMLDivElement>(null)

    // Check if we're on mobile
    React.useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.matchMedia("(max-width: 768px)").matches)
        }

        checkIfMobile()
        window.addEventListener("resize", checkIfMobile)

        return () => {
            window.removeEventListener("resize", checkIfMobile)
        }
    }, [])

    // Handle click outside to close tooltip on mobile
    React.useEffect(() => {
        if (!isMobile) return

        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        document.addEventListener("mousedown", handleClickOutside)
        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isMobile])

    return (
        <TooltipPrimitive.Provider>
            <TooltipPrimitive.Root
                open={isOpen}
                onOpenChange={setIsOpen}
                delayDuration={isMobile ? 0 : delayDuration}
            >
                <TooltipPrimitive.Trigger asChild>
                    <div
                        ref={triggerRef}
                        className={cn("inline-block", className)}
                        onClick={() => isMobile && setIsOpen(!isOpen)}
                    >
                        {children}
                    </div>
                </TooltipPrimitive.Trigger>
                <TooltipPrimitive.Content
                    side={side}
                    align={align}
                    className={cn(
                        "z-50 overflow-hidden rounded-md border bg-white px-3 py-1.5 text-sm text-gray-700 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
                        contentClassName
                    )}
                >
                    {content}
                    <TooltipPrimitive.Arrow className="fill-white" />
                </TooltipPrimitive.Content>
            </TooltipPrimitive.Root>
        </TooltipPrimitive.Provider>
    )
} 