"use client";

import { useEffect, useMemo, useState } from "react";

type TrendData = {
  metric: string;
  unit: string;
  source: string;
  periods: string[];
  series: { name: string; values: (number | null)[] }[];
};

type Dataset = { key: string; rows: Record<string, unknown>[] };
type CategoryPayload = { datasets?: Dataset[] };

function usePlatformPayload() {
  const [payload, setPayload] = useState<CategoryPayload | null>(null);
  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get("preview") === "platform";
    const endpoint = preview ? "/ogv/api/admin/preview/platform" : "/ogv/api/public/categories/platform";
    fetch(endpoint, { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => data && setPayload(data))
      .catch(() => undefined);
  }, []);
  return payload;
}

export function usePlatformTrend(datasetKey: string, fallback: TrendData, divisor = 1) {
  const payload = usePlatformPayload();
  return useMemo(() => {
    const dataset = payload?.datasets?.find((item) => item.key === datasetKey);
    if (!dataset?.rows?.length) return fallback;
    const periodField = dataset.rows.some((row) => row["月份"] != null) ? "月份" : "日期";
    const normalizedPeriod = (row: Record<string, unknown>) => String(row[periodField] ?? "").slice(0, 7);
    const periods = [...new Set(dataset.rows.map(normalizedPeriod).filter(Boolean))].sort();
    const names = [...new Set(dataset.rows.map((row) => String(row["系列"] ?? "")).filter(Boolean))];
    const values = new Map(dataset.rows.map((row) => [`${normalizedPeriod(row)}\u0000${row["系列"]}`, Number(row["数值"])]));
    return {
      ...fallback,
      periods,
      series: names.map((name) => ({ name, values: periods.map((period) => {
        const value = values.get(`${period}\u0000${name}`);
        return value == null || !Number.isFinite(value) ? null : value / divisor;
      }) })),
    };
  }, [datasetKey, divisor, fallback, payload]);
}

const durationNames: Record<string, string> = {
  "长视频平台汇总": "其他长视频平台",
  "短剧平台汇总": "其他短剧平台",
};

function quarterOf(month: string) {
  const [year, value] = month.split("-").map(Number);
  return `${String(year).slice(2)}Q${Math.floor((value - 1) / 3) + 1}`;
}

export function usePlatformDuration(fallback: TrendData) {
  const payload = usePlatformPayload();
  return useMemo(() => {
    const dataset = payload?.datasets?.find((item) => item.key === "platform_platform_audience");
    if (!dataset?.rows?.length) return fallback;
    const periods = [...new Set(dataset.rows.map((row) => quarterOf(String(row["月份"]))))].sort();
    const rawNames = [...new Set(dataset.rows.map((row) => String(row["系列"] ?? "")).filter(Boolean))];
    const totals = new Map<string, number>();
    const monthlyRows = new Map(dataset.rows.map(row => [`${row["月份"]}\u0000${row["系列"]}`, row]));
    monthlyRows.forEach((row) => {
      const name = durationNames[String(row["系列"])] ?? String(row["系列"]);
      const key = `${quarterOf(String(row["月份"]))}\u0000${name}`;
      totals.set(key, (totals.get(key) ?? 0) + Number(row["数值"] ?? 0) / 600000);
    });
    const names = rawNames.map((name) => durationNames[name] ?? name);
    return { ...fallback, periods, series: names.map((name) => ({ name, values: periods.map((period) => totals.get(`${period}\u0000${name}`) ?? null) })) };
  }, [fallback, payload]);
}
