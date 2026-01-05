"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { Category, TimeEntry } from "@/app/page"

interface DailyChartProps {
  timeEntries: TimeEntry[]
  categories: Category[]
  days: number
  filterCategory?: string
}

export function DailyChart({ timeEntries, categories, days, filterCategory }: DailyChartProps) {
  const data = useMemo(() => {
    const now = new Date()
    const result = []

    for (let i = Math.min(days, 7) - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayEntries = timeEntries.filter((entry) => entry.startTime >= date && entry.startTime < nextDate)

      const dayData: Record<string, number | string> = {
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
      }

      categories.forEach((cat) => {
        const catTime = dayEntries
          .filter((e) => e.categoryIds.includes(cat.id))
          .reduce((acc, e) => acc + e.duration / e.categoryIds.length, 0)
        dayData[cat.id] = Math.round(catTime / (1000 * 60))
      })

      result.push(dayData)
    }

    return result
  }, [timeEntries, categories, days])

  const title =
    filterCategory && filterCategory !== "all"
      ? `Daily Breakdown - ${categories.find((c) => c.id === filterCategory)?.name || ""}`
      : "Daily Breakdown"

  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md">
      <CardContent className="">
        <h3 className="text-base font-medium mb-4">{title}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fill: "#888", fontSize: 12 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#888", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}m`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(20,20,20,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  backdropFilter: "blur(8px)",
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(value: number) => [`${value} min`, ""]}
              />
              <Legend
                wrapperStyle={{ paddingTop: 10 }}
                formatter={(value) => {
                  const cat = categories.find((c) => c.id === value)
                  return <span style={{ color: "#888", fontSize: 12 }}>{cat?.name}</span>
                }}
              />
              {categories.map((cat) => (
                <Bar key={cat.id} dataKey={cat.id} fill={cat.color} radius={[4, 4, 0, 0]} name={cat.id} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
