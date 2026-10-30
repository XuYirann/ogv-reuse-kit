"use client";

import { useEffect, useRef } from "react";

const htmlStoragePrefix = "html:v1:";

function isPublishedGitHubPage() {
  return window.location.hostname.endsWith(".github.io");
}

function sanitizeInsightHtml(editor: HTMLElement) {
  const output = document.createElement("div");
  const appendNode = (node: Node, parent: HTMLElement) => {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.append(document.createTextNode(node.textContent ?? ""));
      return;
    }
    if (!(node instanceof HTMLElement)) return;
    if (node.tagName === "BR") {
      parent.append(document.createElement("br"));
      return;
    }
    if (node.tagName === "STRONG" || node.tagName === "B") {
      const strong = document.createElement("strong");
      node.childNodes.forEach((child) => appendNode(child, strong));
      parent.append(strong);
      return;
    }
    node.childNodes.forEach((child) => appendNode(child, parent));
  };

  editor.childNodes.forEach((node) => appendNode(node, output));
  return output.innerHTML;
}

function HighlightedText({ text, highlights }: { text: string; highlights: readonly string[] }) {
  const parts = highlights.reduce<(string | { value: string; key: string })[]>((current, highlight) => {
    return current.flatMap((part) => {
      if (typeof part !== "string") return [part];
      return part.split(highlight).flatMap((segment, index, values) =>
        index < values.length - 1 ? [segment, { value: highlight, key: `${highlight}-${index}` }] : [segment],
      );
    });
  }, [text]);

  return parts.map((part, index) =>
    typeof part === "string" ? part : <strong className={/(增长|增加|增至|\+\d)/.test(part.value) ? "positive" : undefined} key={`${part.key}-${index}`}>{part.value}</strong>,
  );
}

export function EditableInsight({
  lead,
  body,
  highlights,
  storageKey = "ogv-market-review:26q2:platform-insight",
  contentKey,
}: {
  lead: string;
  body: string;
  highlights: readonly string[];
  storageKey?: string;
  contentKey?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // The published report must always reflect the versioned repository source.
    // Keep browser-only drafts for local/Codex previews, where they can be edited
    // without stale values overriding a later GitHub deployment.
    if (isPublishedGitHubPage() || window.location.pathname.startsWith("/ogv/")) return;
    const saved = window.localStorage.getItem(storageKey);
    if (!saved || !editorRef.current) return;
    if (saved.startsWith(htmlStoragePrefix)) {
      const parsed = new DOMParser().parseFromString(saved.slice(htmlStoragePrefix.length), "text/html");
      editorRef.current.innerHTML = sanitizeInsightHtml(parsed.body);
    } else {
      editorRef.current.textContent = saved;
    }
  }, [storageKey]);

  const save = (editor: HTMLElement) => {
    if (isPublishedGitHubPage() || window.location.pathname.startsWith("/ogv/")) return;
    window.localStorage.setItem(storageKey, `${htmlStoragePrefix}${sanitizeInsightHtml(editor)}`);
  };

  return (
    <div className="audience-insight">
      <div
        ref={editorRef}
        className="insight-editor"
        data-content-key={contentKey ?? storageKey?.replace(/:\d{2}q[1-4]:/i, ":26q2:")}
        contentEditable
        suppressContentEditableWarning
        aria-label="平台洞察，点击后可直接编辑"
        onInput={(event) => save(event.currentTarget)}
        onBlur={(event) => save(event.currentTarget)}
      >
        <b>{lead}：</b>
        <HighlightedText text={body} highlights={highlights} />
      </div>
    </div>
  );
}
