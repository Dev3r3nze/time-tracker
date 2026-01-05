"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Download, Upload, Trash2, Settings } from "lucide-react"
import { useTasks } from "@/context/tasks-context"

export function DataManagement() {
  const { exportState, importState, clearState } = useTasks()
  const [importData, setImportData] = useState("")
  const [importError, setImportError] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const data = exportState()
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `time-tracker-export-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImport = () => {
    setImportError("")
    if (!importData.trim()) {
      setImportError("Please paste JSON data or upload a file")
      return
    }
    const success = importState(importData)
    if (success) {
      setImportData("")
      setIsOpen(false)
    } else {
      setImportError("Invalid data format. Please check your JSON.")
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setImportData(content)
      setImportError("")
    }
    reader.readAsText(file)
  }

  const handleClear = () => {
    if (confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      clearState()
      setIsOpen(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 bg-white/10 backdrop-blur-sm hover:bg-white/20"
          aria-label="Data management settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-popover/95 backdrop-blur-md border-white/10">
        <DialogHeader>
          <DialogTitle>Data Management</DialogTitle>
          <DialogDescription>Export, import, or clear your time tracking data</DialogDescription>
        </DialogHeader>

        <div className="">
          {/* Export */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Export Data</h4>
            <p className="text-xs text-muted-foreground">Download all your data as a JSON file</p>
            <Button onClick={handleExport} variant="outline" className="w-full gap-2 bg-white/5 border-white/10">
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
          </div>

          {/* Import */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Import Data</h4>
            <p className="text-xs text-muted-foreground">Restore from a previously exported file</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Upload JSON file"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="w-full gap-2 bg-white/5 border-white/10"
            >
              <Upload className="h-4 w-4" />
              Upload JSON File
            </Button>
            <Textarea
              placeholder="Or paste JSON data here..."
              value={importData}
              onChange={(e) => {
                setImportData(e.target.value)
                setImportError("")
              }}
              className="h-24 bg-white/5 border-white/10 text-xs font-mono"
            />
            {importError && <p className="text-xs text-destructive">{importError}</p>}
            <Button onClick={handleImport} disabled={!importData.trim()} className="w-full">
              Import Data
            </Button>
          </div>

          {/* Clear */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
            <p className="text-xs text-muted-foreground">Clear all data and reset to defaults</p>
            <Button onClick={handleClear} variant="destructive" className="w-full gap-2">
              <Trash2 className="h-4 w-4" />
              Clear All Data
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
