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

  return (
    <div className="dot-grid flex flex-1 flex-col items-center overflow-auto bg-muted/20 py-8 px-4">
      <div className="flex flex-col items-center gap-8">
        {pages.map((page, i) => (
          <div key={i} className="flex flex-col items-center gap-2.5 animate-fade-in" style={{ animationDelay: `${i * 60}ms` }}>
            <PdfPage
              page={page}
              pageIndex={i}
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
            {pages.length > 1 && (
              <span className="inline-flex items-center rounded-full border border-border/50 bg-background/80 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground/60 select-none tabular-nums shadow-sm">
                {i + 1} / {pages.length}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
