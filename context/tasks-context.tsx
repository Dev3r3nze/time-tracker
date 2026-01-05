"use client"

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react"

export interface Task {
  id: string
  title: string
  categoryIds: string[]
  completed: boolean
  completedAt: Date | null
  createdAt: Date
}

export interface PomodoroSession {
  id: string
  categoryIds: string[]
  startTime: Date
  endTime: Date
  duration: number
  type: "focus" | "break"
  cycle: number
}

export interface TimeEntry {
  id: string
  categoryIds: string[]
  startTime: Date
  endTime: Date | null
  duration: number
}

export interface Category {
  id: string
  name: string
  color: string
}

interface StorageSchema {
  version: 1
  tasks: Task[]
  sessions: PomodoroSession[]
  timeEntries: TimeEntry[]
  categories: Category[]
  collapseState: {
    timer: boolean
    categories: boolean
    tasks: boolean
    stats: boolean
  }
}

const STORAGE_KEY = "tm-dashboard:v1"

const defaultCategories: Category[] = [
  { id: "1", name: "Work", color: "#3b82f6" },
  { id: "2", name: "Learning", color: "#10b981" },
  { id: "3", name: "Exercise", color: "#f59e0b" },
  { id: "4", name: "Personal", color: "#8b5cf6" },
]

const defaultCollapseState = {
  timer: false,
  categories: false,
  tasks: false,
  stats: false,
}

function generateMockEntries(categories: Category[]): TimeEntry[] {
  const entries: TimeEntry[] = []
  const now = new Date()

  for (let i = 0; i < 30; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    const numEntries = Math.floor(Math.random() * 4) + 1
    for (let j = 0; j < numEntries; j++) {
      const numCategories = Math.random() > 0.7 ? 2 : 1
      const shuffled = [...categories].sort(() => Math.random() - 0.5)
      const selectedCategories = shuffled.slice(0, numCategories).map((c) => c.id)

      const startHour = Math.floor(Math.random() * 12) + 8
      const duration = Math.floor(Math.random() * 120) + 15

      const startTime = new Date(date)
      startTime.setHours(startHour, Math.floor(Math.random() * 60), 0, 0)

      const endTime = new Date(startTime)
      endTime.setMinutes(endTime.getMinutes() + duration)

      entries.push({
        id: `entry-${i}-${j}`,
        categoryIds: selectedCategories,
        startTime,
        endTime,
        duration: duration * 60 * 1000,
      })
    }
  }

  return entries
}

function generateMockTasks(categories: Category[]): Task[] {
  const taskTitles = [
    "Review project documentation",
    "Complete weekly report",
    "Update design mockups",
    "Fix navigation bug",
    "Write unit tests",
  ]

  return taskTitles.map((title, i) => ({
    id: `task-${i}`,
    title,
    categoryIds: [categories[i % categories.length].id],
    completed: i < 2,
    completedAt: i < 2 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
    createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
  }))
}

interface TasksContextType {
  // Tasks
  tasks: Task[]
  addTask: (task: Omit<Task, "id" | "completed" | "completedAt" | "createdAt">) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  removeTask: (id: string) => void
  toggleComplete: (id: string) => void

  // Sessions
  sessions: PomodoroSession[]
  recordSession: (session: Omit<PomodoroSession, "id">) => void

  // Time entries
  timeEntries: TimeEntry[]
  addTimeEntry: (entry: TimeEntry) => void

  // Categories
  categories: Category[]
  addCategory: (category: Omit<Category, "id">) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  removeCategory: (id: string) => void

  // Collapse state
  collapseState: typeof defaultCollapseState
  setCollapseState: (state: typeof defaultCollapseState) => void

  // Export/Import
  exportState: () => string
  importState: (json: string) => boolean
  clearState: () => void

  // Active entry management
  activeEntry: TimeEntry | null
  setActiveEntry: (entry: TimeEntry | null) => void
  selectedCategories: string[]
  setSelectedCategories: (ids: string[]) => void

  // Hydration state
  isHydrated: boolean
}

const TasksContext = createContext<TasksContextType | null>(null)

function serializeState(state: StorageSchema): string {
  return JSON.stringify(state, (key, value) => {
    if (value instanceof Date) {
      return { __type: "Date", value: value.toISOString() }
    }
    return value
  })
}

function deserializeState(json: string): StorageSchema | null {
  try {
    return JSON.parse(json, (key, value) => {
      if (value && typeof value === "object" && value.__type === "Date") {
        return new Date(value.value)
      }
      return value
    })
  } catch {
    return null
  }
}

function migrateState(state: StorageSchema): StorageSchema {
  // v1 -> v2 migration would go here
  // if (state.version === 1) {
  //   state = migrateV1toV2(state)
  // }
  return state
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [sessions, setSessions] = useState<PomodoroSession[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [categories, setCategories] = useState<Category[]>(defaultCategories)
  const [collapseState, setCollapseStateInternal] = useState(defaultCollapseState)
  const [activeEntry, setActiveEntry] = useState<TimeEntry | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([defaultCategories[0].id])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = deserializeState(stored)
        if (parsed) {
          const migrated = migrateState(parsed)
          setTasks(migrated.tasks)
          setSessions(migrated.sessions)
          setTimeEntries(migrated.timeEntries)
          setCategories(migrated.categories)
          setCollapseStateInternal(migrated.collapseState)
        }
      } else {
        // Initialize with mock data if no stored data
        setTasks(generateMockTasks(defaultCategories))
        setTimeEntries(generateMockEntries(defaultCategories))
      }
    } catch (error) {
      console.error("Failed to load from localStorage:", error)
      // Fallback to mock data
      setTasks(generateMockTasks(defaultCategories))
      setTimeEntries(generateMockEntries(defaultCategories))
    }
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (!isHydrated) return

    try {
      const state: StorageSchema = {
        version: 1,
        tasks,
        sessions,
        timeEntries,
        categories,
        collapseState,
      }
      localStorage.setItem(STORAGE_KEY, serializeState(state))
    } catch (error) {
      console.error("Failed to save to localStorage:", error)
    }
  }, [tasks, sessions, timeEntries, categories, collapseState, isHydrated])

  // Task operations
  const addTask = useCallback((task: Omit<Task, "id" | "completed" | "completedAt" | "createdAt">) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      completed: false,
      completedAt: null,
      createdAt: new Date(),
    }
    setTasks((prev) => [newTask, ...prev])
  }, [])

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...updates } : task)))
  }, [])

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }, [])

  const toggleComplete = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? new Date() : null,
            }
          : task,
      ),
    )
  }, [])

  // Session operations
  const recordSession = useCallback((session: Omit<PomodoroSession, "id">) => {
    const newSession: PomodoroSession = {
      ...session,
      id: `session-${Date.now()}`,
    }
    setSessions((prev) => [newSession, ...prev])
  }, [])

  // Time entry operations
  const addTimeEntry = useCallback((entry: TimeEntry) => {
    setTimeEntries((prev) => [entry, ...prev])
  }, [])

  // Category operations
  const addCategory = useCallback((category: Omit<Category, "id">) => {
    const newCategory: Category = {
      ...category,
      id: `cat-${Date.now()}`,
    }
    setCategories((prev) => [...prev, newCategory])
  }, [])

  const updateCategory = useCallback((id: string, updates: Partial<Category>) => {
    setCategories((prev) => prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat)))
  }, [])

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id))
    setSelectedCategories((prev) => prev.filter((catId) => catId !== id))
  }, [])

  // Collapse state with protection
  const setCollapseState = useCallback((newState: typeof defaultCollapseState) => {
    const expandedCount = Object.values(newState).filter((v) => !v).length
    if (expandedCount === 0) return // Prevent collapsing all sections
    setCollapseStateInternal(newState)
  }, [])

  // Export/Import/Clear
  const exportState = useCallback((): string => {
    const state: StorageSchema = {
      version: 1,
      tasks,
      sessions,
      timeEntries,
      categories,
      collapseState,
    }
    return serializeState(state)
  }, [tasks, sessions, timeEntries, categories, collapseState])

  const importState = useCallback((json: string): boolean => {
    try {
      const parsed = deserializeState(json)
      if (!parsed || typeof parsed.version !== "number") {
        return false
      }
      const migrated = migrateState(parsed)
      setTasks(migrated.tasks)
      setSessions(migrated.sessions)
      setTimeEntries(migrated.timeEntries)
      setCategories(migrated.categories)
      setCollapseStateInternal(migrated.collapseState)
      return true
    } catch {
      return false
    }
  }, [])

  const clearState = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setTasks(generateMockTasks(defaultCategories))
    setSessions([])
    setTimeEntries(generateMockEntries(defaultCategories))
    setCategories(defaultCategories)
    setCollapseStateInternal(defaultCollapseState)
    setActiveEntry(null)
    setSelectedCategories([defaultCategories[0].id])
  }, [])

  return (
    <TasksContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        removeTask,
        toggleComplete,
        sessions,
        recordSession,
        timeEntries,
        addTimeEntry,
        categories,
        addCategory,
        updateCategory,
        removeCategory,
        collapseState,
        setCollapseState,
        exportState,
        importState,
        clearState,
        activeEntry,
        setActiveEntry,
        selectedCategories,
        setSelectedCategories,
        isHydrated,
      }}
    >
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TasksContext)
  if (!context) {
    throw new Error("useTasks must be used within a TasksProvider")
  }
  return context
}
