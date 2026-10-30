"use client";

import { useEffect, useState, type ReactNode } from "react";

/** Temporary report omissions follow the report edition, not chart filters. */
export function HideIn26Q3({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setVisible(params.has("preview") || params.get("conclusion") !== "26Q3");
  }, []);
  return visible ? <>{children}</> : null;
}
