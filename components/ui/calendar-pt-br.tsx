"use client"

import * as React from "react"
import { ptBR } from "date-fns/locale"
import { Calendar as OriginalCalendar, CalendarProps } from "@/components/ui/calendar"

function CalendarPtBR(props: CalendarProps) {
  return (
    <OriginalCalendar
      locale={ptBR}
      formatters={{
        formatWeekdayName: (date) => {
          return date.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3)
        },
        formatMonthCaption: (date) => {
          return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        },
      }}
      {...props}
    />
  )
}
CalendarPtBR.displayName = "CalendarPtBR"

export { CalendarPtBR }
