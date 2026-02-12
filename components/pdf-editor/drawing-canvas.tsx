"use client"

import { useRef, useEffect, useCallback } from "react"
import type { DrawingPath, Tool } from "@/lib/types"
import { generateId } from "@/lib/pdf-utils"

type DrawingCanvasProps = {
  pageIndex: number
  width: number
  height: number
  tool: Tool
  color: string
  strokeWidth: number
  drawings: DrawingPath[]
  onAddDrawing: (drawing: DrawingPath) => void
  onDeleteDrawing: (id: string) => void
  onRegisterCanvas: (pageIndex: number, canvas: HTMLCanvasElement) => void
}

export function DrawingCanvas({
  pageIndex,
  width,
  height,
  tool,
  color,
  strokeWidth,
  drawings,
  onAddDrawing,
  onDeleteDrawing,
  onRegisterCanvas,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const currentPathRef = useRef<{ x: number; y: number }[]>([])

  const isDrawTool = tool === "draw" || tool === "highlight"
  const isEraser = tool === "eraser"
  const isCanvasActive = isDrawTool || isEraser

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    onRegisterCanvas(pageIndex, canvas)
  }, [pageIndex, onRegisterCanvas])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    ctx.clearRect(0, 0, width, height)

    const pageDrawings = drawings.filter((d) => d.pageIndex === pageIndex)
    for (const drawing of pageDrawings) {
      if (drawing.points.length < 2) continue
      ctx.beginPath()
      ctx.strokeStyle = drawing.color
      ctx.lineWidth = drawing.width
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.globalAlpha = drawing.opacity
      ctx.moveTo(drawing.points[0].x, drawing.points[0].y)
      for (let i = 1; i < drawing.points.length; i++) {
        ctx.lineTo(drawing.points[i].x, drawing.points[i].y)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    }
  }, [drawings, pageIndex, width, height])

  useEffect(() => {
    redraw()
  }, [redraw])

  const getPoint = (e: React.MouseEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const eraseAt = useCallback(
    (point: { x: number; y: number }) => {
      const threshold = 12
      const pageDrawings = drawings.filter((d) => d.pageIndex === pageIndex)
      for (const drawing of pageDrawings) {
        for (const p of drawing.points) {
          const dx = p.x - point.x
          const dy = p.y - point.y
          if (dx * dx + dy * dy < (threshold + drawing.width / 2) ** 2) {
            onDeleteDrawing(drawing.id)
            break
          }
        }
      }
    },
    [drawings, pageIndex, onDeleteDrawing]
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isCanvasActive) return
    e.preventDefault()
    e.stopPropagation()
    isDrawingRef.current = true
    const point = getPoint(e)
    if (isEraser) {
      eraseAt(point)
    } else {
      currentPathRef.current = [point]
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current || !isCanvasActive) return
    e.preventDefault()
    const point = getPoint(e)

    if (isEraser) {
      eraseAt(point)
      return
    }

    currentPathRef.current.push(point)

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    redraw()

    const points = currentPathRef.current
    if (points.length < 2) return
    ctx.beginPath()
    ctx.strokeStyle = tool === "highlight" ? "#FFEB3B" : color
    ctx.lineWidth = tool === "highlight" ? strokeWidth * 3 : strokeWidth
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.globalAlpha = tool === "highlight" ? 0.35 : 1
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false

    if (isEraser) return

    if (currentPathRef.current.length >= 2) {
      onAddDrawing({
        id: generateId(),
        pageIndex,
        points: currentPathRef.current,
        color: tool === "highlight" ? "#FFEB3B" : color,
        width: tool === "highlight" ? strokeWidth * 3 : strokeWidth,
        opacity: tool === "highlight" ? 0.35 : 1,
      })
    }
    currentPathRef.current = []
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`absolute inset-0 ${isCanvasActive ? (isEraser ? "cursor-pointer" : "cursor-crosshair") + " z-20" : "pointer-events-none z-10"}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  )
}
