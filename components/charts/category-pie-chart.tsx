"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import type { Category, TimeEntry } from "@/app/page"

interface CategoryPieChartProps {
  timeEntries: TimeEntry[]
  categories: Category[]
  filterCategory?: string
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)

  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins}m`
}

export function CategoryPieChart({ timeEntries, categories, filterCategory }: CategoryPieChartProps) {
  const data = useMemo(() => {
    const categoryTimes: Record<string, number> = {}

    timeEntries.forEach((entry) => {
      const timePerCategory = entry.duration / (1000 * 60) / entry.categoryIds.length
      entry.categoryIds.forEach((catId) => {
        categoryTimes[catId] = (categoryTimes[catId] || 0) + timePerCategory
      })
    })

    return categories
      .map((cat) => ({
        id: cat.id,
        name: cat.name,
        value: Math.round(categoryTimes[cat.id] || 0),
        color: cat.color,
      }))
      .filter((d) => d.value > 0)
  }, [timeEntries, categories])

  const dayDistributionData = useMemo(() => {
    if (!filterCategory || filterCategory === "all") return null

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const dayTimes: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }
    const dayColors = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#06b6d4"]

    timeEntries.forEach((entry) => {
      const dayOfWeek = entry.startTime.getDay()
      dayTimes[dayOfWeek] += entry.duration / (1000 * 60)
    })

    return dayNames
      .map((name, index) => ({
        name,
        value: Math.round(dayTimes[index]),
        color: dayColors[index],
      }))
      .filter((d) => d.value > 0)
  }, [timeEntries, filterCategory])

  const displayData = dayDistributionData || data
  const totalMinutes = displayData.reduce((acc, d) => acc + d.value, 0)

  const title = filterCategory && filterCategory !== "all" ? `Time by Day of Week` : "Category Distribution"

  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md">
      <CardContent className="">
        <h3 className="text-base font-medium mb-4">{title}</h3>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {displayData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(20,20,20,0.95)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    backdropFilter: "blur(8px)",
                  }}
                  formatter={(value: number) => [formatDuration(value), "Time"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col justify-center space-y-3">
            {displayData.map((item) => {
              const percentage = totalMinutes > 0 ? Math.round((item.value / totalMinutes) * 100) : 0
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm text-muted-foreground">{percentage}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
            {displayData.length === 0 && (
              <p className="text-center text-sm text-muted-foreground">No data for selected period</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
