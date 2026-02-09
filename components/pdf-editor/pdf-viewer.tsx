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
      <div className="flex flex-1 items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <p className="text-sm">Loading document...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center overflow-auto bg-muted/30 py-8 px-4">
      <div className="flex flex-col items-center gap-6">
        {pages.map((page, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
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
              onTextsExtracted={handleTextsExtracted}
              onUpdateExtractedText={handleUpdateExtractedText}
              onSelectExtractedText={handleSelectExtractedText}
              onSetPageDimensions={handleSetPageDimensions}
              onRegisterCanvas={handleRegisterCanvas}
            />
            {pages.length > 1 && (
              <span className="text-[11px] font-mono text-muted-foreground/60 select-none tabular-nums">
                {i + 1} / {pages.length}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
