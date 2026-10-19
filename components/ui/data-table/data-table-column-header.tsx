"use client"

import { Column } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn("text-xs font-semibold text-muted-foreground", className)}>{title}</div>
  }

  return (
    <div className={cn("flex items-center space-x-1.5", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 data-[state=open]:bg-accent/60 text-xs font-semibold text-muted-foreground hover:text-foreground gap-1.5 rounded-lg"
          >
            <span>{title}</span>
            {column.getIsSorted() === "desc" ? (
              <ArrowDown className="h-3.5 w-3.5 text-[#0071e3]" />
            ) : column.getIsSorted() === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5 text-[#0071e3]" />
            ) : (
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="rounded-xl border border-border/70 bg-popover/95 backdrop-blur-xl shadow-xl">
          <DropdownMenuItem
            onClick={() => column.toggleSorting(false)}
            className="text-xs cursor-pointer gap-2"
          >
            <ArrowUp className="h-3.5 w-3.5 text-muted-foreground/70" />
            Ascendente
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => column.toggleSorting(true)}
            className="text-xs cursor-pointer gap-2"
          >
            <ArrowDown className="h-3.5 w-3.5 text-muted-foreground/70" />
            Descendente
          </DropdownMenuItem>
          {column.getCanHide() && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => column.toggleVisibility(false)}
                className="text-xs cursor-pointer gap-2 text-muted-foreground hover:text-foreground"
              >
                <EyeOff className="h-3.5 w-3.5 text-muted-foreground/70" />
                Ocultar columna
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
