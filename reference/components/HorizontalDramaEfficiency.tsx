"use client";

import * as echarts from "echarts";
import { useEffect, useMemo, useRef } from "react";
import { EditableInsight } from "./EditableInsight";
import fallbackData from "../data/horizontalDramaTrend.json";
import { usePublishedDrama } from "./usePublishedCategoryReports";
import { setBracketAnnotations } from "./chartBrackets";
import { LongDramaTopSeries } from "./HorizontalDramaTopSeries";
import { getChartLayout, resizeResponsiveChart } from "./chartResponsive";

type QuarterFilter = "Q1" | "Q2" | "Q3" | "Q4" | "all";
let data: any = fallbackData;
type EfficiencyKey = "episodes" | "v30";
const colors = { "TOP10": "#385577", "11–50": "#b9c5d7" };

function filterIndexes(periods: string[], filter: QuarterFilter) {
  return periods.map((period, index) => ({ period, index })).filter(({ period }) => Number(period.slice(0, 2)) >= 22 && (filter === "all" || period.endsWith(filter)));
}

function yoy(current: number, previous: number) { return previous ? (current / previous - 1) * 100 : 0; }
function pct(value: number) { return `${value > 0 ? "+" : ""}${value.toFixed(0)}%`; }

function ConcentrationChart({ filter }: { filter: QuarterFilter }) {
  const ref = useRef<HTMLDivElement>(null);
  const model = useMemo(() => {
    const indexes = filterIndexes(data.efficiency.periods, filter);
    return { periods: indexes.map((x) => x.period), series: data.efficiency.concentration.series.map((s) => ({ ...s, values: indexes.map((x) => s.values[x.index]) })), totals: indexes.map((x) => data.efficiency.concentration.totals[x.index]) };
  }, [filter]);
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" }); const n = model.periods.length; const compare = filter !== "all" && n > 1;
    const layoutSpec = { left: 46, right: 146, top: 54, bottom: 34, variant: "right-legend" as const, minRight: 146 };
    chart.setOption({ animationDuration: 420, grid: getChartLayout(ref.current.clientWidth, layoutSpec).grid, tooltip: { show: false },
      legend: { show: false },
      xAxis: { type: "category", data: model.periods, axisTick: { show: false }, axisLabel: { interval: filter === "all" ? 3 : 0, fontSize: 10 }, axisLine: { lineStyle: { color: "#aeb7b0" } } },
      yAxis: { type: "value", axisLabel: { fontSize: 10, color: "#737c76" }, splitLine: { lineStyle: { color: "#e4e7e4" } } },
      series: [
        ...model.series.map((s) => ({ name: s.name, type: "bar", stack: "total", data: s.values, barMaxWidth: 36, itemStyle: { color: colors[s.name as keyof typeof colors] }, label: { show: true, position: "inside", color: s.name === "TOP10" ? "#fff" : "#263038", fontSize: 9, formatter: ({ value, dataIndex }: { value: number; dataIndex: number }) => `${value.toFixed(0)}\n(${(value / model.totals[dataIndex] * 100).toFixed(0)}%)` } })),
        { name: "柱顶合计", type: "bar", data: model.totals, barGap: "-100%", barMaxWidth: 36, silent: true, z: 20, itemStyle: { color: "rgba(0,0,0,0)" }, label: { show: true, position: "top", distance: 8, fontWeight: 700, formatter: ({ value }: { value: number }) => value.toFixed(0) } },
      ] });
    ref.current.dataset.ogvRenderedPeriod = model.periods.at(-1) ?? "";
    const draw = () => {
      if (!compare) return setBracketAnnotations(chart, []);
      const bottom = model.series.find((s) => s.name === "11–50")!;
      const top = model.series.find((s) => s.name === "TOP10")!;
      setBracketAnnotations(chart, [
        { previousIndex: n-2, currentIndex: n-1, previousValue: model.totals[n-2], currentValue: model.totals[n-1], label: pct(yoy(model.totals[n-1], model.totals[n-2])), level: 2, targetGap: 24, labelFontSize: 8 },
        { previousIndex: n-2, currentIndex: n-1, previousValue: 0, currentValue: Number(bottom.values[n-1]) / 2, label: `同比 ${pct(yoy(Number(bottom.values[n-1]), Number(bottom.values[n-2])))}`, title: "11–50", variant: "sideLabel", labelFontSize: 8, swatchColor: colors["11–50"] },
        { previousIndex: n-2, currentIndex: n-1, previousValue: 0, currentValue: Number(bottom.values[n-1]) + Number(top.values[n-1]) / 2, label: `同比 ${pct(yoy(Number(top.values[n-1]), Number(top.values[n-2])))}`, title: "TOP10", variant: "sideLabel", labelFontSize: 8, swatchColor: colors.TOP10 },
      ]);
    };
    requestAnimationFrame(draw);
    const ro = new ResizeObserver(() => ref.current && resizeResponsiveChart(chart, ref.current, layoutSpec, () => requestAnimationFrame(draw))); ro.observe(ref.current); return () => { ro.disconnect(); chart.dispose(); };
  }, [filter, model]);
  return <div ref={ref} className="efficiency-chart efficiency-chart-large" role="img" aria-label="TOP50上新长剧播放集中度" />;
}

function SplitMetricChart({ metric, filter }: { metric: EfficiencyKey; filter: QuarterFilter }) {
  const ref = useRef<HTMLDivElement>(null); const source = data.efficiency[metric];
  const model = useMemo(() => { const idx = filterIndexes(data.efficiency.periods, filter); return { periods: idx.map((x) => x.period), series: source.series.map((s) => ({ ...s, values: idx.map((x) => s.values[x.index]) })) }; }, [filter, source]);
  useEffect(() => { if (!ref.current) return; const chart = echarts.init(ref.current, undefined, { renderer: "svg" }); const n = model.periods.length;
    chart.setOption({ animationDuration: 420, title: model.series.map((s, i) => ({ text: s.name, left: i === 0 ? "24%" : "73%", top: 2, textAlign: "center", textStyle: { color: "#33403a", fontSize: 10, fontWeight: 650 } })), grid: [{ left: 36, right: "54%", top: 52, bottom: 30 }, { left: "55%", right: 14, top: 52, bottom: 30 }], tooltip: { show: false },
      xAxis: model.series.map((_, i) => ({ type: "category", gridIndex: i, data: model.periods, axisTick: { show: false }, axisLabel: { interval: filter === "all" ? 3 : 0, fontSize: 8 }, axisLine: { lineStyle: { color: "#aeb7b0" } } })), yAxis: model.series.map((_, i) => ({ type: "value", gridIndex: i, axisLabel: { fontSize: 8, color: "#737c76" }, splitLine: { lineStyle: { color: "#e4e7e4" } } })),
      series: model.series.map((s, i) => ({ name: s.name, type: "bar", xAxisIndex: i, yAxisIndex: i, data: s.values, barMaxWidth: 24, itemStyle: { color: colors[s.name as keyof typeof colors] }, label: { show: true, position: "top", fontSize: 8, formatter: ({ value }: { value: number }) => metric === "episodes" ? value.toFixed(0) : value.toLocaleString(undefined, { maximumFractionDigits: 0 }) } })) });
    ref.current.dataset.ogvRenderedPeriod = model.periods.at(-1) ?? "";
    const draw = () => setBracketAnnotations(chart, filter !== "all" && n > 1 ? model.series.map((s, i) => ({ previousIndex: n-2, currentIndex: n-1, previousValue: Number(s.values[n-2]), currentValue: Number(s.values[n-1]), label: pct(yoy(Number(s.values[n-1]), Number(s.values[n-2]))), xAxisIndex: i, yAxisIndex: i, targetGap: 10, labelFontSize: 7 })) : []);
    requestAnimationFrame(draw);
    const ro = new ResizeObserver(() => { chart.resize(); requestAnimationFrame(draw); }); ro.observe(ref.current); return () => { ro.disconnect(); chart.dispose(); };
  }, [filter, metric, model]);
  return <div ref={ref} className="efficiency-chart" role="img" aria-label={metric === "episodes" ? "TOP50上新长剧平均集数" : "TOP50上新长剧集均V30"} />;
}

function HorizontalDramaEfficiencyContent({ filter }: { filter: QuarterFilter }) {
  return <section className="horizontal-drama-efficiency"><div className="horizontal-drama-lead"><div className="horizontal-drama-subhead"><span>02</span><h4>热播横屏长剧下拆</h4></div>
    <EditableInsight lead="用户继续流失" body="26Q2 热播剧播放 152 亿（-15%），TOP10 长剧集均 V30 下降 20%。" highlights={["152 亿", "-15%", "下降 20%"]} storageKey="ogv-market-review:26q2:horizontal-drama-efficiency" /></div>
    <div className="efficiency-layout"><article className="horizontal-drama-panel efficiency-primary"><header><h5>TOP50 上新长剧播放结构（亿）</h5></header><ConcentrationChart filter={filter} /></article><div className="efficiency-side"><article className="horizontal-drama-panel"><header><h5>平均集数｜TOP10 / 11–50</h5></header><SplitMetricChart metric="episodes" filter={filter} /></article><article className="horizontal-drama-panel"><header><h5>集均 V30｜TOP10 / 11–50（万）</h5></header><SplitMetricChart metric="v30" filter={filter} /></article></div></div>
    <LongDramaTopSeries filter={filter} />
  </section>;
}

export function HorizontalDramaEfficiency({ filter }: { filter: QuarterFilter }) {
  data = usePublishedDrama(fallbackData);
  return <HorizontalDramaEfficiencyContent key={JSON.stringify(data)} filter={filter} />;
}
