"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Square, ChevronDown, X, Coffee, Brain } from "lucide-react"
import type { Category, TimeEntry } from "@/app/page"

interface ActiveTimerProps {
  categories: Category[]
  selectedCategories: string[]
  onSelectCategories: (ids: string[]) => void
  activeEntry: TimeEntry | null
  onStart: () => void
  onStop: () => void
  onUpdateTimer: (startTime: Date, endTime: Date | null) => void
  isPomodoroEnabled: boolean
  onPomodoroToggle: (enabled: boolean) => void
  pomodoroMode: "focus" | "break"
  onPomodoroModeChange: (mode: "focus" | "break") => void
}

function formatTime(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}

function formatTimeInput(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
}

export function ActiveTimer({
  categories,
  selectedCategories,
  onSelectCategories,
  activeEntry,
  onStart,
  onStop,
  onUpdateTimer,
  isPomodoroEnabled,
  onPomodoroToggle,
  pomodoroMode,
  onPomodoroModeChange,
}: ActiveTimerProps) {
  const [elapsed, setElapsed] = useState(0)
  const [startTimeInput, setStartTimeInput] = useState("")
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [focusDuration, setFocusDuration] = useState<"25" | "50">("25")
  const [breakDuration, setBreakDuration] = useState<"5" | "10">("5")
  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(0)
  const [cycleCount, setCycleCount] = useState(1)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    audioRef.current = new Audio(
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAQFTMbGtXBTIjJ8vNLQoHxTOn3P2MB5NS9LfL/Y2LWGWUKEqMbJvZ2DaV+Hrce/rJR0X2eQosO7potrXmiMoLu0pItsXmmMn7awoIxsXmmLnrOtnYtrXmiLnbGqm4trXmiKnK+omIxsXmmJm62llopqXWeImqujk4lpXGaHmaihkYloW2WGmKafjodmWmOFl6WcjIZlWWKElaOahYRkV2CClqGYg4NjVl6BlZ+Wg4FiVV2Ak56UgoFhVFyAkp2SgYBgU1t/kZuQgH9fUlp+kJqPf35eUVl9j5mNfn1dUFh8jpeLfXxcT1d7jZaKfHtbTlZ6jJWJe3paTV14i5SHenpZTFV3ipOGenl",
    )
  }, [])

  const playNotification = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(() => {
        // Audio play might fail without user interaction
      })
    }
  }, [])

  const getPomodoroDuration = useCallback(() => {
    const minutes = pomodoroMode === "focus" ? Number.parseInt(focusDuration) : Number.parseInt(breakDuration)
    return minutes * 60 * 1000
  }, [pomodoroMode, focusDuration, breakDuration])

  useEffect(() => {
    if (isPomodoroEnabled && !activeEntry) {
      setPomodoroTimeLeft(getPomodoroDuration())
    }
  }, [isPomodoroEnabled, pomodoroMode, focusDuration, breakDuration, getPomodoroDuration, activeEntry])

  useEffect(() => {
    if (activeEntry) {
      setStartTimeInput(formatTimeInput(activeEntry.startTime))

      const interval = setInterval(() => {
        const now = Date.now()
        const newElapsed = now - activeEntry.startTime.getTime()
        setElapsed(newElapsed)

        if (isPomodoroEnabled) {
          const duration = getPomodoroDuration()
          const remaining = duration - newElapsed

          if (remaining <= 0) {
            // Timer completed
            playNotification()

            if (pomodoroMode === "focus") {
              // Switch to break
              onPomodoroModeChange("break")
              onStop()
              // Auto-start break after a short delay
              setTimeout(() => {
                onStart()
              }, 500)
            } else {
              // Break finished, increment cycle and switch to focus
              setCycleCount((c) => (c >= 4 ? 1 : c + 1))
              onPomodoroModeChange("focus")
              onStop()
            }
          } else {
            setPomodoroTimeLeft(remaining)
          }
        }
      }, 1000)

      return () => clearInterval(interval)
    } else {
      setElapsed(0)
      setStartTimeInput("")
      if (isPomodoroEnabled) {
        setPomodoroTimeLeft(getPomodoroDuration())
      }
    }
  }, [
    activeEntry,
    isPomodoroEnabled,
    pomodoroMode,
    getPomodoroDuration,
    onStop,
    onStart,
    onPomodoroModeChange,
    playNotification,
  ])

  const handleStartTimeChange = (value: string) => {
    setStartTimeInput(value)
    if (activeEntry && value) {
      const [hours, minutes] = value.split(":").map(Number)
      const newStartTime = new Date(activeEntry.startTime)
      newStartTime.setHours(hours, minutes, 0, 0)
      onUpdateTimer(newStartTime, null)
    }
  }

  const toggleCategory = (categoryId: string) => {
    if (activeEntry) return

    if (selectedCategories.includes(categoryId)) {
      if (selectedCategories.length > 1) {
        onSelectCategories(selectedCategories.filter((id) => id !== categoryId))
      }
    } else {
      onSelectCategories([...selectedCategories, categoryId])
    }
  }

  const removeCategory = (categoryId: string) => {
    if (activeEntry) return
    if (selectedCategories.length > 1) {
      onSelectCategories(selectedCategories.filter((id) => id !== categoryId))
    }
  }

  const selectedCategoryData = categories.filter((c) => selectedCategories.includes(c.id))
  const primaryColor = selectedCategoryData[0]?.color || "#3b82f6"

  const displayTime = isPomodoroEnabled && activeEntry ? formatTime(pomodoroTimeLeft) : formatTime(elapsed)
  const modeColor = pomodoroMode === "focus" ? "#ef4444" : "#22c55e"

  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md overflow-hidden">
      {isPomodoroEnabled && (
        <div
          className="h-1 transition-colors duration-300"
          style={{ backgroundColor: activeEntry ? modeColor : "rgba(255,255,255,0.1)" }}
        />
      )}
      <CardContent className="space-y-4 ">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="pomodoro"
              checked={isPomodoroEnabled}
              onCheckedChange={onPomodoroToggle}
              disabled={!!activeEntry}
            />
            <Label htmlFor="pomodoro" className="text-sm text-muted-foreground">
              Pomodoro
            </Label>
          </div>

          {isPomodoroEnabled && (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="gap-1.5 border-0"
                style={{ backgroundColor: `${modeColor}20`, color: modeColor }}
              >
                {pomodoroMode === "focus" ? <Brain className="h-3 w-3" /> : <Coffee className="h-3 w-3" />}
                {pomodoroMode === "focus" ? "Focus" : "Break"}
              </Badge>
              <span className="text-xs text-muted-foreground">Cycle {cycleCount}/4</span>
            </div>
          )}
        </div>

        {isPomodoroEnabled && !activeEntry && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Focus</Label>
              <Select value={focusDuration} onValueChange={(v) => setFocusDuration(v as "25" | "50")}>
                <SelectTrigger className="h-8 bg-white/5 border-white/10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-md border-white/10">
                  <SelectItem value="25">25 min</SelectItem>
                  <SelectItem value="50">50 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Break</Label>
              <Select value={breakDuration} onValueChange={(v) => setBreakDuration(v as "5" | "10")}>
                <SelectTrigger className="h-8 bg-white/5 border-white/10 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover/95 backdrop-blur-md border-white/10">
                  <SelectItem value="5">5 min</SelectItem>
                  <SelectItem value="10">10 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Timer Display */}
        <div className="relative flex flex-col items-center justify-center rounded-xl bg-white/5 backdrop-blur-sm py-2">
          {activeEntry && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="timer-pulse absolute h-24 w-24 rounded-full opacity-20"
                style={{ backgroundColor: isPomodoroEnabled ? modeColor : primaryColor }}
              />
            </div>
          )}
          <div
            className="relative z-10 font-mono text-5xl font-bold tracking-tight transition-colors"
            style={{ color: activeEntry ? (isPomodoroEnabled ? modeColor : primaryColor) : undefined }}
          >
            {displayTime}
          </div>
          {activeEntry && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <div
                className="h-2 w-2 rounded-full animate-pulse"
                style={{ backgroundColor: isPomodoroEnabled ? modeColor : primaryColor }}
              />
              {isPomodoroEnabled ? (pomodoroMode === "focus" ? "Focus time..." : "Break time...") : "Recording..."}
            </div>
          )}

          {isPomodoroEnabled && activeEntry && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
              <div
                className="h-full transition-all duration-1000"
                style={{
                  backgroundColor: modeColor,
                  width: `${(1 - pomodoroTimeLeft / getPomodoroDuration()) * 100}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Selected categories as tags */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-muted-foreground">Categories</label>

          <div className="flex flex-wrap gap-2 min-h-[32px]">
            {selectedCategoryData.map((category) => (
              <Badge
                key={category.id}
                variant="secondary"
                className="gap-1.5 pl-2 pr-1 py-1 bg-white/10 hover:bg-white/15 border-0"
              >
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                {category.name}
                {selectedCategories.length > 1 && !activeEntry && (
                  <button
                    onClick={() => removeCategory(category.id)}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
          </div>

          {/* Category dropdown */}
          <Popover open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between bg-white/5 border-white/10 hover:bg-white/10"
                disabled={!!activeEntry}
              >
                <span className="text-muted-foreground">Add category...</span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-2 bg-popover/95 backdrop-blur-md border-white/10">
              <div className="space-y-1">
                {categories.map((category) => {
                  const isSelected = selectedCategories.includes(category.id)
                  return (
                    <button
                      key={category.id}
                      className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                        isSelected ? "bg-white/15 text-foreground" : "hover:bg-white/10 text-muted-foreground"
                      }`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: category.color }} />
                      {category.name}
                      {isSelected && <span className="ml-auto text-xs text-muted-foreground">Selected</span>}
                    </button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Manual Time Adjustment */}
        {activeEntry && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Start Time</label>
            <Input
              type="time"
              value={startTimeInput}
              onChange={(e) => handleStartTimeChange(e.target.value)}
              className="font-mono bg-white/5 border-white/10"
            />
          </div>
        )}

        {/* Start/Stop Button */}
        <Button
          size="lg"
          className="w-full gap-2"
          variant={activeEntry ? "destructive" : "default"}
          onClick={activeEntry ? onStop : onStart}
          disabled={selectedCategories.length === 0}
        >
          {activeEntry ? (
            <>
              <Square className="h-4 w-4" />
              Stop Timer
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              Start Timer
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
