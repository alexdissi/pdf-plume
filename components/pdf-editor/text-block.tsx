"use client"

import { useRef, useState, useEffect, useCallback } from "react"
import type { TextBlock as TextBlockType } from "@/lib/types"

type TextBlockProps = {
  block: TextBlockType
  isActive: boolean
  onUpdate: (id: string, updates: Partial<TextBlockType>) => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
}

export function TextBlock({ block, isActive, onUpdate, onDelete, onSelect }: TextBlockProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (isActive && ref.current) {
      ref.current.focus()
    }
  }, [isActive])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === ref.current) return
      e.preventDefault()
      e.stopPropagation()
      onSelect(block.id)
      setIsDragging(true)
      const rect = containerRef.current!.getBoundingClientRect()
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    },
    [block.id, onSelect]
  )

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const parent = containerRef.current?.parentElement
      if (!parent) return
      const parentRect = parent.getBoundingClientRect()
      const x = e.clientX - parentRect.left - dragOffset.current.x
      const y = e.clientY - parentRect.top - dragOffset.current.y
      onUpdate(block.id, { x: Math.max(0, x), y: Math.max(0, y) })
    }

    const handleMouseUp = () => setIsDragging(false)

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging, block.id, onUpdate])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !block.text) {
      e.preventDefault()
      onDelete(block.id)
    }
  }

  const autoResize = useCallback(() => {
    const el = ref.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = el.scrollHeight + "px"
  }, [])

  useEffect(() => {
    autoResize()
  }, [block.text, block.fontSize, autoResize])

  return (
    <div
      ref={containerRef}
      className={`group pointer-events-auto absolute ${isDragging ? "cursor-grabbing" : ""}`}
      style={{ left: block.x, top: block.y }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(block.id)
      }}
    >
      <div
        className={`relative rounded-sm ${
          isActive
            ? "ring-2 ring-primary/50 shadow-sm"
            : "ring-1 ring-transparent hover:ring-primary/30"
        }`}
      >
        <div className="absolute -top-0.5 -left-0.5 -right-0.5 h-2 cursor-grab rounded-t-sm" />
        <textarea
          ref={ref}
          value={block.text}
          onChange={(e) => {
            onUpdate(block.id, { text: e.target.value })
            autoResize()
          }}
          onKeyDown={handleKeyDown}
          className="resize-none border-none bg-transparent p-1 outline-none"
          style={{
            fontSize: block.fontSize,
            color: block.color,
            fontWeight: block.bold ? "bold" : "normal",
            fontStyle: block.italic ? "italic" : "normal",
            fontFamily: block.fontFamily,
            minWidth: 60,
            minHeight: block.fontSize + 8,
            width: block.width || "auto",
            overflow: "hidden",
          }}
          rows={1}
        />
        {isActive && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onDelete(block.id)
            }}
            className="absolute -top-3 -right-3 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white shadow-sm hover:bg-destructive/80"
          >
            x
          </button>
        )}
      </div>
    </div>
  )
}
