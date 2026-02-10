"use client";

import { BrandLogo } from "@/components/branding/logo";
import { PdfEditor } from "@/components/pdf-editor/pdf-editor";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorProvider } from "@/lib/editor-context";

export default function Home() {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-white dark:bg-black font-sans">
        <header className="mx-auto max-w-5xl px-6 pt-6">
          <div className="flex items-center gap-3">
            <BrandLogo variant="classic" size={36} priority />
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Plume
            </div>
          </div>
        </header>

        <EditorProvider>
          <PdfEditor />
        </EditorProvider>
      </div>
    </TooltipProvider>
  );
}
