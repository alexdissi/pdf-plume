# Plume

A fast, private PDF editor that runs entirely in your browser. Edit existing text, add annotations, draw, highlight — then export a clean PDF. No uploads, no servers, no accounts.

**[plume.dissi.fr](https://plume.dissi.fr)**

## Features

- **Edit existing text** — Click any text in your PDF to modify it with live preview
- **Text formatting** — Change font size, weight, style, color, and family (Sans / Serif / Mono)
- **Add text blocks** — Place new text anywhere on the page, drag to reposition
- **Draw & annotate** — Freehand drawing with adjustable stroke width and color
- **Highlight** — Semi-transparent highlighter tool
- **Eraser** — Remove drawings and annotations
- **Zoom** — 50% to 300% zoom with sharp rendering
- **Multi-page** — Full support for multi-page documents
- **Instant export** — Download your edited PDF in one click

## Privacy

Plume processes everything client-side. Your files never leave your browser — no data is sent to any server.

## Tech Stack

- [Next.js](https://nextjs.org) 16 with Turbopack
- [React](https://react.dev) 19
- [Tailwind CSS](https://tailwindcss.com) v4
- [shadcn/ui](https://ui.shadcn.com)
- [pdf.js](https://mozilla.github.io/pdf.js/) for rendering
- [pdf-lib](https://pdf-lib.js.org/) for PDF manipulation

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [localhost:3000](http://localhost:3000) to start editing.

## License

MIT
