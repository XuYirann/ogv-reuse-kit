"use client";

import { useEffect } from "react";

export default function EditorBootstrap() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("preview")) return;
    if (document.getElementById("ogv-editor-script")) return;
    const script = document.createElement("script");
    script.id = "ogv-editor-script";
    script.src = "/ogv/editor.js";
    document.body.appendChild(script);
  }, []);
  return null;
}
