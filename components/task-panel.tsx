"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Trash2, ChevronDown, X, ChevronUp, ListTodo } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Category, Task } from "@/context/tasks-context"

interface TaskPanelProps {
  tasks: Task[]
  categories: Category[]
  onAdd: (task: Omit<Task, "id" | "completed" | "completedAt" | "createdAt">) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TaskPanel({ tasks, categories, onAdd, onToggle, onDelete }: TaskPanelProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  const activeTasks = tasks.filter((t) => !t.completed)
  const completedTasks = tasks.filter((t) => t.completed)

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAdd({
        title: newTaskTitle.trim(),
        categoryIds: selectedCategories.length > 0 ? selectedCategories : [],
      })
      setNewTaskTitle("")
      setSelectedCategories([])
    }
  }

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId))
    } else {
      setSelectedCategories([...selectedCategories, categoryId])
    }
  }

  const selectedCategoryData = categories.filter((c) => selectedCategories.includes(c.id))

  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md">
      
      <CardContent className="space-y-4">
        {/* Add task input */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add a new task..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
              className="flex-1 bg-white/5 border-white/10 focus:border-white/20 focus:ring-white/10"
              aria-label="New task title"
            />
            <Button size="icon" onClick={handleAddTask} disabled={!newTaskTitle.trim()} aria-label="Add task">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Category selector for new task */}
          <div className="flex flex-wrap items-center gap-2">
            {selectedCategoryData.map((category) => (
              <Badge
                key={category.id}
                variant="secondary"
                className="gap-1.5 pl-2 pr-1 py-0.5 bg-white/10 hover:bg-white/15 border-0 text-xs"
              >
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: category.color }} />
                {category.name}
                <button
                  onClick={() => toggleCategory(category.id)}
                  className="ml-0.5 hover:bg-white/20 rounded-full p-0.5"
                  aria-label={`Remove ${category.name} category`}
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}

            <Popover open={isCategoryDropdownOpen} onOpenChange={setIsCategoryDropdownOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-white/10"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Category
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2 bg-popover/95 backdrop-blur-md border-white/10">
                <div className="space-y-1">
                  {categories.map((category) => {
                    const isSelected = selectedCategories.includes(category.id)
                    return (
                      <button
                        key={category.id}
                        className={cn(
                          "w-full flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                          isSelected ? "bg-white/15 text-foreground" : "hover:bg-white/10 text-muted-foreground",
                        )}
                        onClick={() => toggleCategory(category.id)}
                      >
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                        {category.name}
                      </button>
                    )
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Active tasks */}
        <div className="space-y-2">
          {activeTasks.map((task) => (
            <TaskItem key={task.id} task={task} categories={categories} onToggle={onToggle} onDelete={onDelete} />
          ))}

          {activeTasks.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No active tasks. Add one above.</p>
          )}
        </div>

        {/* Completed tasks section */}
        {completedTasks.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-expanded={showCompleted}
              aria-controls="completed-tasks"
            >
              {showCompleted ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              Completed ({completedTasks.length})
            </button>

            {showCompleted && (
              <div id="completed-tasks" className="space-y-2 pl-2 border-l border-white/10">
                {completedTasks.map((task) => (
                  <TaskItem key={task.id} task={task} categories={categories} onToggle={onToggle} onDelete={onDelete} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TaskItem({
  task,
  categories,
  onToggle,
  onDelete,
}: {
  task: Task
  categories: Category[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}) {
  const taskCategories = categories.filter((c) => task.categoryIds.includes(c.id))

  return (
    <div
      className={cn(
        "group flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10",
        task.completed && "opacity-50",
      )}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggle(task.id)}
        className="mt-0.5 border-white/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
        aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
      />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", task.completed && "line-through text-muted-foreground")}>
          {task.title}
        </p>
        {taskCategories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {taskCategories.map((cat) => (
              <span key={cat.id} className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
              </span>
            ))}
          </div>
        )}
      </div>
      <Button
        size="icon"
        variant="ghost"
        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => onDelete(task.id)}
        aria-label={`Delete "${task.title}"`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
