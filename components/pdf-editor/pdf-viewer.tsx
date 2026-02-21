"use client"

import { useEffect, useState, useCallback } from "react"
import type { PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist"
import { useEditor } from "@/lib/editor-context"
import { PdfPage } from "./pdf-page"

export function PdfViewer() {
  const { state, dispatch, drawingCanvasRefs } = useEditor()
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null)
  const [pages, setPages] = useState<PDFPageProxy[]>([])
  const [activeTextBlockId, setActiveTextBlockId] = useState<string | null>(null)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)

  useEffect(() => {
    if (!state.pdfData) return

    let cancelled = false

    async function loadPdf() {
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString()

      const doc = await pdfjsLib.getDocument({ data: state.pdfData!.slice(0) }).promise
      if (cancelled) return

      const loadedPages: PDFPageProxy[] = []
      for (let i = 1; i <= doc.numPages; i++) {
        loadedPages.push(await doc.getPage(i))
      }
      if (cancelled) return

      setPdfDoc(doc)
      setPages(loadedPages)
      setCurrentPageIndex(0)
      dispatch({ type: "SET_PDF", data: state.pdfData!, fileName: state.fileName, numPages: doc.numPages })
    }

    loadPdf()
    return () => { cancelled = true }
  }, [state.pdfData, state.fileName, dispatch])

  const handleSetPageDimensions = useCallback(
    (pageIndex: number, width: number, height: number, scale: number) => {
      dispatch({ type: "SET_PAGE_DIMENSIONS", pageIndex, dimensions: { width, height, scale } })
    },
    [dispatch]
  )

  const handleTextsExtracted = useCallback(
    (texts: import("@/lib/types").ExtractedText[]) => {
      dispatch({ type: "SET_EXTRACTED_TEXTS", texts })
    },
    [dispatch]
  )

  const handleUpdateExtractedText = useCallback(
    (id: string, editedStr: string) => {
      dispatch({ type: "UPDATE_EXTRACTED_TEXT", id, editedStr })
    },
    [dispatch]
  )

  const handleSelectExtractedText = useCallback(
    (id: string | null) => {
      dispatch({ type: "SELECT_EXTRACTED_TEXT", id })
    },
    [dispatch]
  )

  const handleRegisterCanvas = useCallback(
    (pageIndex: number, canvas: HTMLCanvasElement) => {
      drawingCanvasRefs.current.set(pageIndex, canvas)
    },
    [drawingCanvasRefs]
  )

  if (!pdfDoc || pages.length === 0) {
    return (
      <div className="dot-grid flex flex-1 items-center justify-center bg-muted/20">
        <div className="flex flex-col items-center gap-4 text-muted-foreground animate-fade-in">
          <div className="relative flex h-10 w-10 items-center justify-center">
            <div className="absolute inset-0 rounded-full border-2 border-border" />
            <div className="absolute inset-0 rounded-full border-2 border-foreground border-t-transparent animate-spin" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-sm font-medium">Loading document</p>
            <p className="text-xs text-muted-foreground/60">Parsing pages...</p>
          </div>
        </div>
      </div>
    )
  }

  const page = pages[currentPageIndex]
  const canGoPrev = currentPageIndex > 0
  const canGoNext = currentPageIndex < pages.length - 1

  return (
    <div className="dot-grid flex flex-1 flex-col items-center overflow-auto bg-muted/20 py-8 px-4">
      <div className="sticky top-4 z-10 mb-4 flex items-center gap-2 rounded-full border border-border/60 bg-background/90 px-2 py-1.5 shadow-sm backdrop-blur">
        <button
          type="button"
          onClick={() => setCurrentPageIndex((p) => Math.max(0, p - 1))}
          disabled={!canGoPrev}
          className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <span className="inline-flex min-w-20 items-center justify-center rounded-full border border-border/50 bg-muted/40 px-3 py-1 text-xs font-mono tabular-nums text-muted-foreground">
          {currentPageIndex + 1} / {pages.length}
        </span>
        <button
          type="button"
          onClick={() => setCurrentPageIndex((p) => Math.min(pages.length - 1, p + 1))}
          disabled={!canGoNext}
          className="rounded-full border border-border/60 px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>

      <div className="flex flex-col items-center gap-8">
        <div key={currentPageIndex} className="flex flex-col items-center gap-2.5 animate-fade-in">
          <PdfPage
            page={page}
            pageIndex={currentPageIndex}
            zoom={state.zoom}
            tool={state.currentTool}
            color={state.color}
            fontSize={state.fontSize}
            strokeWidth={state.strokeWidth}
            textBlocks={state.textBlocks}
            drawings={state.drawings}
            extractedTexts={state.extractedTexts}
            activeTextBlockId={activeTextBlockId}
            selectedExtractedTextId={state.selectedExtractedTextId}
            onAddTextBlock={(block) => dispatch({ type: "ADD_TEXT_BLOCK", block })}
            onUpdateTextBlock={(id, updates) => dispatch({ type: "UPDATE_TEXT_BLOCK", id, updates })}
            onDeleteTextBlock={(id) => {
              dispatch({ type: "DELETE_TEXT_BLOCK", id })
              if (activeTextBlockId === id) setActiveTextBlockId(null)
            }}
            onSelectTextBlock={setActiveTextBlockId}
            onAddDrawing={(drawing) => dispatch({ type: "ADD_DRAWING", drawing })}
            onDeleteDrawing={(id) => dispatch({ type: "DELETE_DRAWING", id })}
            onTextsExtracted={handleTextsExtracted}
            onUpdateExtractedText={handleUpdateExtractedText}
            onSelectExtractedText={handleSelectExtractedText}
            onSetPageDimensions={handleSetPageDimensions}
            onRegisterCanvas={handleRegisterCanvas}
          />
        </div>
      </div>
    </div>
  )
}
