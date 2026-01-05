"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Check, X } from "lucide-react"
import type { Category } from "@/app/page"

const PRESET_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#ec4899", "#06b6d4", "#84cc16"]

interface CategoryPanelProps {
  categories: Category[]
  onAdd: (category: Omit<Category, "id">) => void
  onEdit: (id: string, updates: Partial<Category>) => void
  onDelete: (id: string) => void
}

export function CategoryPanel({ categories, onAdd, onEdit, onDelete }: CategoryPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")

  const handleAdd = () => {
    if (newName.trim()) {
      onAdd({ name: newName.trim(), color: newColor })
      setNewName("")
      setNewColor(PRESET_COLORS[0])
      setIsDialogOpen(false)
    }
  }

  const startEditing = (category: Category) => {
    setEditingId(category.id)
    setEditName(category.name)
  }

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      onEdit(id, { name: editName.trim() })
    }
    setEditingId(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName("")
  }

  return (
    <>
      <Card className="border-white/10 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-md">
        <CardContent className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="group flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3 transition-all hover:bg-white/10"
            >
              <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
              {editingId === category.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-7 flex-1 bg-white/5 border-white/10"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveEdit(category.id)
                      if (e.key === "Escape") cancelEdit()
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveEdit(category.id)}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{category.name}</span>
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEditing(category)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => onDelete(category.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-white/20 bg-transparent p-3 text-sm text-muted-foreground transition-all hover:border-white/40 hover:bg-white/5 hover:text-foreground">
                <Plus className="h-4 w-4" />
                New Category
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-popover/95 backdrop-blur-md border-white/10">
              <DialogHeader>
                <DialogTitle>Add Category</DialogTitle>
              </DialogHeader>
              <div className="">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Category name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`h-8 w-8 rounded-full transition-transform hover:scale-110 ${
                          newColor === color ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewColor(color)}
                        type="button"
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>
                <Button onClick={handleAdd} className="w-full">
                  Add Category
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {categories.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">No categories yet. Add one to get started.</p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
