"use client"

import { createContext, useContext, useReducer, useRef, type Dispatch, type RefObject } from "react"
import type { EditorState, EditorAction } from "./types"

const initialState: EditorState = {
  pdfData: null,
  fileName: "",
  numPages: 0,
  currentTool: "select",
  color: "#000000",
  fontSize: 16,
  strokeWidth: 3,
  textBlocks: [],
  drawings: [],
  extractedTexts: [],
  pageDimensions: new Map(),
  zoom: 1,
  selectedExtractedTextId: null,
}

function editorReducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "SET_PDF":
      return {
        ...initialState,
        pdfData: action.data,
        fileName: action.fileName,
        numPages: action.numPages,
      }
    case "SET_TOOL":
      return { ...state, currentTool: action.tool, selectedExtractedTextId: null }
    case "SET_COLOR":
      return { ...state, color: action.color }
    case "SET_FONT_SIZE":
      return { ...state, fontSize: action.size }
    case "SET_STROKE_WIDTH":
      return { ...state, strokeWidth: action.width }
    case "ADD_TEXT_BLOCK":
      return { ...state, textBlocks: [...state.textBlocks, action.block] }
    case "UPDATE_TEXT_BLOCK":
      return {
        ...state,
        textBlocks: state.textBlocks.map((b) =>
          b.id === action.id ? { ...b, ...action.updates } : b
        ),
      }
    case "DELETE_TEXT_BLOCK":
      return {
        ...state,
        textBlocks: state.textBlocks.filter((b) => b.id !== action.id),
      }
    case "ADD_DRAWING":
      return { ...state, drawings: [...state.drawings, action.drawing] }
    case "DELETE_DRAWING":
      return {
        ...state,
        drawings: state.drawings.filter((d) => d.id !== action.id),
      }
    case "CLEAR_PAGE_DRAWINGS":
      return {
        ...state,
        drawings: state.drawings.filter((d) => d.pageIndex !== action.pageIndex),
      }
    case "SET_PAGE_DIMENSIONS": {
      const newDims = new Map(state.pageDimensions)
      newDims.set(action.pageIndex, action.dimensions)
      return { ...state, pageDimensions: newDims }
    }
    case "SET_EXTRACTED_TEXTS":
      return { ...state, extractedTexts: [...state.extractedTexts, ...action.texts] }
    case "UPDATE_EXTRACTED_TEXT":
      return {
        ...state,
        extractedTexts: state.extractedTexts.map((t) =>
          t.id === action.id ? { ...t, editedStr: action.editedStr } : t
        ),
      }
    case "UPDATE_EXTRACTED_TEXT_STYLE":
      return {
        ...state,
        extractedTexts: state.extractedTexts.map((t) =>
          t.id === action.id
            ? { ...t, styleEdits: { ...t.styleEdits, ...action.edits } }
            : t
        ),
      }
    case "SELECT_EXTRACTED_TEXT":
      return { ...state, selectedExtractedTextId: action.id }
    case "SET_ZOOM":
      return { ...state, zoom: action.zoom }
    case "RESET":
      return initialState
    default:
      return state
  }
}

type EditorContextType = {
  state: EditorState
  dispatch: Dispatch<EditorAction>
  drawingCanvasRefs: RefObject<Map<number, HTMLCanvasElement>>
}

const EditorContext = createContext<EditorContextType | null>(null)

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(editorReducer, initialState)
  const drawingCanvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map())

  return (
    <EditorContext.Provider value={{ state, dispatch, drawingCanvasRefs }}>
      {children}
    </EditorContext.Provider>
  )
}

export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) throw new Error("useEditor must be used within EditorProvider")
  return ctx
}
