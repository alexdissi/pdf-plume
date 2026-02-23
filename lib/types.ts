export type Tool = "select" | "text" | "draw" | "highlight" | "eraser"

export type TextBlock = {
  id: string
  pageIndex: number
  x: number
  y: number
  width: number
  text: string
  fontSize: number
  fontFamily: string
  color: string
  bold: boolean
  italic: boolean
}

export type DrawingPath = {
  id: string
  pageIndex: number
  points: { x: number; y: number }[]
  color: string
  width: number
  opacity: number
}

export type ExtractedTextStyleEdits = {
  fontSize?: number
  isBold?: boolean
  isItalic?: boolean
  color?: string
  cssFontFamily?: string
}

export type ExtractedText = {
  id: string
  pageIndex: number
  originalStr: string
  editedStr: string | null
  pdfX: number
  pdfY: number
  pdfFontSize: number
  pdfWidth: number
  pdfHeight: number
  fontName: string
  cssFontFamily: string
  isBold: boolean
  isItalic: boolean
  color: string
  transform: number[]
  styleEdits: ExtractedTextStyleEdits | null
}

export type PageDimensions = {
  width: number
  height: number
  scale: number
}

export type PaginationFormat = "page_x_of_y"

export type PaginationPosition = "bottom-center" | "bottom-right"

export type PaginationSettings = {
  enabled: boolean
  format: PaginationFormat
  position: PaginationPosition
  fontSize: number
}

export type EditorState = {
  pdfData: ArrayBuffer | null
  fileName: string
  numPages: number
  currentTool: Tool
  color: string
  fontSize: number
  strokeWidth: number
  textBlocks: TextBlock[]
  drawings: DrawingPath[]
  extractedTexts: ExtractedText[]
  pageDimensions: Map<number, PageDimensions>
  zoom: number
  selectedExtractedTextId: string | null
  pagination: PaginationSettings
}

export type EditorAction =
  | { type: "SET_PDF"; data: ArrayBuffer; fileName: string; numPages: number }
  | { type: "SET_TOOL"; tool: Tool }
  | { type: "SET_COLOR"; color: string }
  | { type: "SET_FONT_SIZE"; size: number }
  | { type: "SET_STROKE_WIDTH"; width: number }
  | { type: "ADD_TEXT_BLOCK"; block: TextBlock }
  | { type: "UPDATE_TEXT_BLOCK"; id: string; updates: Partial<TextBlock> }
  | { type: "DELETE_TEXT_BLOCK"; id: string }
  | { type: "ADD_DRAWING"; drawing: DrawingPath }
  | { type: "DELETE_DRAWING"; id: string }
  | { type: "CLEAR_PAGE_DRAWINGS"; pageIndex: number }
  | { type: "SET_PAGE_DIMENSIONS"; pageIndex: number; dimensions: PageDimensions }
  | { type: "SET_EXTRACTED_TEXTS"; texts: ExtractedText[] }
  | { type: "UPDATE_EXTRACTED_TEXT"; id: string; editedStr: string }
  | { type: "UPDATE_EXTRACTED_TEXT_STYLE"; id: string; edits: Partial<ExtractedTextStyleEdits> }
  | { type: "SELECT_EXTRACTED_TEXT"; id: string | null }
  | { type: "SET_ZOOM"; zoom: number }
  | { type: "SET_PAGINATION_ENABLED"; enabled: boolean }
  | { type: "SET_PAGINATION_FORMAT"; format: PaginationFormat }
  | { type: "SET_PAGINATION_POSITION"; position: PaginationPosition }
  | { type: "SET_PAGINATION_FONT_SIZE"; fontSize: number }
  | { type: "RESET" }
