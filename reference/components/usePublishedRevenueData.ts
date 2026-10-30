"use client";

import { useEffect, useMemo, useState } from "react";

type Row = Record<string, string | number | null>;
type Dataset = { key: string; rows: Row[] };
type CategoryPayload = { datasets?: Dataset[] };

export type LongVideoRevenueData = {
  source: string;
  membership: Row[];
  advertising: Row[];
  members: Row[];
  arppu: Row[];
};

export type ShortDramaRevenueData = {
  source: string;
  iap: Row[];
  iaa: Row[];
  liveAction: Row[];
  ai: Row[];
};

function useCategoryPayload(categoryKey: string) {
  const [payload, setPayload] = useState<CategoryPayload | null>(null);
  useEffect(() => {
    const previewCategory = new URLSearchParams(window.location.search).get("preview");
    const endpoint = previewCategory === categoryKey
      ? `/ogv/api/admin/preview/${categoryKey}`
      : `/ogv/api/public/categories/${categoryKey}`;
    fetch(endpoint, { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => data && setPayload(data))
      .catch(() => undefined);
  }, [categoryKey]);
  return payload;
}

const normalizeQuarter = (value: unknown) => String(value ?? "").toUpperCase().replace(/^20(?=\d{2}Q)/, "");
const numberOrNull = (value: unknown, divisor = 1) => value == null || value === "" ? null : Number(value) / divisor;

function indexed(payload: CategoryPayload | null) {
  return new Map((payload?.datasets ?? []).map((dataset) => [dataset.key, dataset.rows]));
}

export function usePublishedLongVideoRevenue(fallback: LongVideoRevenueData) {
  const payload = useCategoryPayload("revenue");
  return useMemo<LongVideoRevenueData>(() => {
    const datasets = indexed(payload);
    const membership = datasets.get("revenue_1_1");
    const advertising = datasets.get("revenue_1_2");
    const members = datasets.get("revenue_1");
    const arppu = datasets.get("revenue_3___arppu");
    if (!membership || !advertising || !members || !arppu) return fallback;
    return {
      ...fallback,
      membership: membership.map((row) => ({ period: normalizeQuarter(row["会员收入"]), 爱奇艺: numberOrNull(row["爱奇艺"], 100), 腾讯视频: numberOrNull(row["腾讯"], 100), 芒果TV: numberOrNull(row["芒果"], 100), 优酷视频: numberOrNull(row["优酷"], 100) })),
      advertising: advertising.map((row) => ({ period: `${String(row["列1"] ?? "").slice(-2)}${row["列2"] ?? ""}`, 爱奇艺: numberOrNull(row["爱奇艺"]), 腾讯视频: numberOrNull(row["腾讯视频"]), 芒果TV: numberOrNull(row["芒果TV"]), 优酷视频: numberOrNull(row["优酷"]) })),
      members: members.map((row) => ({ period: normalizeQuarter(row["列1"]), 爱奇艺: numberOrNull(row["爱奇艺"], 100), 腾讯视频: numberOrNull(row["腾讯"], 100), 芒果TV: numberOrNull(row["芒果"], 100), 优酷视频: numberOrNull(row["优酷"], 100) })),
      arppu: arppu.map((row) => ({ period: normalizeQuarter(row["ARPPU 元 - 每月"]), 爱奇艺: numberOrNull(row["爱奇艺"]), 腾讯视频: numberOrNull(row["腾讯"]), 芒果TV: numberOrNull(row["芒果"]), 优酷视频: numberOrNull(row["优酷"]) })),
    };
  }, [fallback, payload]);
}

export function usePublishedShortDramaRevenue(fallback: ShortDramaRevenueData) {
  const payload = useCategoryPayload("short_drama");
  return useMemo<ShortDramaRevenueData>(() => {
    const datasets = indexed(payload);
    const iap = datasets.get("short_drama_1_1___iap");
    const iaa = datasets.get("short_drama_1_2___iaa");
    const liveAction = datasets.get("short_drama_2");
    const ai = datasets.get("short_drama_2___ai");
    if (!iap || !iaa || !liveAction || !ai) return fallback;
    return {
      ...fallback,
      iap: iap.map((row) => ({ period: normalizeQuarter(row["quarter"]), 抖音: numberOrNull(row["抖音"]), 其他平台: numberOrNull(row["其他平台"]) })),
      iaa: iaa.map((row) => ({ period: normalizeQuarter(row["quarter"]), 抖音: numberOrNull(row["抖音"]), 红果: numberOrNull(row["红果"]), 其他平台: numberOrNull(row["其他平台"]) })),
      liveAction: liveAction.map((row) => ({ period: normalizeQuarter(row["真人短剧"]), 抖音: numberOrNull(row["抖音"]), 红果: numberOrNull(row["红果"]), 其他: numberOrNull(row["其他"]), 整体: numberOrNull(row["整体"]) })),
      ai: ai.map((row) => ({ period: normalizeQuarter(row["AI短剧"]), 抖音: numberOrNull(row["抖音"]), 红果: numberOrNull(row["红果"]), 其他: numberOrNull(row["其他"]), 整体: numberOrNull(row["整体"]) })),
    };
  }, [fallback, payload]);
}
