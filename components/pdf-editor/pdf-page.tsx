"use client"

import { useRef, useEffect, useCallback } from "react"
import type { PDFPageProxy } from "pdfjs-dist"
import type { TextBlock as TextBlockType, DrawingPath, ExtractedText, Tool } from "@/lib/types"
import { TextBlock } from "./text-block"
import { TextLayer } from "./text-layer"
import { DrawingCanvas } from "./drawing-canvas"
import { generateId } from "@/lib/pdf-utils"

type PdfPageProps = {
  page: PDFPageProxy
  pageIndex: number
  zoom: number
  tool: Tool
  color: string
  fontSize: number
  strokeWidth: number
  textBlocks: TextBlockType[]
  drawings: DrawingPath[]
  extractedTexts: ExtractedText[]
  activeTextBlockId: string | null
  selectedExtractedTextId: string | null
  onAddTextBlock: (block: TextBlockType) => void
  onUpdateTextBlock: (id: string, updates: Partial<TextBlockType>) => void
  onDeleteTextBlock: (id: string) => void
  onSelectTextBlock: (id: string | null) => void
  onAddDrawing: (drawing: DrawingPath) => void
  onDeleteDrawing: (id: string) => void
  onTextsExtracted: (texts: ExtractedText[]) => void
  onUpdateExtractedText: (id: string, editedStr: string) => void
  onSelectExtractedText: (id: string | null) => void
  onSetPageDimensions: (pageIndex: number, width: number, height: number, scale: number) => void
  onRegisterCanvas: (pageIndex: number, canvas: HTMLCanvasElement) => void
}

export function PdfPage({
  page,
  pageIndex,
  zoom,
  tool,
  color,
  fontSize,
  strokeWidth,
  textBlocks,
  drawings,
  extractedTexts,
  activeTextBlockId,
  selectedExtractedTextId,
  onAddTextBlock,
  onUpdateTextBlock,
  onDeleteTextBlock,
  onSelectTextBlock,
  onAddDrawing,
  onDeleteDrawing,
  onTextsExtracted,
  onUpdateExtractedText,
  onSelectExtractedText,
  onSetPageDimensions,
  onRegisterCanvas,
}: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<ReturnType<PDFPageProxy["render"]> | null>(null)

  const renderPage = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel() } catch {}
    }

    const viewport = page.getViewport({ scale: 1.5 * zoom })
    canvas.width = viewport.width
    canvas.height = viewport.height

    const renderTask = page.render({ canvas, viewport })
    renderTaskRef.current = renderTask

    try {
      await renderTask.promise
      onSetPageDimensions(pageIndex, viewport.width, viewport.height, 1.5 * zoom)
    } catch {
      // render cancelled
    }
  }, [page, zoom, pageIndex, onSetPageDimensions])

  useEffect(() => {
    renderPage()
  }, [renderPage])

  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onSelectExtractedText(null)

    if (tool !== "text") {
      onSelectTextBlock(null)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const block: TextBlockType = {
      id: generateId(),
      pageIndex,
      x,
      y,
      width: 200,
      text: "",
      fontSize,
      fontFamily: "Helvetica, sans-serif",
      color,
      bold: false,
      italic: false,
    }
    onAddTextBlock(block)
    onSelectTextBlock(block.id)
  }

  const viewport = page.getViewport({ scale: 1.5 * zoom })

  return (
    <div className="rounded-lg ring-1 ring-black/[0.06] shadow-[0_4px_24px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.04)]">
      <div
        className="relative bg-white"
        style={{ width: viewport.width, height: viewport.height }}
        onClick={handlePageClick}
      >
        <canvas ref={canvasRef} className="absolute inset-0" />

        <TextLayer
          page={page}
          pageIndex={pageIndex}
          zoom={zoom}
          tool={tool}
          extractedTexts={extractedTexts}
          selectedExtractedTextId={selectedExtractedTextId}
          onTextsExtracted={onTextsExtracted}
          onUpdateText={onUpdateExtractedText}
          onSelectExtractedText={onSelectExtractedText}
        />

        <DrawingCanvas
          pageIndex={pageIndex}
          width={viewport.width}
          height={viewport.height}
          tool={tool}
          color={color}
          strokeWidth={strokeWidth}
          drawings={drawings}
          onAddDrawing={onAddDrawing}
          onDeleteDrawing={onDeleteDrawing}
          onRegisterCanvas={onRegisterCanvas}
        />

        {tool !== "draw" && tool !== "highlight" && (
          <div className="pointer-events-none absolute inset-0 z-30">
            {textBlocks
              .filter((b) => b.pageIndex === pageIndex)
              .map((block) => (
                <TextBlock
                  key={block.id}
                  block={block}
                  isActive={activeTextBlockId === block.id}
                  onUpdate={onUpdateTextBlock}
                  onDelete={onDeleteTextBlock}
                  onSelect={onSelectTextBlock}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
