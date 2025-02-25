import { cn } from "@/src/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> { }

export const Skeleton = ({ className, ...props }: SkeletonProps) => {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-gray-200", className)}
            {...props}
        />
    )
} 