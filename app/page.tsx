"use client"

import { EditorProvider } from "@/lib/editor-context"
import { PdfEditor } from "@/components/pdf-editor/pdf-editor"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function Home() {
  return (
    <TooltipProvider delayDuration={300}>
      <EditorProvider>
        <PdfEditor />
      </EditorProvider>
    </TooltipProvider>
  )
}
