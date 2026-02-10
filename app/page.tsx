"use client";

import { BrandLogo } from "@/components/branding/logo";
import { PdfEditor } from "@/components/pdf-editor/pdf-editor";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorProvider } from "@/lib/editor-context";

export default function Home() {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-white text-slate-900 dark:bg-black dark:text-slate-100">
        <header className="border-b border-slate-200/70 dark:border-slate-800">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-5">
            <div className="flex items-center gap-3">
              <BrandLogo variant="classic" size={42} priority />
              <div className="leading-tight">
                <div className="text-base font-semibold">Plume</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  PDF editor in your browser
                </div>
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              <a
                href="#editor"
                className="text-sm text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              >
                Open editor
              </a>
              <a
                href="https://plume.dissi.fr"
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200"
              >
                plume.dissi.fr
              </a>
            </div>
          </div>
        </header>

        <main>
          <section className="mx-auto max-w-5xl px-6 py-10">
            <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr] md:items-center">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Edit PDFs instantly.
                </h1>
                <p className="mt-3 max-w-xl text-base text-slate-600 dark:text-slate-400">
                  Add text, draw, highlight, and annotate — directly in your
                  browser.
                </p>

                <ul className="mt-6 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  <li>• Fast and simple UI</li>
                  <li>• No install</li>
                  <li>• Export your edited PDF</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center gap-4">
                  <BrandLogo variant="app" size={64} />
                  <div>
                    <div className="text-sm font-medium">Plume</div>
                    <div className="text-xs text-slate-600 dark:text-slate-400">
                      Lightweight PDF editor
                    </div>
                  </div>
                </div>
                <div className="mt-4 text-xs text-slate-600 dark:text-slate-400">
                  Tip: drag & drop a PDF in the editor below.
                </div>
              </div>
            </div>
          </section>

          <section id="editor" className="mx-auto max-w-5xl px-6 pb-14">
            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
              <EditorProvider>
                <PdfEditor />
              </EditorProvider>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-200/70 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-500">
          © {new Date().getFullYear()} Plume
        </footer>
      </div>
    </TooltipProvider>
  );
}
