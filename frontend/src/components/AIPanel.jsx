import React from "react";

/**
 * FormattedMarkdown Component
 * Parses raw AI markdown response strings (\n, ###, **, -, numbered lists, inline `code`)
 * into clean formatted HTML elements.
 */
export function FormattedMarkdown({ content }) {
  if (!content) return null;

  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-xs text-slate-800 leading-relaxed">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;

        // Header 3: ### Title
        if (trimmed.startsWith("### ")) {
          return (
            <h3 key={idx} className="text-sm font-bold text-slate-900 mt-3 mb-1">
              {parseInlineMarkdown(trimmed.replace(/^###\s+/, ""))}
            </h3>
          );
        }

        // Header 2: ## Title
        if (trimmed.startsWith("## ")) {
          return (
            <h2 key={idx} className="text-base font-bold text-slate-900 mt-3 mb-1">
              {parseInlineMarkdown(trimmed.replace(/^##\s+/, ""))}
            </h2>
          );
        }

        // Header 1: # Title
        if (trimmed.startsWith("# ")) {
          return (
            <h1 key={idx} className="text-lg font-extrabold text-slate-900 mt-4 mb-2">
              {parseInlineMarkdown(trimmed.replace(/^#\s+/, ""))}
            </h1>
          );
        }

        // Bullet list: - item or * item
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <div key={idx} className="flex items-start space-x-2 pl-2 my-1">
              <span className="text-emerald-600 font-bold mt-0.5">•</span>
              <span className="text-slate-700 flex-1">
                {parseInlineMarkdown(trimmed.replace(/^[-*]\s+/, ""))}
              </span>
            </div>
          );
        }

        // Numbered list: 1. item
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
        if (numMatch) {
          return (
            <div key={idx} className="flex items-start space-x-2 pl-2 my-1">
              <span className="text-emerald-700 font-bold text-[11px] bg-emerald-100 px-1.5 py-0.5 rounded">
                {numMatch[1]}
              </span>
              <span className="text-slate-700 flex-1 mt-0.5">
                {parseInlineMarkdown(numMatch[2])}
              </span>
            </div>
          );
        }

        // Regular Paragraph
        return (
          <p key={idx} className="text-slate-700">
            {parseInlineMarkdown(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Helper to parse bold (**text**), italic (*text*), and code (`text`)
 */
function parseInlineMarkdown(text) {
  if (!text) return "";

  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="bg-emerald-50 text-emerald-800 font-mono text-[11px] px-1 py-0.5 rounded border border-emerald-200">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default FormattedMarkdown;
