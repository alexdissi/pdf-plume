import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib"
import type { TextBlock, DrawingPath, ExtractedText, PageDimensions } from "./types"

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return rgb(0, 0, 0)
  return rgb(
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  )
}

type FontSet = {
  regular: PDFFont
  bold: PDFFont
  italic: PDFFont
  boldItalic: PDFFont
}

function pickFont(fontSet: FontSet, isBold: boolean, isItalic: boolean): PDFFont {
  if (isBold && isItalic) return fontSet.boldItalic
  if (isBold) return fontSet.bold
  if (isItalic) return fontSet.italic
  return fontSet.regular
}

function detectFontFamily(cssFontFamily: string): "serif" | "mono" | "sans" {
  const lower = cssFontFamily.toLowerCase()
  if (lower.includes("courier") || lower.includes("mono") || lower.includes("consolas")) return "mono"
  if (lower.includes("times") || lower.includes("georgia") || lower.includes("serif") && !lower.includes("sans")) return "serif"
  return "sans"
}

export async function compilePdf(
  originalPdfData: ArrayBuffer,
  textBlocks: TextBlock[],
  drawings: DrawingPath[],
  extractedTexts: ExtractedText[],
  pageDimensions: Map<number, PageDimensions>,
  drawingCanvases: Map<number, HTMLCanvasElement>
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(originalPdfData)

  const fonts: Record<string, FontSet> = {
    sans: {
      regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
      boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
    },
    serif: {
      regular: await pdfDoc.embedFont(StandardFonts.TimesRoman),
      bold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
      italic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
      boldItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic),
    },
    mono: {
      regular: await pdfDoc.embedFont(StandardFonts.Courier),
      bold: await pdfDoc.embedFont(StandardFonts.CourierBold),
      italic: await pdfDoc.embedFont(StandardFonts.CourierOblique),
      boldItalic: await pdfDoc.embedFont(StandardFonts.CourierBoldOblique),
    },
  }

  const pages = pdfDoc.getPages()

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]
    const dims = pageDimensions.get(i)
    if (!dims) continue

    const pdfWidth = page.getWidth()
    const pdfHeight = page.getHeight()
    const scaleX = pdfWidth / dims.width
    const scaleY = pdfHeight / dims.height

    const editedTexts = extractedTexts.filter(
      (t) => t.pageIndex === i && (
        (t.editedStr !== null && t.editedStr !== t.originalStr) ||
        t.styleEdits !== null
      )
    )
    for (const et of editedTexts) {
      const padding = et.pdfFontSize * 0.2
      page.drawRectangle({
        x: et.pdfX - padding,
        y: et.pdfY - et.pdfFontSize * 0.3,
        width: et.pdfWidth + padding * 2,
        height: et.pdfFontSize * 1.4,
        color: rgb(1, 1, 1),
        borderWidth: 0,
      })

      const textToDraw = et.editedStr ?? et.originalStr
      if (textToDraw.trim()) {
        const fontSize = et.styleEdits?.fontSize ?? et.pdfFontSize
        const isBold = et.styleEdits?.isBold ?? et.isBold
        const isItalic = et.styleEdits?.isItalic ?? et.isItalic
        const textColor = et.styleEdits?.color ?? et.color
        const fontFamily = et.styleEdits?.cssFontFamily ?? et.cssFontFamily

        const family = detectFontFamily(fontFamily)
        const font = pickFont(fonts[family], isBold, isItalic)

        page.drawText(textToDraw, {
          x: et.pdfX,
          y: et.pdfY,
          size: fontSize,
          font,
          color: hexToRgb(textColor),
        })
      }
    }

    const pageTextBlocks = textBlocks.filter((b) => b.pageIndex === i)
    for (const block of pageTextBlocks) {
      if (!block.text.trim()) continue

      const font = pickFont(fonts.sans, block.bold, block.italic)
      const pdfFontSize = block.fontSize * scaleX
      const pdfX = block.x * scaleX
      const pdfY = pdfHeight - block.y * scaleY - pdfFontSize

      const lines = block.text.split("\n")
      lines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: pdfX,
          y: pdfY - lineIndex * pdfFontSize * 1.2,
          size: pdfFontSize,
          font,
          color: hexToRgb(block.color),
        })
      })
    }

    const drawingCanvas = drawingCanvases.get(i)
    if (drawingCanvas) {
      const pngDataUrl = drawingCanvas.toDataURL("image/png")
      const pngData = await fetch(pngDataUrl).then((r) => r.arrayBuffer())
      const pngImage = await pdfDoc.embedPng(new Uint8Array(pngData))
      page.drawImage(pngImage, {
        x: 0,
        y: 0,
        width: pdfWidth,
        height: pdfHeight,
      })
    }

    // Footer pagination (burned into the exported PDF)
    const pageNumberText = `Page ${i + 1} / ${pages.length}`
    const pageNumberFont = fonts.sans.regular
    const pageNumberSize = 10
    const textWidth = pageNumberFont.widthOfTextAtSize(pageNumberText, pageNumberSize)

    page.drawText(pageNumberText, {
      x: (pdfWidth - textWidth) / 2,
      y: 14,
      size: pageNumberSize,
      font: pageNumberFont,
      color: rgb(0.45, 0.45, 0.45),
    })
  }

  return pdfDoc.save()
}

export function downloadPdf(data: Uint8Array, fileName: string) {
  const blob = new Blob([new Uint8Array(data)], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName.replace(/\.pdf$/i, "") + "_edited.pdf"
  a.click()
  URL.revokeObjectURL(url)
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}
