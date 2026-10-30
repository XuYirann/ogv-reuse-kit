"use client";

import * as echarts from "echarts";
import { useEffect, useMemo, useRef, useState } from "react";
import fallbackData from "../data/varietyTrend.json";
import { usePublishedVariety } from "./usePublishedCategoryReports";
import { EditableInsight } from "./EditableInsight";
import { type BracketComparison, setBracketAnnotations } from "./chartBrackets";
import { VarietyTopSeries } from "./VarietyTopSeries";
import { getChartLayout, resizeResponsiveChart } from "./chartResponsive";

type QuarterFilter = "Q1" | "Q2" | "Q3" | "Q4" | "all";
type ChartKind = "total" | "platform";
let data: any = fallbackData;

const colors: Record<string, string> = {
  "电视综艺": "#9eb3c9",
  "网络综艺": "#385577",
  "其他综艺": "#c8ceca",
  "爱奇艺": "#C0D688",
  "腾讯视频": "#A9BACF",
  "优酷": "#89D8F0",
  "芒果TV": "#EDB795",
};

const formatPercent = (value: number | null) => value == null ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(0)}%`;
const yoy = (current: number, previous: number) => previous ? (current / previous - 1) * 100 : null;
const displayName = (name: string) => ({ "电视综艺": "热播电视综艺", "网络综艺": "热播网络综艺", "其他综艺": "其他综艺" }[name] ?? name);

function VarietyStackedChart({ kind, quarterFilter }: { kind: ChartKind; quarterFilter: QuarterFilter }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const { periods, series } = useMemo(() => {
    const indexes = data.periods
      .map((period, index) => ({ period, index }))
      .filter(({ period }) => quarterFilter === "all" || period.endsWith(quarterFilter))
      .slice(quarterFilter === "all" ? -16 : -4);
    return {
      periods: indexes.map(({ period }) => period),
      series: data[kind].series.map((item) => ({ ...item, values: indexes.map(({ index }) => item.values[index]) })),
    };
  }, [kind, quarterFilter]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.removeAttribute("data-ogv-rendered-period");
    const chart = echarts.init(chartRef.current, undefined, { renderer: "svg" });
    const layoutSpec = { left: 46, right: kind === "total" ? 38 : 158, top: 62, bottom: 66, variant: kind === "total" ? "plain" as const : "wide-right-legend" as const, minRight: kind === "total" ? 38 : 158 };
    const totals = periods.map((_, index) => series.reduce((sum, item) => sum + Number(item.values[index] ?? 0), 0));
    const latestIndex = periods.length - 1;
    const previousIndex = periods.length - 2;
    const showComparison = quarterFilter !== "all" && periods.length >= 2;
    const hotValues = kind === "total"
      ? periods.map((_, index) => Number(series[0].values[index]) + Number(series[1].values[index]))
      : [];

    chart.setOption({
      animationDuration: 420,
      color: series.map((item) => colors[item.name]),
      grid: getChartLayout(chartRef.current.clientWidth, layoutSpec).grid,
      tooltip: { show: false },
      legend: {
        show: kind === "total",
        bottom: 12,
        data: [...series].reverse().map((item) => displayName(item.name)),
        itemWidth: 10,
        itemHeight: 10,
        textStyle: { color: "#58615b", fontSize: 12 },
      },
      xAxis: {
        type: "category",
        data: periods,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#aeb7b0" } },
        axisLabel: { color: "#737c76", fontSize: 10, interval: quarterFilter === "all" ? 3 : 0 },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#737c76", fontSize: 10 },
        splitLine: { lineStyle: { color: "#e4e7e4" } },
      },
      series: [
        ...series.map((item) => ({
          name: displayName(item.name),
          type: "bar" as const,
          stack: "total",
          data: item.values,
          barMaxWidth: 36,
          label: {
            show: true,
            position: "inside" as const,
            color: item.name === "网络综艺" || item.name === "腾讯视频" ? "#ffffff" : "#263038",
            fontSize: quarterFilter === "all" ? 8 : 10,
            formatter: ({ value, dataIndex }: { value: number; dataIndex: number }) => {
              if (value < .45) return "";
              const share = totals[dataIndex] ? value / totals[dataIndex] * 100 : 0;
              return kind === "total" ? value.toFixed(0) : `${value.toFixed(0)}\n(${share.toFixed(0)}%)`;
            },
          },
        })),
        {
          name: "柱顶合计",
          type: "bar" as const,
          data: totals,
          barMaxWidth: 36,
          barGap: "-100%",
          silent: true,
          z: 20,
          itemStyle: { color: "rgba(0,0,0,0)" },
          label: { show: true, position: "top" as const, distance: 8, color: "#161917", fontSize: 12, fontWeight: 700, formatter: ({ value }: { value: number }) => value.toFixed(0) },
        },
      ],
    });

    const drawAnnotations = () => {
      if (!showComparison) return setBracketAnnotations(chart, []);
      const comparisons: BracketComparison[] = [];
      if (kind === "total") {
        comparisons.push(
          {
            previousIndex, currentIndex: latestIndex,
            previousValue: totals[previousIndex], currentValue: totals[latestIndex],
            label: formatPercent(yoy(totals[latestIndex], totals[previousIndex])),
            level: 0, targetGap: 18, labelFontSize: 8,
          },
          {
            previousIndex, currentIndex: latestIndex,
            previousValue: hotValues[previousIndex], currentValue: hotValues[latestIndex],
            label: formatPercent(yoy(hotValues[latestIndex], hotValues[previousIndex])),
            variant: "difference", arrowOffset: 30, labelFontSize: 8,
          },
        );
      } else {
        const legendOrder = ["芒果TV", "优酷", "腾讯视频", "爱奇艺"];
        const legendRows = [92, 162, 232, 302];
        legendOrder.forEach((name, legendIndex) => {
          const item = series.find((entry) => entry.name === name);
          if (!item) return;
          const seriesIndex = series.findIndex((entry) => entry.name === name);
          const current = Number(item.values[latestIndex]);
          const previous = Number(item.values[previousIndex]);
          const lower = series.slice(0, seriesIndex).reduce((sum, entry) => sum + Number(entry.values[latestIndex]), 0);
          comparisons.push({
            previousIndex, currentIndex: latestIndex,
            previousValue: lower + current / 2, currentValue: lower + current / 2,
            label: `同比 ${formatPercent(yoy(current, previous))}`,
            variant: "sideLabel", title: name, swatchColor: colors[name], labelFontSize: 8, labelY: legendRows[legendIndex],
          });
        });
      }
      setBracketAnnotations(chart, comparisons);
    };

    chart.on("finished", () => { if (chartRef.current && periods.length) chartRef.current.dataset.ogvRenderedPeriod = periods.at(-1)!; });
    requestAnimationFrame(drawAnnotations);
    const observer = new ResizeObserver(() => chartRef.current && resizeResponsiveChart(chart, chartRef.current, layoutSpec, () => requestAnimationFrame(drawAnnotations)));
    observer.observe(chartRef.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [kind, periods, quarterFilter, series]);

  return <div ref={chartRef} className="horizontal-drama-chart variety-chart" role="img" aria-label={kind === "total" ? "综艺有效播放" : "分平台热播综艺播放"} />;
}

function VarietyTrendContent() {
  const [quarterFilter, setQuarterFilter] = useState<QuarterFilter>((data.periods.at(-1)?.slice(-2) as QuarterFilter) || "Q2");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search), period = params.get("conclusion");
    if (!params.has("preview") && period && /^\d{2}Q[1-4]$/.test(period)) setQuarterFilter(period.slice(-2) as QuarterFilter);
  }, []);
  return (
    <section className="horizontal-drama-trend variety-trend">
      <div className="horizontal-drama-lead">
        <div className="horizontal-drama-subhead"><span>01</span><h4>综艺大盘趋势</h4></div>
        <EditableInsight
          lead="热播综艺触底平稳，播放小幅回升"
          body="热播综艺合计 46 亿，同比 +8%。回升主要来自头部综 N 代的播放上涨。"
          highlights={["67 亿", "-1%", "46 亿", "+8%", "增长 26%", "增长 11%、9%", "下降 33%"]}
          storageKey="ogv-market-review:26q2:variety-trend-v1"
        />
      </div>
      <div className="horizontal-drama-quarter-filter" aria-label="选择季度">
        <span>显示季度</span>
        {(["Q1", "Q2", "Q3", "Q4", "all"] as const).map((quarter) => (
          <button key={quarter} type="button" className={quarterFilter === quarter ? "selected" : ""} aria-pressed={quarterFilter === quarter} onClick={() => setQuarterFilter(quarter)}>
            {quarter === "all" ? "全部" : quarter}
          </button>
        ))}
      </div>
      <div className="horizontal-drama-charts asymmetric-platform-charts variety-charts">
        <article className="horizontal-drama-panel">
          <header><div><h5>byQ 综艺有效播放（亿）</h5></div></header>
          <VarietyStackedChart kind="total" quarterFilter={quarterFilter} />
        </article>
        <article className="horizontal-drama-panel">
          <header><h5>byQ 分平台热播综艺播放（亿）</h5></header>
          <VarietyStackedChart kind="platform" quarterFilter={quarterFilter} />
        </article>
      </div>
      <p className="horizontal-drama-source variety-source">数据来源：{data.source}；口径说明：上新综艺 TOP50 占上新综艺播放的 90%–95%，网络综艺与电视综艺合计为热播综艺。</p>
      <VarietyTopSeries filter={quarterFilter} />
    </section>
  );
}

export function VarietyTrend() {
  data = usePublishedVariety(fallbackData);
  return <VarietyTrendContent key={JSON.stringify(data)} />;
}
