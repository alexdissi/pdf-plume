"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from "react"
import type { PDFPageProxy } from "pdfjs-dist"
import type { ExtractedText, Tool } from "@/lib/types"
import { generateId } from "@/lib/pdf-utils"

type TextLayerProps = {
  page: PDFPageProxy
  pageIndex: number
  zoom: number
  tool: Tool
  extractedTexts: ExtractedText[]
  selectedExtractedTextId: string | null
  onTextsExtracted: (texts: ExtractedText[]) => void
  onUpdateText: (id: string, editedStr: string) => void
  onSelectExtractedText: (id: string | null) => void
}

type ScreenItem = ExtractedText & {
  screenX: number
  screenY: number
  screenWidth: number
  screenHeight: number
  screenFontSize: number
  mergedFontSize: number
  mergedBold: boolean
  mergedItalic: boolean
  mergedColor: string
  mergedFontFamily: string
}

type PdfJsTextItemLike = {
  str: string
  transform: number[]
  fontName: string
  width: number
  height: number
}

function isPdfJsTextItemLike(value: unknown): value is PdfJsTextItemLike {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    typeof v.str === "string" &&
    Array.isArray(v.transform) &&
    typeof v.fontName === "string" &&
    typeof v.width === "number" &&
    typeof v.height === "number"
  )
}

function rgbToHex(r: number, g: number, b: number) {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function isNearWhite(r: number, g: number, b: number, threshold = 245) {
  return r >= threshold && g >= threshold && b >= threshold
}

async function sampleTextColor(
  page: PDFPageProxy,
  items: Array<{ x: number; y: number; fontSize: number }>,
  scale: number
): Promise<string[]> {
  // Render the page once and sample around each text position to approximate the fill color.
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement("canvas")
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)

  const ctx = canvas.getContext("2d", { willReadFrequently: true })
  if (!ctx) return items.map(() => "#000000")

  // pdfjs render() types differ by version; include both canvas and canvasContext.
  const renderParams = { canvas, canvasContext: ctx, viewport } as unknown as Parameters<
    PDFPageProxy["render"]
  >[0]
  await page.render(renderParams).promise

  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)

  const getPixel = (px: number, py: number) => {
    if (px < 0 || py < 0 || px >= width || py >= height) return null
    const i = (py * width + px) * 4
    return [data[i], data[i + 1], data[i + 2], data[i + 3]] as const
  }

  const colors: string[] = []
  for (const it of items) {
    const [sx, sy] = viewport.convertToViewportPoint(it.x, it.y)
    // Sample slightly above baseline and around the glyph area.
    const cx = Math.round(sx)
    const cy = Math.round(sy - it.fontSize * scale * 0.65)

    let best: { r: number; g: number; b: number } | null = null
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const p = getPixel(cx + dx, cy + dy)
        if (!p) continue
        const [r, g, b, a] = p
        if (a < 50) continue
        if (isNearWhite(r, g, b)) continue
        best = { r, g, b }
        break
      }
      if (best) break
    }

    colors.push(best ? rgbToHex(best.r, best.g, best.b) : "#000000")
  }

  return colors
}

function getFontData(
  page: PDFPageProxy,
  fontName: string
): Promise<{ bold: boolean; italic: boolean; name: string }> {
  return new Promise((resolve) => {
    const fallback = { bold: false, italic: false, name: "" }
    const timeout = setTimeout(() => resolve(fallback), 3000)

    const processFont = (obj: unknown) => {
      clearTimeout(timeout)
      if (!obj || typeof obj !== "object") return resolve(fallback)

      const f = obj as Record<string, unknown>
      let bold = f.bold === true
      let italic = f.italic === true
      const name = typeof f.name === "string" ? f.name : ""

      if (name) {
        const n = name.toLowerCase()
        if (!bold && (n.includes("bold") || n.includes("black") || n.includes("heavy"))) bold = true
        if (!italic && (n.includes("italic") || n.includes("oblique"))) italic = true
      }

      resolve({ bold, italic, name })
    }

    try {
      const obj = page.commonObjs.get(fontName)
      processFont(obj)
    } catch {
      try {
        page.commonObjs.get(fontName, processFont)
      } catch {
        resolve(fallback)
      }
    }
  })
}

export function TextLayer({
  page,
  pageIndex,
  zoom,
  tool,
  extractedTexts,
  selectedExtractedTextId,
  onTextsExtracted,
  onUpdateText,
  onSelectExtractedText,
}: TextLayerProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const extractedRef = useRef(false)

  useEffect(() => {
    if (extractedRef.current) return
    extractedRef.current = true

    async function extract() {
      const content = await page.getTextContent()
      const styles = content.styles as Record<string, { fontFamily: string }>
      const texts: ExtractedText[] = []

      // Precompute color samples (best-effort).
      const sampleInputs: Array<{ x: number; y: number; fontSize: number }> = []
      const candidates: Array<{ item: unknown; transform: number[]; fontSize: number }> = []

      // pdfjs-dist types for TextItem vary a bit, so we treat items as unknown and narrow the fields we need.
      for (const item of content.items as unknown[]) {
        if (!isPdfJsTextItemLike(item)) continue
        if (!item.str.trim()) continue

        const t = item.transform
        const fontSize = Math.hypot(t[0], t[1])
        candidates.push({ item, transform: t, fontSize })
        sampleInputs.push({ x: t[4], y: t[5], fontSize })
      }

      let sampledColors: string[] = []
      try {
        sampledColors = await sampleTextColor(page, sampleInputs, 2)
      } catch {
        sampledColors = sampleInputs.map(() => "#000000")
      }

      for (let i = 0; i < candidates.length; i++) {
        const { item, transform: t, fontSize } = candidates[i]
        if (!isPdfJsTextItemLike(item)) continue
        const styleInfo = styles[item.fontName]
        const cssFontFamily = styleInfo?.fontFamily || "sans-serif"
        const fontData = await getFontData(page, item.fontName)

        texts.push({
          id: generateId(),
          pageIndex,
          originalStr: item.str,
          editedStr: null,
          pdfX: t[4],
          pdfY: t[5],
          pdfFontSize: fontSize,
          pdfWidth: item.width,
          pdfHeight: item.height,
          fontName: item.fontName,
          cssFontFamily,
          isBold: fontData.bold,
          isItalic: fontData.italic,
          color: sampledColors[i] ?? "#000000",
          transform: t,
          styleEdits: null,
        })
      }

      if (texts.length > 0) {
        onTextsExtracted(texts)
      }
    }

    extract()
  }, [page, pageIndex, onTextsExtracted])

  const viewport = useMemo(() => page.getViewport({ scale: 1.5 * zoom }), [page, zoom])

  const pageTexts = useMemo(
    () => extractedTexts.filter((t) => t.pageIndex === pageIndex),
    [extractedTexts, pageIndex]
  )

  const screenItems: ScreenItem[] = useMemo(() => {
    return pageTexts.map((t) => {
      const mergedFontSize = t.styleEdits?.fontSize ?? t.pdfFontSize
      const mergedBold = t.styleEdits?.isBold ?? t.isBold
      const mergedItalic = t.styleEdits?.isItalic ?? t.isItalic
      const mergedColor = t.styleEdits?.color ?? t.color
      const mergedFontFamily = t.styleEdits?.cssFontFamily ?? t.cssFontFamily

      const [screenX, screenY] = viewport.convertToViewportPoint(t.pdfX, t.pdfY)
      const screenFontSize = mergedFontSize * viewport.scale
      const screenWidth = t.pdfWidth * viewport.scale
      const screenHeight = Math.max(screenFontSize * 1.2, t.pdfHeight * viewport.scale)

      return {
        ...t,
        screenX,
        screenY: screenY - screenHeight,
        screenWidth: Math.max(screenWidth, 20),
        screenHeight,
        screenFontSize,
        mergedFontSize,
        mergedBold,
        mergedItalic,
        mergedColor,
        mergedFontFamily,
      }
    })
  }, [pageTexts, viewport])

  const handleClick = useCallback(
    (id: string, e: React.MouseEvent) => {
      if (tool !== "select") return
      e.stopPropagation()
      onSelectExtractedText(id)
      setEditingId(id)
    },
    [tool, onSelectExtractedText]
  )

  const handleBlur = useCallback(() => {
    setEditingId(null)
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        setEditingId(null)
        onSelectExtractedText(null)
      } else if (e.key === "Enter") {
        e.preventDefault()
        setEditingId(null)
      }
    },
    [onSelectExtractedText]
  )

  const isInteractive = tool === "select"

  return (
    <div className={`absolute inset-0 ${isInteractive ? "z-25" : "pointer-events-none z-5"}`}>
      {screenItems.map((item) => {
        const isSelected = selectedExtractedTextId === item.id
        const isEditing = editingId === item.id
        const hasEdits = item.editedStr !== null || item.styleEdits !== null
        const displayStr = item.editedStr ?? item.originalStr

        const fontStyles: React.CSSProperties = {
          fontSize: item.screenFontSize,
          lineHeight: `${item.screenHeight}px`,
          fontFamily: `"${item.mergedFontFamily}", ${item.mergedFontFamily}, sans-serif`,
          fontWeight: item.mergedBold ? 700 : 400,
          fontStyle: item.mergedItalic ? "italic" : "normal",
          color: item.mergedColor,
        }

        return (
          <div
            key={item.id}
            className="absolute"
            style={{
              left: item.screenX,
              top: item.screenY,
              width: hasEdits && !isEditing ? "auto" : item.screenWidth,
              minWidth: item.screenWidth,
              height: item.screenHeight,
            }}
          >
            {isEditing ? (
              <input
                autoFocus
                type="text"
                value={displayStr}
                onChange={(e) => onUpdateText(item.id, e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className="h-full w-full border-none bg-white px-0 outline-none ring-2 ring-blue-500 rounded-sm"
                style={{
                  ...fontStyles,
                  minWidth: item.screenWidth,
                }}
              />
            ) : isSelected ? (
              <div
                onClick={(e) => handleClick(item.id, e)}
                className={`h-full whitespace-nowrap bg-white ring-2 ring-blue-500/60 rounded-sm ${isInteractive ? "cursor-text" : ""}`}
                style={fontStyles}
              >
                {displayStr}
              </div>
            ) : hasEdits ? (
              <div
                onClick={(e) => handleClick(item.id, e)}
                className={`h-full whitespace-nowrap bg-white ${isInteractive ? "cursor-text hover:ring-1 hover:ring-blue-500/40" : ""}`}
                style={fontStyles}
              >
                {displayStr}
              </div>
            ) : (
              <div
                onClick={(e) => handleClick(item.id, e)}
                className={`h-full w-full ${
                  isInteractive
                    ? "cursor-text hover:bg-blue-500/10 hover:outline hover:outline-1 hover:outline-blue-500/30"
                    : ""
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
