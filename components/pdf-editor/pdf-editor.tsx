"use client"

import { useCallback } from "react"
import { useEditor } from "@/lib/editor-context"
import { UploadZone } from "./upload-zone"
import { Toolbar } from "./toolbar"
import { PdfViewer } from "./pdf-viewer"

export function PdfEditor() {
  const { state, dispatch } = useEditor()

  const handleFileLoaded = useCallback(
    async (data: ArrayBuffer, fileName: string) => {
      const pdfjsLib = await import("pdfjs-dist")
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString()

      const doc = await pdfjsLib.getDocument({ data: data.slice(0) }).promise
      dispatch({ type: "SET_PDF", data, fileName, numPages: doc.numPages })
    },
    [dispatch]
  )

  if (!state.pdfData) {
    return <UploadZone onFileLoaded={handleFileLoaded} />
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Toolbar />
      <PdfViewer />
    </div>
  )
}
