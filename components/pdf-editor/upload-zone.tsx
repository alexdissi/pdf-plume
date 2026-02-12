"use client"

import { useCallback, useState, useEffect } from "react"

type UploadZoneProps = {
  onFileLoaded: (data: ArrayBuffer, fileName: string) => void
}

export function UploadZone({ onFileLoaded }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== "application/pdf") return
      setIsLoading(true)
      const reader = new FileReader()
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          onFileLoaded(reader.result, file.name)
        }
      }
      reader.readAsArrayBuffer(file)
    },
    [onFileLoaded]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "o") {
        e.preventDefault()
        document.getElementById("pdf-upload")?.click()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-lg text-center">
        {/* Logo */}
        <div className="mb-10 animate-slide-up">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-foreground shadow-md animate-float">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-background">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-b from-foreground to-foreground/60 bg-clip-text text-transparent">
            PDF Editor
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Edit text, draw, highlight &mdash; entirely in your browser.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`animate-slide-up group relative cursor-pointer rounded-xl border-2 border-dashed px-8 py-16 transition-all duration-200 ${
            isDragging
              ? "border-foreground bg-foreground/5 scale-[1.01]"
              : "border-border hover:border-foreground/30 hover:bg-muted/50"
          }`}
          style={{ animationDelay: "80ms" }}
          onClick={() => document.getElementById("pdf-upload")?.click()}
        >
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <svg className="h-6 w-6 animate-spin text-muted-foreground" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              <p className="text-sm text-muted-foreground">Loading PDF...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className={`rounded-full border border-border p-3 transition-colors ${isDragging ? "border-foreground/30 bg-foreground/5" : "group-hover:border-foreground/20"}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">
                  {isDragging ? "Drop to upload" : "Drop a PDF or click to browse"}
                </p>
              </div>
              {/* Keyboard shortcut hint */}
              <div className="flex items-center gap-1.5 mt-0.5 opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
                <kbd className="kbd">&#8984;O</kbd>
              </div>
            </div>
          )}
          <input
            id="pdf-upload"
            type="file"
            accept=".pdf"
            onChange={handleInputChange}
            className="hidden"
          />
        </div>

        {/* Bottom features */}
        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground animate-slide-up" style={{ animationDelay: "160ms" }}>
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Private
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            Instant
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            Free
          </span>
        </div>
      </div>

      {/* Footer */}
      <p className="absolute bottom-6 left-0 right-0 text-center text-xs text-muted-foreground/50">
        Made with ❤️ in Paris by{" "}
        <a href="https://www.linkedin.com/in/alexandredissi/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-muted-foreground transition-colors">
          Alexandre Dissi
        </a>
      </p>
    </div>
  )
}
