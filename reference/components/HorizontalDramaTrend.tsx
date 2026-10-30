"use client";

import * as echarts from "echarts";
import { useEffect, useMemo, useRef, useState } from "react";
import { EditableInsight } from "./EditableInsight";
import fallbackData from "../data/horizontalDramaTrend.json";
import { usePublishedDrama } from "./usePublishedCategoryReports";
import { HorizontalDramaEfficiency } from "./HorizontalDramaEfficiency";
import { type BracketComparison, setBracketAnnotations } from "./chartBrackets";
import { HorizontalShortDramaTrend } from "./HorizontalShortDramaTrend";
import { getChartLayout, resizeResponsiveChart } from "./chartResponsive";

const colors: Record<string, string> = {
  其他: "#d9dfe8", "热播剧 TOP50": "#385577",
  爱奇艺: "#C0D688", 腾讯视频: "#A9BACF", 优酷: "#89D8F0", 芒果TV: "#EDB795", 其他: "#b7beb8",
};
const displayName = (name: string) => name === "热播剧 TOP50" ? "上新热播剧" : name === "其他" ? "上新其他剧" : name;

function yoy(values: (number | null)[]) {
  const current = values.at(-1);
  const previous = values.at(-5);
  if (current == null || previous == null || previous === 0) return null;
  return (current / previous - 1) * 100;
}

type QuarterFilter = "Q1" | "Q2" | "Q3" | "Q4" | "all";
let data: any = fallbackData;

function StackedChart({ kind, quarterFilter }: { kind: "total" | "platform"; quarterFilter: QuarterFilter }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const source = data[kind];
  const { periods, series } = useMemo(() => {
    const indexes = source.periods
      .map((period, index) => ({ period, index }))
      .filter(({ period }) => Number(period.slice(0, 2)) >= 22 && (quarterFilter === "all" || period.endsWith(quarterFilter)));
    let displaySeries = source.series.map((item) => ({ ...item }));
    if (kind === "total") displaySeries = [displaySeries[1], displaySeries[0]];
    return {
      periods: indexes.map(({ period }) => period),
      series: displaySeries.map((item) => ({ ...item, values: indexes.map(({ index }) => item.values[index]) })),
    };
  }, [quarterFilter, source]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, undefined, { renderer: "svg" });
    const layoutSpec = { left: 48, right: kind === "total" ? 102 : 152, top: 62, bottom: 68, variant: kind === "total" ? "plain" as const : "wide-right-legend" as const, minRight: kind === "total" ? 102 : 152 };
    const totals = periods.map((_, index) => series.reduce((sum, item) => sum + Number(item.values[index] ?? 0), 0));
    const latestYoy = totals.length > 1 && totals.at(-2) ? (totals.at(-1)! / totals.at(-2)! - 1) * 100 : null;
    const baseValues = series[0]?.values ?? [];
    const baseYoy = baseValues.length > 1 && baseValues.at(-2) ? (Number(baseValues.at(-1)) / Number(baseValues.at(-2)) - 1) * 100 : null;
    const yoyText = (value: number | null) => value == null ? "" : `${value > 0 ? "+" : ""}${value.toFixed(0)}%`;
    const latestIndex = periods.length - 1;
    const previousIndex = periods.length - 2;
    const showComparison = quarterFilter !== "all" && periods.length >= 2;
    chart.setOption({
      animationDuration: 420,
      color: series.map((item) => colors[item.name]),
      grid: getChartLayout(chartRef.current.clientWidth, layoutSpec).grid,
      tooltip: { show: false },
      legend: { show: kind === "total", bottom: 12, data: [...series].reverse().map((item) => displayName(item.name)), itemWidth: 10, itemHeight: 10, textStyle: { color: "#58615b", fontSize: 12 } },
      xAxis: { type: "category", data: periods, axisTick: { show: false }, axisLine: { lineStyle: { color: "#aeb7b0" } }, axisLabel: { color: "#737c76", fontSize: 10, interval: quarterFilter === "all" ? 3 : 0 } },
      yAxis: { type: "value", axisLabel: { color: "#737c76", fontSize: 10 }, splitLine: { lineStyle: { color: "#e4e7e4" } } },
      series: [
        ...series.map((item) => ({
        name: displayName(item.name), type: "bar" as const, stack: "total", data: item.values, barMaxWidth: 36,
        emphasis: { focus: "series" },
        label: {
          show: true,
          position: "inside" as const,
          color: item.name === "其他" || kind === "platform" ? "#263038" : "#ffffff",
          fontSize: quarterFilter === "all" ? 8 : 10,
          formatter: ({ value, dataIndex }: { value: number | null; dataIndex: number }) => {
            if (value == null || Math.abs(value) < .5) return "";
            if (kind === "platform" && item.name === "芒果TV") return "";
            const share = totals[dataIndex] ? Number(value) / totals[dataIndex] * 100 : 0;
            return kind === "total" ? Number(value).toFixed(0) : `${Number(value).toFixed(0)}\n(${share.toFixed(0)}%)`;
          },
        },
      })),
        {
          name: "柱顶合计", type: "bar" as const, data: totals, barMaxWidth: 36, barGap: "-100%", silent: true, z: 20,
          itemStyle: { color: "rgba(0,0,0,0)" },
          emphasis: { disabled: true },
          label: { show: true, position: "top" as const, distance: 8, color: "#161917", fontSize: 12, fontWeight: 700, formatter: ({ value }: { value: number }) => Number(value).toFixed(0) },
        },
      ],
    });
    chartRef.current.dataset.ogvRenderedPeriod = periods.at(-1) ?? "";
    const drawAnnotations = () => {
      if (!showComparison) return setBracketAnnotations(chart, []);
      const comparisons: BracketComparison[] = [];
      if (kind === "total") {
        comparisons.push(
          { previousIndex, currentIndex: latestIndex, previousValue: totals[previousIndex], currentValue: totals[latestIndex], label: yoyText(latestYoy), level: 1, targetGap: 28, labelFontSize: 8 },
          { previousIndex, currentIndex: latestIndex, previousValue: Number(baseValues[previousIndex]), currentValue: Number(baseValues[latestIndex]), label: yoyText(baseYoy), level: 0, targetGap: 0, variant: "difference", labelFontSize: 8 },
        );
      } else {
        const legendOrder = ["芒果TV", "优酷", "腾讯视频", "爱奇艺"];
        const legendRows = [92, 157, 232, 307];
        legendOrder.forEach((name, legendIndex) => {
          const item = series.find((entry) => entry.name === name);
          if (!item) return;
          const seriesIndex = series.findIndex((entry) => entry.name === name);
          const current = Number(item.values[latestIndex] ?? 0);
          const previous = Number(item.values[previousIndex] ?? 0);
          const lower = series.slice(0, seriesIndex).reduce((sum, entry) => sum + Number(entry.values[latestIndex] ?? 0), 0);
          const center = lower + current / 2;
          comparisons.push({
            previousIndex,
            currentIndex: latestIndex,
            previousValue: center,
            currentValue: center,
            label: `同比 ${yoyText(previous ? (current / previous - 1) * 100 : null)}`,
            variant: "sideLabel",
            title: name,
            swatchColor: colors[name],
            labelFontSize: 8,
            labelY: legendRows[legendIndex],
          });
        });
        periods.forEach((_, dataIndex) => {
          const mango = series.find((entry) => entry.name === "芒果TV");
          if (!mango) return;
          const value = Number(mango.values[dataIndex] ?? 0);
          if (value < .5) return;
          const mangoIndex = series.findIndex((entry) => entry.name === "芒果TV");
          const lower = series.slice(0, mangoIndex).reduce((sum, entry) => sum + Number(entry.values[dataIndex] ?? 0), 0);
          const center = lower + value / 2;
          const share = totals[dataIndex] ? value / totals[dataIndex] * 100 : 0;
          comparisons.push({
            previousIndex: dataIndex,
            currentIndex: dataIndex,
            previousValue: center,
            currentValue: center,
            label: `${value.toFixed(0)}\n(${share.toFixed(0)}%)`,
            variant: "barCallout",
            color: colors.芒果TV,
            labelFontSize: quarterFilter === "all" ? 7 : 8,
            labelYShift: 0,
            arrowOffset: 25,
          });
        });
      }
      setBracketAnnotations(chart, comparisons);
    };
    requestAnimationFrame(drawAnnotations);
    const observer = new ResizeObserver(() => chartRef.current && resizeResponsiveChart(chart, chartRef.current, layoutSpec, () => requestAnimationFrame(drawAnnotations)));
    observer.observe(chartRef.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [periods, series]);

  return <div ref={chartRef} className="horizontal-drama-chart" role="img" aria-label={kind === "total" ? "季度长剧有效播放" : "分平台TOP50上新长剧播放"} />;
}

function HorizontalDramaTrendContent() {
  const [quarterFilter, setQuarterFilter] = useState<QuarterFilter>((data.total.periods.at(-1)?.slice(-2) as QuarterFilter) || "Q2");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search), period = params.get("conclusion");
    if (!params.has("preview") && period && /^\d{2}Q[1-4]$/.test(period)) setQuarterFilter(period.slice(-2) as QuarterFilter);
  }, []);
  const totalYoy = yoy(data.total.totals);
  const newYoy = yoy(data.total.series.find((item) => item.name === "热播剧 TOP50")!.values);
  const platformYoys = Object.fromEntries(data.platform.series.map((item) => [item.name, yoy(item.values)]));
  const pct = (value: number | null) => `${value != null && value > 0 ? "+" : ""}${value?.toFixed(0)}%`;
  const body = `26Q2 长剧有效播放 411 亿，同比 ${pct(totalYoy)}；其中热播剧 TOP50 播放 152 亿，同比 ${pct(newYoy)}。分平台 TOP50 上新长剧播放 152 亿，同比 -15%；腾讯、优酷分别下降 ${Math.abs(platformYoys["腾讯视频"]!).toFixed(0)}%、${Math.abs(platformYoys["优酷"]!).toFixed(0)}%，爱奇艺增长 ${platformYoys["爱奇艺"]!.toFixed(0)}%，芒果TV从 5 亿增至 13 亿。`;
  return (
    <section className="horizontal-drama-trend">
      <div className="horizontal-drama-lead">
        <div className="horizontal-drama-subhead"><span>01</span><h4>横屏长剧大盘趋势</h4></div>
        <EditableInsight lead="长剧播放大盘与热播剧播放同步下跌" body="26Q2 长剧有效播放 411 亿（同比 -20%）。芒果TV少量回升，主要来自 2 部高投入的独家剧集《良陈美锦》《耀眼》，局部供给驱动增长，但不影响大盘下行。" highlights={["411 亿", "同比 -20%", "芒果TV少量回升"]} storageKey="ogv-market-review:26q2:horizontal-drama-trend-v2" />
      </div>
      <div className="horizontal-drama-quarter-filter" aria-label="选择季度">
        <span>显示季度</span>
        {(["Q1", "Q2", "Q3", "Q4", "all"] as const).map((quarter) => (
          <button key={quarter} type="button" className={quarterFilter === quarter ? "selected" : ""} aria-pressed={quarterFilter === quarter} onClick={() => setQuarterFilter(quarter)}>
            {quarter === "all" ? "全部" : quarter}
          </button>
        ))}
      </div>
      <div className="horizontal-drama-charts asymmetric-platform-charts long-drama-overview-charts">
        <article className="horizontal-drama-panel"><header><h5>byQ 有效播放（亿）</h5></header><StackedChart kind="total" quarterFilter={quarterFilter} /></article>
        <article className="horizontal-drama-panel"><header><h5>byQ 分平台 TOP50 上新长剧播放（亿）</h5></header><StackedChart kind="platform" quarterFilter={quarterFilter} /></article>
      </div>
      <p className="horizontal-drama-source">数据来源：{data.source}</p>
      <HorizontalDramaEfficiency filter={quarterFilter} />
      <HorizontalShortDramaTrend filter={quarterFilter} />
    </section>
  );
}

export function HorizontalDramaTrend() {
  data = usePublishedDrama(fallbackData);
  return <HorizontalDramaTrendContent key={JSON.stringify(data)} />;
}
