"use client";

import * as echarts from "echarts";
import { useEffect, useMemo, useRef } from "react";
import fallbackData from "../data/shortDramaRevenue.json";
import { setBracketAnnotations, type BracketComparison } from "./chartBrackets";
import { getChartLayout, resizeResponsiveChart } from "./chartResponsive";
import { usePublishedShortDramaRevenue } from "./usePublishedRevenueData";

type Row = { period: string; [key: string]: string | number | null };
export type QuarterFilter = "Q1" | "Q2" | "Q3" | "Q4" | "all";

const colors: Record<string, string> = {
  抖音: "#385577",
  红果: "#d95b54",
  其他平台: "#c7d1dd",
  其他: "#c7d1dd",
};

const pct = (current: number, previous: number) => previous ? `${current >= previous ? "+" : ""}${((current / previous - 1) * 100).toFixed(0)}%` : "–";
const total = (row: Row, keys: string[]) => keys.reduce((sum, key) => sum + Number(row[key] || 0), 0);

function RevenueChart({ rows, keys, compact = false, annual = false, showPlatformYoy = false, ariaLabel }: { rows: Row[]; keys: string[]; compact?: boolean; annual?: boolean; showPlatformYoy?: boolean; ariaLabel: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" });
    const layoutSpec = { left: compact ? 34 : 38, right: compact ? 86 : showPlatformYoy ? 104 : 20, top: compact ? 58 : 78, bottom: 28, variant: compact || showPlatformYoy ? "right-legend" as const : "plain" as const, minRight: compact ? 86 : showPlatformYoy ? 104 : 20 };
    const totals = rows.map((row) => total(row, keys));
    chart.setOption({
      animationDuration: 420,
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (value: number) => `${Number(value).toFixed(1)} 亿` },
      grid: getChartLayout(ref.current.clientWidth, layoutSpec).grid,
      xAxis: { type: "category", data: rows.map((row) => row.period), axisTick: { show: false }, axisLine: { lineStyle: { color: "#aeb7b0" } }, axisLabel: { color: "#59625c", fontSize: compact ? 9 : 10, interval: 0 } },
      yAxis: { type: "value", name: "亿", nameTextStyle: { color: "#737c76", fontSize: 9 }, axisLabel: { color: "#737c76", fontSize: 9 }, splitLine: { lineStyle: { color: "#e5e8e4" } } },
      series: [
        ...keys.map((key) => ({ name: key, type: "bar", stack: "revenue", data: rows.map((row) => Number(row[key] || 0)), barWidth: compact ? "38%" : "36%", itemStyle: { color: colors[key] }, label: { show: true, position: "inside", color: key === "其他" || key === "其他平台" ? "#263038" : "#fff", fontSize: compact ? 8 : 9, formatter: ({ value }: { value: number }) => value >= (compact ? 8 : 5) ? value.toFixed(0) : "" } })),
        { name: "合计", type: "bar", data: totals, barGap: "-100%", barWidth: compact ? "38%" : "36%", silent: true, z: 20, itemStyle: { color: "transparent" }, label: { show: true, position: "top", distance: 5, color: "#1e2521", fontSize: compact ? 9 : 10, fontWeight: 700, formatter: ({ value }: { value: number }) => value.toFixed(0) } },
      ],
    });
    const drawComparisons = () => {
      const comparisons: BracketComparison[] = [];
      if (annual && totals.length > 1) {
        comparisons.push({ previousIndex: totals.length - 2, currentIndex: totals.length - 1, previousValue: totals[totals.length - 2], currentValue: totals[totals.length - 1], label: pct(totals[totals.length - 1], totals[totals.length - 2]), targetGap: 28, labelFontSize: 8 });
      }
      if (showPlatformYoy && rows.length > 1) {
        const currentIndex = rows.length - 1;
        const currentPeriod = rows[currentIndex].period;
        const priorPeriod = `${Number(currentPeriod.slice(0, 2)) - 1}${currentPeriod.slice(2)}`;
        const previousIndex = Math.max(0, rows.findIndex((row) => row.period === priorPeriod));
        [...keys].reverse().forEach((key, keyIndex) => {
          const currentValue = Number(rows[currentIndex][key] || 0);
          const previousValue = Number(rows[previousIndex][key] || 0);
          comparisons.push({
            previousIndex,
            currentIndex,
            previousValue: currentValue,
            currentValue,
            title: key,
            label: `同比 ${pct(currentValue, previousValue)}`,
            variant: "sideLabel",
            swatchColor: colors[key],
            labelFontSize: 8,
            labelY: 90 + keyIndex * 52,
            xOffset: 12,
          });
        });
      }
      if (compact && totals.length > 1) {
        const currentIndex = totals.length - 1;
        const previousQuarterIndex = currentIndex - 1;
        comparisons.push({ previousIndex: previousQuarterIndex, currentIndex, previousValue: totals[previousQuarterIndex], currentValue: totals[currentIndex], label: pct(totals[currentIndex], totals[previousQuarterIndex]), targetGap: 26, labelFontSize: 8 });
        let cumulative = 0;
        [...keys].reverse().forEach((key, keyIndex) => {
          const currentValue = Number(rows[currentIndex][key] || 0);
          comparisons.push({
            previousIndex: previousQuarterIndex,
            currentIndex,
            previousValue: 0,
            currentValue: cumulative + currentValue / 2,
            title: key,
            label: `环比 ${pct(currentValue, Number(rows[previousQuarterIndex][key] || 0))}`,
            variant: "sideLabel",
            swatchColor: colors[key],
            labelFontSize: 8,
            labelY: 82 + keyIndex * 44,
            xOffset: 12,
          });
          cumulative += currentValue;
        });
      }
      setBracketAnnotations(chart, comparisons);
    };
    requestAnimationFrame(drawComparisons);
    const resize = new ResizeObserver(() => ref.current && resizeResponsiveChart(chart, ref.current, layoutSpec, () => requestAnimationFrame(drawComparisons)));
    resize.observe(ref.current);
    return () => { resize.disconnect(); chart.dispose(); };
  }, [annual, compact, keys, rows, showPlatformYoy]);
  return <div ref={ref} className={compact ? "short-revenue-chart compact" : "short-revenue-chart"} role="img" aria-label={ariaLabel} />;
}

function LeftRevenueChart({ filter, data }: { filter: QuarterFilter; data: ReturnType<typeof usePublishedShortDramaRevenue> }) {
  const iap = useMemo(() => (data.iap as Row[]).filter((row) => filter === "all" || row.period.endsWith(filter)), [filter]);
  const iaa = useMemo(() => (data.iaa as Row[]).filter((row) => filter === "all" || row.period.endsWith(filter)), [filter]);
  return <div className="short-revenue-left-plots">
    <div><h6>IAP 付费短剧 C 端付费规模</h6><RevenueChart rows={iap} keys={["抖音", "其他平台"]} annual={filter !== "all"} showPlatformYoy ariaLabel="IAP付费短剧平台收入" /></div>
    <div><h6>IAA 免费短剧平台广告收入</h6><RevenueChart rows={iaa} keys={["抖音", "红果", "其他平台"]} annual={filter !== "all"} showPlatformYoy ariaLabel="IAA免费短剧平台广告收入" /></div>
  </div>;
}

export function ShortDramaPlatformRevenueCharts({ filter }: { filter: QuarterFilter }) {
  const data = usePublishedShortDramaRevenue(fallbackData);
  return <article className="short-revenue-module short-platform-revenue-module">
    <section className="short-revenue-card short-revenue-primary">
      <header><h3>短剧平台 IAA &amp; IAP 收入（亿元）</h3></header>
      <LeftRevenueChart filter={filter} data={data} />
    </section>
    <p className="short-revenue-source">数据来源：{data.source}。平台收入为按平台收到用户／广告主收入估算，不代表短剧公司投流规模。</p>
  </article>;
}

export function LiveAiRevenueCharts() {
  const data = usePublishedShortDramaRevenue(fallbackData);
  const liveAction = (data.liveAction as Row[]).filter((row) => row.period >= "25Q1");
  const ai = (data.ai as Row[]).filter((row) => row.period >= "25Q1");
  return <article className="short-revenue-module live-ai-revenue-module">
    <div className="short-revenue-side">
      <section className="short-revenue-card"><header><h3>真人短剧收入（亿元）</h3></header><RevenueChart rows={liveAction} keys={["抖音", "红果", "其他"]} compact ariaLabel="真人短剧收入趋势" /></section>
      <section className="short-revenue-card"><header><h3>AI 短剧收入（亿元）</h3></header><RevenueChart rows={ai} keys={["抖音", "红果", "其他"]} compact ariaLabel="AI短剧收入趋势" /></section>
    </div>
    <p className="short-revenue-source">数据来源：{data.source}</p>
  </article>;
}
