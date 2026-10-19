"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import { es } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  locale = es,
  captionLayout = "dropdown",
  startMonth,
  endMonth,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()

  const currentYear = new Date().getFullYear()
  const effectiveStartMonth = React.useMemo(
    () => startMonth || new Date(currentYear - 5, 0),
    [startMonth, currentYear]
  )
  const effectiveEndMonth = React.useMemo(
    () => endMonth || new Date(currentYear + 15, 11),
    [endMonth, currentYear]
  )

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      locale={locale}
      captionLayout={captionLayout}
      startMonth={effectiveStartMonth}
      endMonth={effectiveEndMonth}
      className={cn("p-3 select-none", className)}
      classNames={{
        root: cn("w-fit relative", defaultClassNames.root),
        months: "relative flex flex-col gap-2",
        month: "flex flex-col gap-2 relative",
        month_caption: "flex items-center justify-start px-1 h-9 relative pr-18",
        caption_label: "hidden", // Oculto porque el Select de shadcn ya muestra el valor
        dropdowns: "flex items-center gap-1.5",
        dropdown_root: "relative inline-flex items-center",
        nav: "absolute right-0 top-1 flex items-center gap-1 z-20",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 p-0"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 p-0"
        ),
        month_grid: "w-full border-collapse mt-1",
        weekdays: "flex justify-between mb-1.5",
        weekday: "text-[11px] font-medium text-muted-foreground w-8 text-center capitalize",
        weeks: "flex flex-col gap-1",
        week: "flex w-full justify-between gap-1",
        day: "h-8 w-8 p-0 text-center text-xs relative flex items-center justify-center rounded-xl transition-all",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-8 w-8 p-0 font-normal rounded-xl hover:bg-accent/60 hover:text-foreground focus-visible:ring-1 focus-visible:ring-[#0071e3] transition-all"
        ),
        selected: "[&_button]:bg-[#0071e3] [&_button]:text-white [&_button]:hover:bg-[#0077ed] [&_button]:font-medium [&_button]:shadow-[0_2px_8px_rgba(0,113,227,0.35)]",
        today: "[&:not([data-selected=true])_button]:ring-1 [&:not([data-selected=true])_button]:ring-[#0071e3]/60 [&:not([data-selected=true])_button]:text-[#0071e3] [&:not([data-selected=true])_button]:font-semibold",
        outside: "text-muted-foreground/35 opacity-40 aria-selected:opacity-30",
        disabled: "text-muted-foreground/30 opacity-30 cursor-not-allowed hover:bg-transparent",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Dropdown: ({ options, value, onChange, disabled, "aria-label": ariaLabel }: any) => {
          const selectedOption = options?.find(
            (o: any) => o.value.toString() === value?.toString()
          )

          return (
            <Select
              value={value?.toString()}
              onValueChange={(val) => {
                if (onChange) {
                  const syntheticEvent = {
                    target: { value: val },
                    currentTarget: { value: val },
                  } as React.ChangeEvent<HTMLSelectElement>
                  onChange(syntheticEvent)
                }
              }}
              disabled={disabled}
            >
              <SelectTrigger
                aria-label={ariaLabel}
                className="h-7 px-2.5 text-xs font-medium rounded-lg border-border/50 bg-accent/40 hover:bg-accent/70 text-foreground gap-1.5 tracking-apple-body capitalize w-auto min-w-[76px] focus:ring-1 focus:ring-[#0071e3]"
              >
                <SelectValue placeholder={selectedOption?.label}>
                  {selectedOption?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent
                position="popper"
                className="z-[70] max-h-56 min-w-[6.5rem] rounded-xl border border-border/70 bg-popover/95 backdrop-blur-xl shadow-2xl"
              >
                {options?.map((opt: any) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value.toString()}
                    disabled={opt.disabled}
                    className="text-xs capitalize py-1.5 cursor-pointer"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        },
        Nav: ({
          className: navClassName,
          onPreviousClick,
          onNextClick,
          previousMonth,
          nextMonth,
          ...navProps
        }: any) => (
          <nav
            className={cn("absolute right-1 top-1 flex items-center gap-1 z-20", navClassName)}
            {...navProps}
          />
        ),
        Chevron: ({ orientation, disabled, className: chevronClassName, ...chevronProps }: any) => {
          if (orientation === "left") {
            return (
              <ChevronLeft
                className={cn("h-4 w-4", chevronClassName)}
                {...chevronProps}
              />
            )
          }
          if (orientation === "right") {
            return (
              <ChevronRight
                className={cn("h-4 w-4", chevronClassName)}
                {...chevronProps}
              />
            )
          }
          return (
            <ChevronDown
              className={cn("h-3.5 w-3.5", chevronClassName)}
              {...chevronProps}
            />
          )
        },
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
