"use client"

import * as React from "react"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import {
  DayPicker,
  getDefaultClassNames,
} from "react-day-picker"
import { de } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      locale={de}
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background p-3",
        className
      )}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "flex gap-4 flex-col md:flex-row relative",
          defaultClassNames.months
        ),
        month: cn("flex flex-col w-full gap-4", defaultClassNames.month),
        nav: cn(
          "flex items-center gap-1 w-full absolute top-0 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 opacity-50 hover:opacity-100",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "size-8 p-0 opacity-50 hover:opacity-100",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex items-center justify-center h-8 mx-10",
          defaultClassNames.month_caption
        ),
        caption_label: cn(
          "text-sm font-medium",
          defaultClassNames.caption_label
        ),
        month_grid: cn("border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground w-9 font-normal text-[0.8rem] flex items-center justify-center",
          defaultClassNames.weekday
        ),
        weeks: cn("", defaultClassNames.weeks),
        week: cn("flex w-full mt-2", defaultClassNames.week),
        day: cn(
          "h-9 w-9 text-center text-sm p-0 relative",
          "[&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
          defaultClassNames.day
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
          defaultClassNames.day_button
        ),
        range_end: cn("day-range-end", defaultClassNames.range_end),
        selected: cn(
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
          defaultClassNames.selected
        ),
        today: cn("bg-accent text-accent-foreground rounded-md", defaultClassNames.today),
        outside: cn(
          "text-muted-foreground opacity-50 aria-selected:bg-accent/50",
          defaultClassNames.outside
        ),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        range_middle: cn(
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
          defaultClassNames.range_middle
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Chevron: (props) => {
          if (props.orientation === "left") {
            return <ChevronLeftIcon className="h-4 w-4" />
          }
          return <ChevronRightIcon className="h-4 w-4" />
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
export type { DayPickerProps as CalendarProps } from "react-day-picker"
