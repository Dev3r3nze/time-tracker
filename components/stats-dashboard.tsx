"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DailyChart } from "@/components/charts/daily-chart"
import { WeeklyChart } from "@/components/charts/weekly-chart"
import { CategoryPieChart } from "@/components/charts/category-pie-chart"
import { Clock, TrendingUp, Award, Timer, CheckCircle2 } from "lucide-react"
import type { Category, TimeEntry, Task } from "@/app/page"

interface StatsDashboardProps {
  categories: Category[]
  timeEntries: TimeEntry[]
  tasks: Task[]
}

type DateRange = "7d" | "14d" | "30d"

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function StatsDashboard({ categories, timeEntries, tasks }: StatsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>("7d")
  const [filterCategory, setFilterCategory] = useState<string>("all")

  const filteredEntries = useMemo(() => {
    const now = new Date()
    const days = Number.parseInt(dateRange)
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - days)

    let entries = timeEntries.filter((entry) => entry.startTime >= cutoff)

    if (filterCategory !== "all") {
      entries = entries.filter((entry) => entry.categoryIds.includes(filterCategory))
    }

    return entries
  }, [timeEntries, dateRange, filterCategory])

  const filteredTasks = useMemo(() => {
    const now = new Date()
    const days = Number.parseInt(dateRange)
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - days)

    let filtered = tasks.filter((task) => task.completedAt && task.completedAt >= cutoff)

    if (filterCategory !== "all") {
      filtered = filtered.filter((task) => task.categoryIds.includes(filterCategory))
    }

    return filtered
  }, [tasks, dateRange, filterCategory])

  const filteredCategories = useMemo(() => {
    if (filterCategory === "all") {
      return categories
    }
    return categories.filter((c) => c.id === filterCategory)
  }, [categories, filterCategory])

  const stats = useMemo(() => {
    const totalTime = filteredEntries.reduce((acc, entry) => acc + entry.duration, 0)

    const categoryTimes: Record<string, number> = {}
    filteredEntries.forEach((entry) => {
      const timePerCategory = entry.duration / entry.categoryIds.length
      entry.categoryIds.forEach((catId) => {
        categoryTimes[catId] = (categoryTimes[catId] || 0) + timePerCategory
      })
    })

    const mostUsedCategoryId = Object.entries(categoryTimes).sort(([, a], [, b]) => b - a)[0]?.[0]

    const mostUsedCategory = categories.find((c) => c.id === mostUsedCategoryId)

    const avgSession = filteredEntries.length > 0 ? totalTime / filteredEntries.length : 0

    const tasksCompleted = filteredTasks.length

    return {
      totalTime,
      mostUsedCategory,
      avgSession,
      sessionCount: filteredEntries.length,
      tasksCompleted,
    }
  }, [filteredEntries, filteredTasks, categories])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end">
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48 bg-white/5 border-white/10 backdrop-blur-sm">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent className="bg-popover/95 backdrop-blur-md border-white/10">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
          <SelectTrigger className="w-40 bg-white/5 border-white/10 backdrop-blur-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover/95 backdrop-blur-md border-white/10">
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="14d">Last 14 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md">
          <CardContent className="">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/20 backdrop-blur-sm">
                <Clock className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Time</p>
                <p className="text-xl font-bold">{formatDuration(stats.totalTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md">
          <CardContent className="">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/20 backdrop-blur-sm">
                <Award className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Top Category</p>
                <div className="flex items-center gap-2">
                  {stats.mostUsedCategory && (
                    <div
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stats.mostUsedCategory.color }}
                    />
                  )}
                  <p className="text-xl font-bold truncate">{stats.mostUsedCategory?.name || "—"}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md">
          <CardContent className="">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/20 backdrop-blur-sm">
                <Timer className="h-5 w-5 text-chart-3" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Avg Session</p>
                <p className="text-xl font-bold">{formatDuration(stats.avgSession)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md">
          <CardContent className="">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-4/20 backdrop-blur-sm">
                <TrendingUp className="h-5 w-5 text-chart-4" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessions</p>
                <p className="text-xl font-bold">{stats.sessionCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md">
          <CardContent className="">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-5/20 backdrop-blur-sm">
                <CheckCircle2 className="h-5 w-5 text-chart-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tasks Done</p>
                <p className="text-xl font-bold">{stats.tasksCompleted}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DailyChart
          timeEntries={filteredEntries}
          categories={filteredCategories}
          days={Number.parseInt(dateRange)}
          filterCategory={filterCategory}
        />
        <WeeklyChart
          timeEntries={filteredEntries}
          categories={filteredCategories}
          filterCategory={filterCategory}
          tasks={filteredTasks}
        />
      </div>

      <CategoryPieChart timeEntries={filteredEntries} categories={categories} filterCategory={filterCategory} />
    </div>
  )
}
