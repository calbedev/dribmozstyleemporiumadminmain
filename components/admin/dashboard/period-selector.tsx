"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PeriodSelectorProps {
  value: string
  onValueChange: (value: string) => void
}

export function PeriodSelector({ value, onValueChange }: PeriodSelectorProps) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Selecionar período" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="today">Hoje</SelectItem>
        <SelectItem value="7d">Últimos 7 dias</SelectItem>
        <SelectItem value="30d">Últimos 30 dias</SelectItem>
        <SelectItem value="ytd">Este ano</SelectItem>
      </SelectContent>
    </Select>
  )
}
