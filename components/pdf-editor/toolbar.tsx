"use client"

import { useState, useMemo, useEffect, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useEditor } from "@/lib/editor-context"
import { compilePdf, downloadPdf } from "@/lib/pdf-utils"
import type {
  Tool,
  ExtractedTextStyleEdits,
  PaginationFormat,
  PaginationPosition,
} from "@/lib/types"

const COLOR_PRESETS = [
  "#000000",
  "#FF0000",
  "#0066FF",
  "#00AA44",
  "#FF6600",
  "#9333EA",
  "#EC4899",
  "#FFFFFF",
]

const FONT_FAMILIES = [
  { label: "Sans", css: "Helvetica, Arial, sans-serif" },
  { label: "Serif", css: "Times New Roman, Times, serif" },
  { label: "Mono", css: "Courier New, Courier, monospace" },
]

const TOOL_SHORTCUTS: Record<Tool, string> = {
  select: "V",
  text: "T",
  draw: "D",
  highlight: "H",
  eraser: "E",
}

const PAGINATION_FORMATS: { value: PaginationFormat; label: string }[] = [
  { value: "page_x_of_y", label: "Page X / Y" },
]

const PAGINATION_POSITIONS: { value: PaginationPosition; label: string }[] = [
  { value: "bottom-center", label: "Bas-centre" },
  { value: "bottom-right", label: "Bas-droite" },
]

function Tip({ children, label, shortcut }: { children: ReactNode; label: string; shortcut?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8} className="flex items-center gap-2">
        <span>{label}</span>
        {shortcut && <kbd className="kbd">{shortcut}</kbd>}
      </TooltipContent>
    </Tooltip>
  )
}

function detectFontFamilyLabel(css: string): string {
  const lower = css.toLowerCase()
  if (lower.includes("courier") || lower.includes("mono") || lower.includes("consolas")) return "Mono"
  if (lower.includes("times") || lower.includes("georgia") || (lower.includes("serif") && !lower.includes("sans"))) return "Serif"
  return "Sans"
}

export function Toolbar() {
  const { state, dispatch, drawingCanvasRefs } = useEditor()
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return

      const key = e.key.toUpperCase()
      const toolMap: Record<string, Tool> = { V: "select", T: "text", D: "draw", H: "highlight", E: "eraser" }
      if (toolMap[key]) {
        e.preventDefault()
        dispatch({ type: "SET_TOOL", tool: toolMap[key] })
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [dispatch])

  const selectedText = useMemo(() => {
    if (!state.selectedExtractedTextId) return null
    return state.extractedTexts.find((t) => t.id === state.selectedExtractedTextId) ?? null
  }, [state.selectedExtractedTextId, state.extractedTexts])

  const mergedStyle = useMemo(() => {
    if (!selectedText) return null
    return {
      fontSize: selectedText.styleEdits?.fontSize ?? selectedText.pdfFontSize,
      isBold: selectedText.styleEdits?.isBold ?? selectedText.isBold,
      isItalic: selectedText.styleEdits?.isItalic ?? selectedText.isItalic,
      color: selectedText.styleEdits?.color ?? selectedText.color,
      cssFontFamily: selectedText.styleEdits?.cssFontFamily ?? selectedText.cssFontFamily,
    }
  }, [selectedText])

  const updateStyle = (edits: Partial<ExtractedTextStyleEdits>) => {
    if (!state.selectedExtractedTextId) return
    dispatch({ type: "UPDATE_EXTRACTED_TEXT_STYLE", id: state.selectedExtractedTextId, edits })
  }

  const handleDownload = async () => {
    if (!state.pdfData) return
    setIsExporting(true)
    try {
      const data = await compilePdf(
        state.pdfData,
        state.textBlocks,
        state.drawings,
        state.extractedTexts,
        state.pageDimensions,
        drawingCanvasRefs.current,
        state.pagination
      )
      downloadPdf(data, state.fileName)
    } finally {
      setIsExporting(false)
    }
  }

  const setZoom = (delta: number) => {
    const next = Math.round((state.zoom + delta) * 100) / 100
    if (next >= 0.5 && next <= 3) {
      dispatch({ type: "SET_ZOOM", zoom: next })
    }
  }

  const editCount =
    state.extractedTexts.filter((t) => (t.editedStr !== null && t.editedStr !== t.originalStr) || t.styleEdits !== null).length +
    state.textBlocks.length +
    state.drawings.length

  return (
    <div className="shrink-0 animate-slide-down">
      {/* Main toolbar */}
      <div className="flex h-12 items-center justify-between border-b border-border/50 bg-background/80 backdrop-blur-xl px-3 gap-2">
        {/* Left: file info */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0 rounded-lg bg-muted/40 px-2.5 py-1.5 transition-colors hover:bg-muted/60">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="truncate text-xs font-medium max-w-35">
              {state.fileName}
            </span>
          </div>
          <Tip label="Open new file" shortcut="&#8984;O">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => dispatch({ type: "RESET" })}
              className="rounded-lg hover:bg-muted/60"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </Button>
          </Tip>
        </div>

        {/* Center: tools */}
        <div className="flex items-center gap-0.5 rounded-xl border border-border/40 bg-muted/25 p-0.5 shadow-sm">
          <ToggleGroup
            type="single"
            value={state.currentTool}
            onValueChange={(v) => { if (v) dispatch({ type: "SET_TOOL", tool: v as Tool }) }}
            size="sm"
          >
            <Tip label="Select & Edit" shortcut={TOOL_SHORTCUTS.select}>
              <ToggleGroupItem value="select" aria-label="Select" className="rounded-lg data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:shadow-sm transition-all duration-150">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51z" />
                </svg>
              </ToggleGroupItem>
            </Tip>
            <Tip label="Add Text" shortcut={TOOL_SHORTCUTS.text}>
              <ToggleGroupItem value="text" aria-label="Text" className="rounded-lg data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:shadow-sm transition-all duration-150">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 7 4 4 20 4 20 7" />
                  <line x1="9" y1="20" x2="15" y2="20" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
              </ToggleGroupItem>
            </Tip>
            <Tip label="Draw" shortcut={TOOL_SHORTCUTS.draw}>
              <ToggleGroupItem value="draw" aria-label="Draw" className="rounded-lg data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:shadow-sm transition-all duration-150">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                </svg>
              </ToggleGroupItem>
            </Tip>
            <Tip label="Highlight" shortcut={TOOL_SHORTCUTS.highlight}>
              <ToggleGroupItem value="highlight" aria-label="Highlight" className="rounded-lg data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:shadow-sm transition-all duration-150">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.38 3.29a2.4 2.4 0 0 1 3.4.01l.93.94a2.4 2.4 0 0 1 .01 3.4L10.42 18H6v-4.42z" />
                </svg>
              </ToggleGroupItem>
            </Tip>
            <Tip label="Eraser" shortcut={TOOL_SHORTCUTS.eraser}>
              <ToggleGroupItem value="eraser" aria-label="Eraser" className="rounded-lg data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:shadow-sm transition-all duration-150">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 20H7L3 16a1 1 0 0 1 0-1.41l9.59-9.59a2 2 0 0 1 2.82 0l5.17 5.17a2 2 0 0 1 0 2.82L14 20" />
                  <path d="M6 11.5l6.5 6.5" />
                </svg>
              </ToggleGroupItem>
            </Tip>
          </ToggleGroup>
        </div>

        {/* Right: settings + export */}
        <div className="flex items-center gap-0.5">
          <Popover>
            <Tip label="Color">
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Color picker" className="rounded-lg hover:bg-muted/60">
                  <span
                    className="block size-4 rounded-full border border-border/80 shadow-sm ring-2 ring-background transition-transform hover:scale-110"
                    style={{ backgroundColor: state.color }}
                  />
                </Button>
              </PopoverTrigger>
            </Tip>
            <PopoverContent className="w-52 p-3 rounded-xl" align="end">
              <p className="mb-2.5 text-xs font-medium text-muted-foreground">Color</p>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => dispatch({ type: "SET_COLOR", color: c })}
                    className={`flex size-9 items-center justify-center rounded-xl border transition-all duration-150 hover:scale-105 active:scale-95 ${
                      state.color === c ? "ring-2 ring-primary ring-offset-2 border-transparent" : "border-border/60 hover:border-border"
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {state.color === c && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c === "#000000" || c === "#9333EA" || c === "#0066FF" ? "white" : "#000"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <label className="flex h-9 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border/60 px-2.5 text-xs transition-colors hover:border-border hover:bg-muted/30">
                  <span
                    className="block size-4 shrink-0 rounded-full border border-border/60"
                    style={{ backgroundColor: state.color }}
                  />
                  <span className="flex-1 font-mono uppercase text-muted-foreground">
                    {state.color}
                  </span>
                  <input
                    type="color"
                    value={state.color}
                    onChange={(e) => dispatch({ type: "SET_COLOR", color: e.target.value })}
                    className="invisible absolute size-0"
                  />
                </label>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <Tip label="Font size">
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="tabular-nums text-xs font-mono gap-1 px-2 h-7 rounded-lg hover:bg-muted/60">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                  {state.fontSize}
                </Button>
              </PopoverTrigger>
            </Tip>
            <PopoverContent className="w-52 p-3 rounded-xl" align="end">
              <p className="mb-3 text-xs font-medium text-muted-foreground">Font size</p>
              <div className="flex items-center gap-3">
                <Slider
                  min={8}
                  max={72}
                  step={1}
                  value={[state.fontSize]}
                  onValueChange={([v]) => dispatch({ type: "SET_FONT_SIZE", size: v })}
                />
                <span className="w-8 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {state.fontSize}
                </span>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <Tip label="Stroke width">
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="tabular-nums text-xs font-mono gap-1 px-2 h-7 rounded-lg hover:bg-muted/60">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1" />
                    <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z" />
                  </svg>
                  {state.strokeWidth}
                </Button>
              </PopoverTrigger>
            </Tip>
            <PopoverContent className="w-52 p-3 rounded-xl" align="end">
              <p className="mb-3 text-xs font-medium text-muted-foreground">Stroke width</p>
              <div className="flex items-center gap-3">
                <Slider
                  min={1}
                  max={20}
                  step={1}
                  value={[state.strokeWidth]}
                  onValueChange={([v]) => dispatch({ type: "SET_STROKE_WIDTH", width: v })}
                />
                <span className="w-8 text-right font-mono text-xs tabular-nums text-muted-foreground">
                  {state.strokeWidth}
                </span>
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <Tip label="Pagination export">
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 rounded-lg hover:bg-muted/60 gap-1.5 text-xs">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19h16" />
                    <path d="M6 15h12" />
                    <path d="M8 11h8" />
                  </svg>
                  Pagination
                </Button>
              </PopoverTrigger>
            </Tip>
            <PopoverContent className="w-64 p-3 rounded-xl" align="end">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-medium text-muted-foreground">Activer la pagination</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={state.pagination.enabled}
                  onClick={() => dispatch({ type: "SET_PAGINATION_ENABLED", enabled: !state.pagination.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    state.pagination.enabled ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      state.pagination.enabled ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              <div className="mt-3 space-y-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Format</p>
                  <div className="grid grid-cols-1 gap-1">
                    {PAGINATION_FORMATS.map((format) => {
                      const active = state.pagination.format === format.value
                      return (
                        <button
                          key={format.value}
                          onClick={() => dispatch({ type: "SET_PAGINATION_FORMAT", format: format.value })}
                          className={`rounded-lg border px-2.5 py-1.5 text-left text-xs transition-colors ${
                            active
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border/60 text-muted-foreground hover:bg-muted/40"
                          }`}
                        >
                          {format.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Position</p>
                  <div className="grid grid-cols-2 gap-1">
                    {PAGINATION_POSITIONS.map((position) => {
                      const active = state.pagination.position === position.value
                      return (
                        <button
                          key={position.value}
                          onClick={() => dispatch({ type: "SET_PAGINATION_POSITION", position: position.value })}
                          className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                            active
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border/60 text-muted-foreground hover:bg-muted/40"
                          }`}
                        >
                          {position.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Taille de police</p>
                  <div className="flex items-center gap-3">
                    <Slider
                      min={8}
                      max={24}
                      step={1}
                      value={[state.pagination.fontSize]}
                      onValueChange={([v]) => dispatch({ type: "SET_PAGINATION_FONT_SIZE", fontSize: v })}
                    />
                    <span className="w-8 text-right font-mono text-xs tabular-nums text-muted-foreground">
                      {state.pagination.fontSize}
                    </span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="mx-1 h-4" />

          <Tip label="Toggle dark mode">
            <ThemeToggle compact />
          </Tip>

          <div className="flex items-center gap-0 rounded-lg border border-border/40 bg-muted/20 p-0.5">
            <Tip label="Zoom out">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setZoom(-0.25)}
                disabled={state.zoom <= 0.5}
                className="rounded-md"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </Button>
            </Tip>
            <span className="w-10 text-center font-mono text-[11px] tabular-nums text-muted-foreground select-none">
              {Math.round(state.zoom * 100)}%
            </span>
            <Tip label="Zoom in">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setZoom(0.25)}
                disabled={state.zoom >= 3}
                className="rounded-md"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </Button>
            </Tip>
          </div>

          <Separator orientation="vertical" className="mx-1 h-4" />

          <Tip label="Download edited PDF" shortcut="&#8984;S">
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isExporting || !state.pdfData}
              className="gap-1.5 h-7 text-xs rounded-lg shadow-sm transition-all duration-150 hover:shadow-md active:scale-[0.97]"
            >
              {isExporting ? (
                <svg className="size-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              Export
              {editCount > 0 && (
                <span className="flex size-4 items-center justify-center rounded-full bg-primary-foreground/20 text-[9px] font-bold leading-none">
                  {editCount}
                </span>
              )}
            </Button>
          </Tip>
        </div>
      </div>

      {/* Format bar for selected text */}
      {selectedText && mergedStyle && (
        <div className="flex h-10 items-center gap-1 border-b border-border/40 bg-muted/15 backdrop-blur-sm px-3 animate-slide-down">
          <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-widest mr-2">Format</span>

          <Tip label="Bold" shortcut="&#8984;B">
            <Button
              variant={mergedStyle.isBold ? "default" : "ghost"}
              size="icon-xs"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateStyle({ isBold: !mergedStyle.isBold })}
              className={`rounded-md ${mergedStyle.isBold ? "shadow-sm" : ""}`}
            >
              <span className="text-xs font-bold">B</span>
            </Button>
          </Tip>

          <Tip label="Italic" shortcut="&#8984;I">
            <Button
              variant={mergedStyle.isItalic ? "default" : "ghost"}
              size="icon-xs"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateStyle({ isItalic: !mergedStyle.isItalic })}
              className={`rounded-md ${mergedStyle.isItalic ? "shadow-sm" : ""}`}
            >
              <span className="text-xs italic font-serif">I</span>
            </Button>
          </Tip>

          <Separator orientation="vertical" className="mx-1.5 h-4" />

          <div className="flex items-center gap-0.5 rounded-lg border border-border/40 bg-background/60 p-0.5">
            {FONT_FAMILIES.map((f) => {
              const isActive = detectFontFamilyLabel(mergedStyle.cssFontFamily) === f.label
              return (
                <button
                  key={f.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateStyle({ cssFontFamily: f.css })}
                  className={`px-2.5 py-0.5 rounded-md text-[11px] font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                  style={{ fontFamily: f.css }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          <Separator orientation="vertical" className="mx-1.5 h-4" />

          <div className="flex items-center gap-0">
            <Tip label="Decrease size">
              <Button
                variant="ghost"
                size="icon-xs"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => updateStyle({ fontSize: Math.max(4, Math.round(mergedStyle.fontSize) - 1) })}
                className="rounded-md"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </Button>
            </Tip>
            <span className="w-8 text-center font-mono text-[11px] tabular-nums text-foreground select-none">
              {Math.round(mergedStyle.fontSize)}
            </span>
            <Tip label="Increase size">
              <Button
                variant="ghost"
                size="icon-xs"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => updateStyle({ fontSize: Math.min(200, Math.round(mergedStyle.fontSize) + 1) })}
                className="rounded-md"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </Button>
            </Tip>
          </div>

          <Separator orientation="vertical" className="mx-1.5 h-4" />

          <Popover>
            <Tip label="Text color">
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onMouseDown={(e) => e.preventDefault()}
                  className="rounded-md"
                >
                  <span
                    className="block size-3.5 rounded-full border border-border/80 shadow-sm"
                    style={{ backgroundColor: mergedStyle.color }}
                  />
                </Button>
              </PopoverTrigger>
            </Tip>
            <PopoverContent className="w-52 p-3 rounded-xl" align="start">
              <p className="mb-2.5 text-xs font-medium text-muted-foreground">Text color</p>
              <div className="grid grid-cols-4 gap-2">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => updateStyle({ color: c })}
                    className={`flex size-9 items-center justify-center rounded-xl border transition-all duration-150 hover:scale-105 active:scale-95 ${
                      mergedStyle.color === c ? "ring-2 ring-primary ring-offset-2 border-transparent" : "border-border/60 hover:border-border"
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {mergedStyle.color === c && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={c === "#000000" || c === "#9333EA" || c === "#0066FF" ? "white" : "#000"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <div className="mt-3">
                <label className="flex h-9 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-border/60 px-2.5 text-xs transition-colors hover:border-border hover:bg-muted/30">
                  <span
                    className="block size-4 shrink-0 rounded-full border border-border/60"
                    style={{ backgroundColor: mergedStyle.color }}
                  />
                  <span className="flex-1 font-mono uppercase text-muted-foreground">
                    {mergedStyle.color}
                  </span>
                  <input
                    type="color"
                    value={mergedStyle.color}
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => updateStyle({ color: e.target.value })}
                    className="invisible absolute size-0"
                  />
                </label>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  )
}
