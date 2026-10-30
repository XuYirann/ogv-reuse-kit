"use client";

import * as echarts from "echarts";
import { useEffect, useMemo, useRef, useState } from "react";
import fallbackData from "../data/longVideoRevenue.json";
import { revenueQuarterContent } from "../content/26Q2";
import { EditableInsight } from "./EditableInsight";
import { reportPeriod } from "./reportPeriod";
import { HideIn26Q3 } from "./ReportQuarterVisibility";
import { setBracketAnnotations } from "./chartBrackets";
import { LiveAiRevenueCharts, ShortDramaPlatformRevenueCharts, type QuarterFilter } from "./ShortDramaRevenueCharts";
import { getChartLayout, resizeResponsiveChart } from "./chartResponsive";
import { usePublishedLongVideoRevenue } from "./usePublishedRevenueData";

type MetricRow = { period: string; [key: string]: string | number | null };

const platformOrder = ["腾讯视频", "爱奇艺", "芒果TV", "优酷视频"];
const stackOrder = ["腾讯视频", "爱奇艺", "优酷视频", "芒果TV"];
const barColors: Record<string, string> = {
  腾讯视频: "#A9BACF",
  爱奇艺: "#C0D688",
  芒果TV: "#EDB795",
  优酷视频: "#89D8F0",
};
const trendColors: Record<string, string> = {
  腾讯视频: "#486b9f",
  爱奇艺: "#7ba900",
  芒果TV: "#df661d",
  优酷视频: "#00aee8",
};

const formatYoy = (current: number | null, previous: number | null) => {
  if (current == null || previous == null || previous === 0) return "同比 –";
  const value = (current / previous - 1) * 100;
  return `同比 ${value > 0 ? "+" : ""}${value.toFixed(0)}%`;
};

const total = (row: MetricRow) => stackOrder.reduce((sum, key) => sum + Number(row[key] || 0), 0);
const previousYearPeriod = (period: string) => `${Number(period.slice(0, 2)) - 1}${period.slice(2)}`;

function filterByQuarter(rows: MetricRow[], filter: QuarterFilter) {
  const filtered = filter === "all" ? rows.slice(-12) : rows.filter((row) => row.period.endsWith(filter));
  return filtered;
}

function RevenueBarChart({ title, rows, filter }: { title: string; rows: MetricRow[]; filter: QuarterFilter }) {
  const ref = useRef<HTMLDivElement>(null);
  const visibleRows = useMemo(() => filterByQuarter(rows, filter), [filter, rows]);

  useEffect(() => {
    if (!ref.current || visibleRows.length === 0) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" });
    const layoutSpec = { left: 42, right: 132, top: 66, bottom: 38, variant: "right-legend" as const, minRight: 132 };
    const totals = visibleRows.map(total);
    chart.setOption({
      animationDuration: 420,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        valueFormatter: (value: number) => `${Number(value).toFixed(1)} 亿`,
      },
      grid: getChartLayout(ref.current.clientWidth, layoutSpec).grid,
      xAxis: {
        type: "category",
        data: visibleRows.map((row) => row.period),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#aeb7b0" } },
        axisLabel: { color: "#59625c", fontSize: 10, interval: 0 },
      },
      yAxis: {
        type: "value",
        name: "亿元",
        nameTextStyle: { color: "#737c76", fontSize: 9 },
        axisLabel: { color: "#737c76", fontSize: 9 },
        splitLine: { lineStyle: { color: "#e5e8e4" } },
      },
      series: [
        ...stackOrder.map((key) => ({
          name: key,
          type: "bar",
          stack: "total",
          data: visibleRows.map((row) => Number(row[key] || 0)),
          barWidth: filter === "all" ? "52%" : "34%",
          itemStyle: { color: barColors[key] },
          label: {
            show: filter !== "all",
            position: "inside",
            color: "#263038",
            fontSize: 9,
            formatter: ({ value }: { value: number }) => value >= 5 ? value.toFixed(0) : "",
          },
        })),
        {
          name: "合计",
          type: "bar",
          data: totals,
          barGap: "-100%",
          barWidth: filter === "all" ? "52%" : "34%",
          silent: true,
          z: 20,
          itemStyle: { color: "transparent" },
          label: { show: true, position: "top", distance: 5, color: "#1e2521", fontSize: 10, fontWeight: 700, formatter: ({ value }: { value: number }) => value.toFixed(0) },
        },
      ],
    });

    const drawYoy = () => {
      const currentIndex = visibleRows.length - 1;
      const previousIndex = visibleRows.findIndex((row) => row.period === previousYearPeriod(visibleRows[currentIndex].period));
      if (previousIndex < 0) return setBracketAnnotations(chart, []);
      let cumulative = totals[currentIndex];
      const platformLabels = [...stackOrder].reverse().map((key, index) => {
        const currentValue = Number(visibleRows[currentIndex][key] || 0);
        cumulative -= currentValue;
        return {
          previousIndex,
          currentIndex,
          previousValue: 0,
          currentValue: cumulative + currentValue / 2,
          title: key,
          label: formatYoy(currentValue, Number(visibleRows[previousIndex][key] || 0)),
          variant: "sideLabel" as const,
          swatchColor: barColors[key],
          labelFontSize: 8,
          labelY: 88 + index * 48,
        };
      });
      setBracketAnnotations(chart, [{
        previousIndex,
        currentIndex,
        previousValue: totals[previousIndex],
        currentValue: totals[currentIndex],
        label: formatYoy(totals[currentIndex], totals[previousIndex]).replace("同比 ", ""),
        targetGap: 22,
        labelFontSize: 8,
      }, ...platformLabels]);
    };
    requestAnimationFrame(drawYoy);
    const observer = new ResizeObserver(() => ref.current && resizeResponsiveChart(chart, ref.current, layoutSpec, () => requestAnimationFrame(drawYoy)));
    observer.observe(ref.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [filter, visibleRows]);

  return <section className="income-chart-card"><header><h3>{title}</h3></header><div ref={ref} className="income-bar-chart" role="img" aria-label={`${title}堆叠柱状图`} /></section>;
}

function RevenueTrendChart({ title, unit, rows, decimals }: { title: string; unit: string; rows: MetricRow[]; decimals: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const visibleRows = useMemo(() => rows, [rows]);

  useEffect(() => {
    if (!ref.current || visibleRows.length === 0) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" });
    const layoutSpec = { left: 44, right: 138, top: 46, bottom: 42, variant: "right-legend" as const, minRight: 138 };
    const lastRow = visibleRows.at(-1)!;
    const previousRow = rows.find((row) => row.period === previousYearPeriod(lastRow.period));
    chart.setOption({
      animationDuration: 420,
      tooltip: { trigger: "axis", valueFormatter: (value: number) => `${Number(value).toFixed(decimals)} ${unit}` },
      grid: getChartLayout(ref.current.clientWidth, layoutSpec).grid,
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: visibleRows.map((row) => row.period),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#aeb7b0" } },
        axisLabel: {
          color: "#59625c",
          fontSize: 10,
          interval: (index: number, value: string) => value.endsWith("Q1") || index === visibleRows.length - 1,
        },
      },
      yAxis: {
        type: "value",
        name: unit,
        scale: true,
        nameTextStyle: { color: "#737c76", fontSize: 9 },
        axisLabel: { color: "#737c76", fontSize: 9 },
        splitLine: { lineStyle: { color: "#e5e8e4" } },
      },
      series: platformOrder.map((key) => ({
        name: key,
        type: "line",
        data: visibleRows.map((row) => row[key]),
        connectNulls: false,
        smooth: 0.18,
        showSymbol: false,
        lineStyle: { width: 2.3, color: trendColors[key] },
        itemStyle: { color: trendColors[key] },
        emphasis: { focus: "series" },
      })),
    });

    const drawLabels = () => setBracketAnnotations(chart, platformOrder.map((key, index) => ({
      previousIndex: Math.max(0, visibleRows.length - 2),
      currentIndex: visibleRows.length - 1,
      previousValue: Number(visibleRows[Math.max(0, visibleRows.length - 2)][key] || 0),
      currentValue: Number(lastRow[key] || 0),
      title: key,
      label: formatYoy(lastRow[key] as number | null, previousRow?.[key] as number | null),
      variant: "sideLabel" as const,
      swatchColor: trendColors[key],
      labelFontSize: 8,
      labelY: 72 + index * 52,
    })));
    requestAnimationFrame(drawLabels);
    const observer = new ResizeObserver(() => ref.current && resizeResponsiveChart(chart, ref.current, layoutSpec, () => requestAnimationFrame(drawLabels)));
    observer.observe(ref.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [decimals, rows, unit, visibleRows]);

  return <section className="income-chart-card"><header><h3>{title}</h3></header><div ref={ref} className="income-trend-chart" role="img" aria-label={`${title}趋势折线图`} /></section>;
}

export function RevenueStructureSection() {
  const data = usePublishedLongVideoRevenue(fallbackData);
  const latestQuarter = (data.membership.at(-1)?.period.slice(-2) as QuarterFilter) || "Q2";
  const [filter, setFilter] = useState<QuarterFilter>(latestQuarter);
  useEffect(() => setFilter((reportPeriod()?.slice(-2) as QuarterFilter) || latestQuarter), [latestQuarter]);
  const [incomeInsight, memberInsight, liveAiInsight] = revenueQuarterContent.insights;
  return <section id="revenue" className="report-section revenue-structure-section">
    <div className="section-heading revenue-section-heading">
      <span className="section-index">03</span>
      <h2>收入结构</h2>
      <div className="short-revenue-filter revenue-quarter-filter" aria-label="按季度筛选收入结构数据">
        {(["Q1", "Q2", "Q3", "Q4", "all"] as QuarterFilter[]).map((quarter) => <button key={quarter} type="button" className={filter === quarter ? "selected" : ""} onClick={() => setFilter(quarter)}>{quarter === "all" ? "全部" : quarter}</button>)}
      </div>
    </div>

    <div className="revenue-analysis-group">
      <EditableInsight lead={incomeInsight.lead} body={incomeInsight.body} highlights={incomeInsight.highlights} storageKey="ogv-market-review:26q2:long-video-income-insight" />
      <div className="income-chart-grid">
        <RevenueBarChart title="长视频平台会员收入（亿元）" rows={data.membership as MetricRow[]} filter={filter} />
        <RevenueBarChart title="长视频平台广告收入（亿元）" rows={data.advertising as MetricRow[]} filter={filter} />
      </div>
      <HideIn26Q3><ShortDramaPlatformRevenueCharts filter={filter} /></HideIn26Q3>
    </div>

    <div className="revenue-analysis-group revenue-analysis-secondary">
      <EditableInsight lead={memberInsight.lead} body={memberInsight.body} highlights={memberInsight.highlights} storageKey="ogv-market-review:26q2:long-video-member-insight" />
      <div className="income-chart-grid">
        <RevenueTrendChart title="会员数（亿）" unit="亿" rows={data.members as MetricRow[]} decimals={2} />
        <RevenueTrendChart title="会员 ARPPU（元/月）" unit="元/月" rows={data.arppu as MetricRow[]} decimals={1} />
      </div>
      <p className="short-revenue-source">注：腾讯视频、爱奇艺为日均会员数，芒果 TV、优酷为季度末会员数；ARPPU=季度会员总收入/期末会员数/3；数据来源：QM，公司年报，专家访谈，战略发展部分析。</p>
    </div>

    <HideIn26Q3><div className="revenue-analysis-group revenue-analysis-secondary">
      <EditableInsight lead={liveAiInsight.lead} body={liveAiInsight.body} highlights={liveAiInsight.highlights} storageKey="ogv-market-review:26q2:live-ai-short-drama-insight" />
      <LiveAiRevenueCharts />
    </div></HideIn26Q3>
  </section>;
}
