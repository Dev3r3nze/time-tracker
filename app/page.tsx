"use client";

import { CategoryPanel } from "@/components/category-panel";
import { ActiveTimer } from "@/components/active-timer";
import { StatsDashboard } from "@/components/stats-dashboard";
import { TaskPanel } from "@/components/task-panel";
import { CollapsibleSection } from "@/components/collapsible-section";
import { DataManagement } from "@/components/data-management";
import { TasksProvider, useTasks } from "@/context/tasks-context";
import { Clock } from "lucide-react";
import { useState } from "react";

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface TimeEntry {
  id: string;
  categoryIds: string[];
  startTime: Date;
  endTime: Date | null;
  duration: number;
}

export interface Task {
  id: string;
  title: string;
  categoryIds: string[];
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
}

const defaultCategories: Category[] = [
  { id: "1", name: "Work", color: "#3b82f6" },
  { id: "2", name: "Learning", color: "#10b981" },
  { id: "3", name: "Exercise", color: "#f59e0b" },
  { id: "4", name: "Personal", color: "#8b5cf6" },
];

// Generate mock time entries for the last 30 days
function generateMockEntries(categories: Category[]): TimeEntry[] {
  const entries: TimeEntry[] = [];
  const now = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const numEntries = Math.floor(Math.random() * 4) + 1;
    for (let j = 0; j < numEntries; j++) {
      const numCategories = Math.random() > 0.7 ? 2 : 1;
      const shuffled = [...categories].sort(() => Math.random() - 0.5);
      const selectedCategories = shuffled
        .slice(0, numCategories)
        .map((c) => c.id);

      const startHour = Math.floor(Math.random() * 12) + 8;
      const duration = Math.floor(Math.random() * 120) + 15;

      const startTime = new Date(date);
      startTime.setHours(startHour, Math.floor(Math.random() * 60), 0, 0);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + duration);

      entries.push({
        id: `entry-${i}-${j}`,
        categoryIds: selectedCategories,
        startTime,
        endTime,
        duration: duration * 60 * 1000,
      });
    }
  }

  return entries;
}

function generateMockTasks(categories: Category[]): Task[] {
  const taskTitles = [
    "Review project documentation",
    "Complete weekly report",
    "Update design mockups",
    "Fix navigation bug",
    "Write unit tests",
    "Team standup meeting",
    "Code review PR #42",
    "Update dependencies",
  ];

  return taskTitles.slice(0, 5).map((title, i) => ({
    id: `task-${i}`,
    title,
    categoryIds: [categories[i % categories.length].id],
    completed: i < 2,
    completedAt:
      i < 2
        ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        : null,
    createdAt: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
  }));
}

const COLLAPSE_STORAGE_KEY = "time-tracker-collapse-state";

interface CollapseState {
  timer: boolean;
  categories: boolean;
  tasks: boolean;
  stats: boolean;
}

const defaultCollapseState: CollapseState = {
  timer: false,
  categories: false,
  tasks: false,
  stats: false,
};

function DashboardContent() {
  const {
    tasks,
    addTask,
    toggleComplete,
    removeTask,
    timeEntries,
    addTimeEntry,
    categories,
    addCategory,
    updateCategory,
    removeCategory,
    collapseState,
    setCollapseState,
    activeEntry,
    setActiveEntry,
    selectedCategories,
    setSelectedCategories,
    isHydrated,
  } = useTasks();

  const [isPomodoroActive, setIsPomodoroActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<"focus" | "break">("focus");

  const handleCollapseChange = (
    section: keyof typeof collapseState,
    collapsed: boolean
  ) => {
    setCollapseState({ ...collapseState, [section]: collapsed });
  };

  const handleStartTimer = () => {
    if (selectedCategories.length === 0) return;
    const newEntry = {
      id: `entry-${Date.now()}`,
      categoryIds: selectedCategories,
      startTime: new Date(),
      endTime: null,
      duration: 0,
    };
    setActiveEntry(newEntry);
  };

  const handleStopTimer = () => {
    if (activeEntry) {
      const endTime = new Date();
      const completedEntry = {
        ...activeEntry,
        endTime,
        duration: endTime.getTime() - activeEntry.startTime.getTime(),
      };
      addTimeEntry(completedEntry);
      setActiveEntry(null);
    }
  };

  const handleUpdateTimer = (startTime: Date, endTime: Date | null) => {
    if (activeEntry) {
      setActiveEntry({
        ...activeEntry,
        startTime,
        endTime,
      });
    }
  };

  const shouldDimUI =
    isPomodoroActive && pomodoroMode === "focus" && activeEntry !== null;

  // Show loading state while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-5 w-5 animate-pulse" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-cover bg-center bg-fixed">
      <header className="border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
                <Clock className="h-5 w-5 text-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  Time Tracker
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your time effectively
                </p>
              </div>
            </div>
            <DataManagement />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column */}
          <div className="space-y-6">
            <CollapsibleSection
              collapsed={collapseState.timer}
              onCollapsedChange={(c) => handleCollapseChange("timer", c)}
              title="Active Timer"
            >
              <ActiveTimer
                categories={categories}
                selectedCategories={selectedCategories}
                onSelectCategories={setSelectedCategories}
                activeEntry={activeEntry}
                onStart={handleStartTimer}
                onStop={handleStopTimer}
                onUpdateTimer={handleUpdateTimer}
                isPomodoroEnabled={isPomodoroActive}
                onPomodoroToggle={setIsPomodoroActive}
                pomodoroMode={pomodoroMode}
                onPomodoroModeChange={setPomodoroMode}
              />
            </CollapsibleSection>

            
            {/* Tasks section */}
            <div
              className={`relative transition-all duration-500 ${
                shouldDimUI ? "opacity-30 pointer-events-none" : ""
              }`}
            >
              <CollapsibleSection
                collapsed={collapseState.tasks}
                onCollapsedChange={(c) => handleCollapseChange("tasks", c)}
                title="Tasks"
              >
                <TaskPanel
                  tasks={tasks}
                  categories={categories}
                  onAdd={addTask}
                  onToggle={toggleComplete}
                  onDelete={removeTask}
                />
              </CollapsibleSection>
            </div>

            {/* Categories section */}
            <div
              className={`relative transition-all duration-500 ${
                shouldDimUI ? "opacity-30 pointer-events-none" : ""
              }`}
            >
              <CollapsibleSection
                collapsed={collapseState.categories}
                onCollapsedChange={(c) => handleCollapseChange("categories", c)}
                title="Categories"
              >
                <CategoryPanel
                  categories={categories}
                  onAdd={addCategory}
                  onEdit={updateCategory}
                  onDelete={removeCategory}
                />
              </CollapsibleSection>
            </div>
          </div>

          {/* Right Column */}
          <div
            className={`lg:col-span-2 relative transition-all duration-500 ${
              shouldDimUI ? "opacity-30 pointer-events-none" : ""
            }`}
          >
            <CollapsibleSection
              collapsed={collapseState.stats}
              onCollapsedChange={(c) => handleCollapseChange("stats", c)}
              title="Stats Dashboard"
            >
              <StatsDashboard
                categories={categories}
                timeEntries={timeEntries}
                tasks={tasks}
              />
            </CollapsibleSection>
          </div>
        </div>
      </main>

      {shouldDimUI && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm pointer-events-none z-10" />
      )}
    </div>
  );
}

export default function TimeTrackerDashboard() {
  return (
    <TasksProvider>
      <DashboardContent />
    </TasksProvider>
  );
}
