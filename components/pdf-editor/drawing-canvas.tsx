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
  onRegisterCanvas,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const currentPathRef = useRef<{ x: number; y: number }[]>([])

  const isDrawTool = tool === "draw" || tool === "highlight"

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

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawTool) return
    e.preventDefault()
    e.stopPropagation()
    isDrawingRef.current = true
    currentPathRef.current = [getPoint(e)]
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawingRef.current || !isDrawTool) return
    e.preventDefault()
    const point = getPoint(e)
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
      className={`absolute inset-0 ${isDrawTool ? "cursor-crosshair z-20" : "pointer-events-none z-10"}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  )
}
