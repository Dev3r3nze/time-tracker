"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import type { Category, TimeEntry, Task } from "@/app/page"

interface WeeklyChartProps {
  timeEntries: TimeEntry[]
  categories: Category[]
  filterCategory?: string
  tasks?: Task[]
}

export function WeeklyChart({ timeEntries, categories, filterCategory, tasks = [] }: WeeklyChartProps) {
  const data = useMemo(() => {
    const now = new Date()
    const result = []

    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - (i * 7 + now.getDay()))
      weekStart.setHours(0, 0, 0, 0)

      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const weekEntries = timeEntries.filter((entry) => entry.startTime >= weekStart && entry.startTime < weekEnd)
      const totalMinutes = weekEntries.reduce((acc, entry) => acc + entry.duration / (1000 * 60), 0)

      const weekTasks = tasks.filter(
        (task) => task.completedAt && task.completedAt >= weekStart && task.completedAt < weekEnd,
      )

      result.push({
        week: `W${4 - i}`,
        total: Math.round((totalMinutes / 60) * 10) / 10,
        tasks: weekTasks.length,
      })
    }

    return result
  }, [timeEntries, tasks])

  const lineColor =
    filterCategory && filterCategory !== "all"
      ? categories.find((c) => c.id === filterCategory)?.color || "#3b82f6"
      : "#3b82f6"

  const title =
    filterCategory && filterCategory !== "all"
      ? `Weekly Trends - ${categories.find((c) => c.id === filterCategory)?.name || ""}`
      : "Weekly Trends"

  const hasTasks = data.some((d) => d.tasks > 0)

  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md">
      <CardContent className="">
        <h3 className="text-base font-medium mb-4">{title}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fill: "#888", fontSize: 12 }}
                axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: "#888", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => `${value}h`}
              />
              {hasTasks && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#888", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}`}
                />
              )}
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(20,20,20,0.95)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  backdropFilter: "blur(8px)",
                }}
                labelStyle={{ color: "#fff" }}
                formatter={(value: number, name: string) => [
                  name === "total" ? `${value} hours` : `${value} tasks`,
                  name === "total" ? "Time" : "Tasks",
                ]}
              />
              {hasTasks && <Legend />}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="total"
                name="Time (hours)"
                stroke={lineColor}
                strokeWidth={2}
                dot={{ fill: lineColor, strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: lineColor }}
              />
              {hasTasks && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="tasks"
                  name="Tasks completed"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "#22c55e", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "#22c55e" }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
