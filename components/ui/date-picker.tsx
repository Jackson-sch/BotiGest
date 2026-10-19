"use client"

import * as React from "react"
import { format, parse, isValid } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar as CalendarIcon, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  value?: string | Date
  onChange?: (dateString: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  maxDate?: Date
  allowClear?: boolean
  formatDisplay?: string // default: "dd/MM/yyyy"
  startMonth?: Date
  endMonth?: Date
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Seleccione fecha...",
  className,
  disabled = false,
  minDate,
  maxDate,
  allowClear = false,
  formatDisplay = "dd/MM/yyyy",
  startMonth,
  endMonth,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  // Normalizar valor a Date
  const parsedDate = React.useMemo<Date | undefined>(() => {
    if (!value) return undefined
    if (value instanceof Date) return isValid(value) ? value : undefined
    if (typeof value === "string") {
      if (value.trim().length === 0) return undefined
      // Si viene en formato YYYY-MM-DD
      const d = parse(value.trim(), "yyyy-MM-dd", new Date())
      if (isValid(d)) return d
      // Intento estándar
      const fallback = new Date(value)
      return isValid(fallback) ? fallback : undefined
    }
    return undefined
  }, [value])

  const handleSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      onChange?.("")
      setOpen(false)
      return
    }
    const formattedStr = format(selectedDate, "yyyy-MM-dd")
    onChange?.(formattedStr)
    setOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.("")
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full h-10 justify-between rounded-xl border border-border/60 bg-background/80 px-3 text-xs font-normal text-foreground hover:bg-accent/40 focus:outline-none focus:border-[#0071e3] focus:ring-1 focus:ring-[#0071e3]/40 transition-colors group",
            !parsedDate && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <CalendarIcon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
            <span className="truncate">
              {parsedDate ? (
                format(parsedDate, formatDisplay, { locale: es })
              ) : (
                <span className="text-muted-foreground">{placeholder}</span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {allowClear && parsedDate && !disabled && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClear}
                className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                title="Limpiar fecha"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </div>
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 rounded-2xl shadow-2xl border border-border bg-card/95 backdrop-blur-xl" align="start">
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={handleSelect}
          startMonth={startMonth}
          endMonth={endMonth}
          disabled={(date) => {
            if (minDate && date < minDate) return true
            if (maxDate && date > maxDate) return true
            return false
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
