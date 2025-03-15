import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import type { Status } from "../types"

interface StatusBadgeProps {
  status: Status
  label: string
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const variants = {
    pending: "secondary",
    success: "success",
    warning: "warning",
  } as const

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={variants[status]} className="text-[10px] px-1.5 py-0 font-normal mr-1 mb-1">
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {label}: {status}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
