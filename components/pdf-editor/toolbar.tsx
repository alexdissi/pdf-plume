"use client"

import { useState, useMemo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { useEditor } from "@/lib/editor-context"
import { compilePdf, downloadPdf } from "@/lib/pdf-utils"
import type { Tool, ExtractedTextStyleEdits } from "@/lib/types"

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

function Tip({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        {label}
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
        drawingCanvasRefs.current
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
    <div className="shrink-0">
      <div className="flex h-12 items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-sm px-2.5 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 rounded-md bg-muted/50 px-2.5 py-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted-foreground">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="truncate text-xs font-medium max-w-35">
              {state.fileName}
            </span>
          </div>
          <Tip label="Open new file">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => dispatch({ type: "RESET" })}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </Button>
          </Tip>
        </div>

        <div className="flex items-center gap-0.5 rounded-lg border border-border/50 bg-muted/30 p-0.5">
          <ToggleGroup
            type="single"
            value={state.currentTool}
            onValueChange={(v) => { if (v) dispatch({ type: "SET_TOOL", tool: v as Tool }) }}
            size="sm"
          >
            <Tip label="Select & Edit">
              <ToggleGroupItem value="select" aria-label="Select" className="rounded-md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51z" />
                </svg>
              </ToggleGroupItem>
            </Tip>
            <Tip label="Add Text">
              <ToggleGroupItem value="text" aria-label="Text" className="rounded-md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 7 4 4 20 4 20 7" />
                  <line x1="9" y1="20" x2="15" y2="20" />
                  <line x1="12" y1="4" x2="12" y2="20" />
                </svg>
              </ToggleGroupItem>
            </Tip>
            <Tip label="Draw">
              <ToggleGroupItem value="draw" aria-label="Draw" className="rounded-md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
                </svg>
              </ToggleGroupItem>
            </Tip>
            <Tip label="Highlight">
              <ToggleGroupItem value="highlight" aria-label="Highlight" className="rounded-md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.38 3.29a2.4 2.4 0 0 1 3.4.01l.93.94a2.4 2.4 0 0 1 .01 3.4L10.42 18H6v-4.42z" />
                </svg>
              </ToggleGroupItem>
            </Tip>
            <Tip label="Eraser">
              <ToggleGroupItem value="eraser" aria-label="Eraser" className="rounded-md">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 20H7L3 16a1 1 0 0 1 0-1.41l9.59-9.59a2 2 0 0 1 2.82 0l5.17 5.17a2 2 0 0 1 0 2.82L14 20" />
                  <path d="M6 11.5l6.5 6.5" />
                </svg>
              </ToggleGroupItem>
            </Tip>
          </ToggleGroup>
        </div>

        <div className="flex items-center gap-0.5">
          <Popover>
            <Tip label="Color">
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label="Color picker">
                  <span
                    className="block size-4 rounded-full border border-border/80 shadow-sm transition-transform hover:scale-110"
                    style={{ backgroundColor: state.color }}
                  />
                </Button>
              </PopoverTrigger>
            </Tip>
            <PopoverContent className="w-48 p-3" align="end">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Color</p>
              <div className="grid grid-cols-4 gap-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => dispatch({ type: "SET_COLOR", color: c })}
                    className={`flex size-8 items-center justify-center rounded-lg border transition-all hover:scale-105 ${
                      state.color === c ? "ring-2 ring-primary ring-offset-1 border-transparent" : "border-border/60 hover:border-border"
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
              <div className="mt-2.5 flex items-center gap-2">
                <label className="flex h-8 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-2 text-xs transition-colors hover:border-border">
                  <span
                    className="block size-3.5 shrink-0 rounded-full border border-border/60"
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
                <Button variant="ghost" size="sm" className="tabular-nums text-xs font-mono gap-1 px-2 h-7">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 7 4 4 20 4 20 7" />
                    <line x1="9" y1="20" x2="15" y2="20" />
                    <line x1="12" y1="4" x2="12" y2="20" />
                  </svg>
                  {state.fontSize}
                </Button>
              </PopoverTrigger>
            </Tip>
            <PopoverContent className="w-52 p-3" align="end">
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
                <Button variant="ghost" size="sm" className="tabular-nums text-xs font-mono gap-1 px-2 h-7">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1" />
                    <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z" />
                  </svg>
                  {state.strokeWidth}
                </Button>
              </PopoverTrigger>
            </Tip>
            <PopoverContent className="w-52 p-3" align="end">
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

          <Separator orientation="vertical" className="mx-0.5 h-4" />

          <div className="flex items-center gap-0">
            <Tip label="Zoom out">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setZoom(-0.25)}
                disabled={state.zoom <= 0.5}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </Button>
            </Tip>
            <span className="w-9 text-center font-mono text-[11px] tabular-nums text-muted-foreground select-none">
              {Math.round(state.zoom * 100)}%
            </span>
            <Tip label="Zoom in">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setZoom(0.25)}
                disabled={state.zoom >= 3}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </Button>
            </Tip>
          </div>

          <Separator orientation="vertical" className="mx-0.5 h-4" />

          <Tip label="Download edited PDF">
            <Button
              size="sm"
              onClick={handleDownload}
              disabled={isExporting || !state.pdfData}
              className="gap-1.5 h-7 text-xs rounded-lg"
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
                <span className="flex size-4 items-center justify-center rounded-full bg-primary-foreground/20 text-[9px] font-bold">
                  {editCount}
                </span>
              )}
            </Button>
          </Tip>
        </div>
      </div>

      {selectedText && mergedStyle && (
        <div className="flex h-10 items-center gap-1 border-b border-border/40 bg-muted/20 px-3">
          <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider mr-1.5">Format</span>

          <Tip label="Bold">
            <Button
              variant={mergedStyle.isBold ? "default" : "ghost"}
              size="icon-xs"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateStyle({ isBold: !mergedStyle.isBold })}
              className={mergedStyle.isBold ? "font-bold" : ""}
            >
              <span className="text-xs font-bold">B</span>
            </Button>
          </Tip>

          <Tip label="Italic">
            <Button
              variant={mergedStyle.isItalic ? "default" : "ghost"}
              size="icon-xs"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => updateStyle({ isItalic: !mergedStyle.isItalic })}
            >
              <span className="text-xs italic font-serif">I</span>
            </Button>
          </Tip>

          <Separator orientation="vertical" className="mx-1 h-4" />

          <div className="flex items-center gap-0.5 rounded-md border border-border/50 bg-background p-0.5">
            {FONT_FAMILIES.map((f) => {
              const isActive = detectFontFamilyLabel(mergedStyle.cssFontFamily) === f.label
              return (
                <button
                  key={f.label}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => updateStyle({ cssFontFamily: f.css })}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    isActive
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                  style={{ fontFamily: f.css }}
                >
                  {f.label}
                </button>
              )
            })}
          </div>

          <Separator orientation="vertical" className="mx-1 h-4" />

          <div className="flex items-center gap-0">
            <Tip label="Decrease size">
              <Button
                variant="ghost"
                size="icon-xs"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => updateStyle({ fontSize: Math.max(4, Math.round(mergedStyle.fontSize) - 1) })}
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
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </Button>
            </Tip>
          </div>

          <Separator orientation="vertical" className="mx-1 h-4" />

          <Popover>
            <Tip label="Text color">
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <span
                    className="block size-3.5 rounded-full border border-border/80 shadow-sm"
                    style={{ backgroundColor: mergedStyle.color }}
                  />
                </Button>
              </PopoverTrigger>
            </Tip>
            <PopoverContent className="w-48 p-3" align="start">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Text color</p>
              <div className="grid grid-cols-4 gap-1.5">
                {COLOR_PRESETS.map((c) => (
                  <button
                    key={c}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => updateStyle({ color: c })}
                    className={`flex size-8 items-center justify-center rounded-lg border transition-all hover:scale-105 ${
                      mergedStyle.color === c ? "ring-2 ring-primary ring-offset-1 border-transparent" : "border-border/60 hover:border-border"
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
              <div className="mt-2.5">
                <label className="flex h-8 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-2 text-xs transition-colors hover:border-border">
                  <span
                    className="block size-3.5 shrink-0 rounded-full border border-border/60"
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
