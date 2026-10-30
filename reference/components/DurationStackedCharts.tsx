"use client";

import * as echarts from "echarts";
import { useEffect, useMemo, useRef, useState } from "react";
import durationData from "../data/platformAudienceTotalDuration.json";
import { getChartLayout, resizeResponsiveChart } from "./chartResponsive";
import { usePlatformDuration } from "./usePublishedPlatformData";

import { reportEndPeriod } from "./reportPeriod";

const colors: Record<string, string> = {
  腾讯视频: "#486b9f",
  爱奇艺: "#7ba900",
  芒果TV: "#df661d",
  优酷视频: "#00aee8",
  红果免费短剧: "#ef3f3a",
  红果免费漫剧: "#ff7168",
  河马剧场: "#98506e",
  其他长视频平台: "#26364d",
  其他短剧平台: "#9b6bde",
};

const groups = [
  {
    title: "传统长视频平台总用户时长",
    comparison: "同比",
    platforms: ["其他长视频平台", "芒果TV", "优酷视频", "腾讯视频", "爱奇艺"],
  },
  {
    title: "短剧平台总用户时长",
    comparison: "环比",
    platforms: ["其他短剧平台", "河马剧场", "红果免费漫剧", "红果免费短剧"],
  },
] as const;

function growthAt(values: (number | null)[], index: number, lag: number) {
  const current = values[index];
  const previous = values[index - lag];
  if (current == null || previous == null || previous === 0) return null;
  return (current / previous - 1) * 100;
}

function StackedDurationChart({
  title,
  comparison,
  platforms,
  data,
}: {
  title: string;
  comparison: "同比" | "环比";
  platforms: readonly string[];
  data: typeof durationData;
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const lastIndex = data.periods.length - 1;
  const defaultStartIndex = Math.max(0, lastIndex - 19);
  const [startPeriod, setStartPeriod] = useState(data.periods[defaultStartIndex]);
  const [endPeriod, setEndPeriod] = useState(data.periods[lastIndex]);
  const [rangePreset, setRangePreset] = useState("5");

  useEffect(() => {
    const nextLastIndex = data.periods.indexOf(reportEndPeriod(data.periods));
    setStartPeriod(data.periods[Math.max(0, nextLastIndex - 19)]);
    setEndPeriod(data.periods[nextLastIndex]);
  }, [data.periods]);

  const startIndex = Math.max(0, data.periods.indexOf(startPeriod));
  const rawEndIndex = data.periods.indexOf(endPeriod);
  const endIndex = rawEndIndex < startIndex ? lastIndex : rawEndIndex;

  const visibleData = useMemo(() => {
    const series = platforms
      .map((name) => data.series.find((series) => series.name === name))
      .filter((series): series is (typeof data.series)[number] => series != null)
      .map((series) => ({ ...series, values: series.values.slice(startIndex, endIndex + 1) }))
    return { periods: data.periods.slice(startIndex, endIndex + 1), series };
  }, [data, endIndex, platforms, startIndex]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, undefined, { renderer: "svg" });
    const layoutSpec = { left: 58, right: 176, top: 42, bottom: 58, variant: "end-label" as const, minRight: 176 };
    const totals = visibleData.periods.map((_, periodIndex) => visibleData.series.reduce((sum, series) => sum + Number(series.values[periodIndex] ?? 0), 0));
    const latestQuarter = data.periods.at(-1)?.slice(-2);
    chart.setOption({
      animationDuration: 420,
      color: visibleData.series.map((series) => colors[series.name]),
      grid: getChartLayout(chartRef.current.clientWidth, layoutSpec).grid,
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(27, 32, 29, .94)",
        borderWidth: 0,
        padding: [12, 14],
        textStyle: { color: "#f3f6f3", fontSize: 12 },
        valueFormatter: (value: number) => `${Number(value).toFixed(1)} 亿小时`,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: visibleData.periods,
        axisLine: { lineStyle: { color: "#b8c0ba" } },
        axisTick: { show: false },
        axisLabel: { color: "#7b847e", fontSize: 11, hideOverlap: true },
      },
      yAxis: {
        type: "value",
        name: "总时长（亿小时）",
        nameGap: 18,
        nameTextStyle: { color: "#5f6862", align: "left", fontSize: 12, fontWeight: 600 },
        axisLabel: { color: "#7b847e", fontSize: 11 },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "#e2e6e2" } },
      },
      dataZoom: [{ type: "inside", zoomOnMouseWheel: "shift", moveOnMouseMove: true }],
      series: [...visibleData.series.map((series) => {
        const source = data.series.find((item) => item.name === series.name);
        const yoy = source ? growthAt(source.values, endIndex, comparison === "环比" ? 1 : 4) : null;
        const yoyLabel = yoy == null ? "-" : `${yoy > 0 ? "+" : ""}${yoy.toFixed(0)}%`;
        return {
          name: series.name,
          type: "line",
          stack: "platform-total",
          stackStrategy: "all",
          data: series.values,
          showSymbol: false,
          smooth: 0.15,
          clip: false,
          lineStyle: { width: 2.1, color: colors[series.name] },
          areaStyle: { opacity: 0.2, color: colors[series.name] },
          emphasis: { focus: "series" },
          endLabel: {
            show: true,
            distance: 8,
            formatter: () => `{platform|${series.name}}  {yoy|${comparison} ${yoyLabel}}`,
            rich: {
              platform: { color: colors[series.name], fontSize: 12, fontWeight: 650 },
              yoy: { color: yoy != null && yoy < 0 ? "#c74337" : "#161917", fontSize: 12, fontWeight: 650 },
            },
          },
          labelLayout: { moveOverlap: "shiftY" },
        };
      }), {
        name: "合计",
        type: "line",
        data: totals,
        showSymbol: false,
        silent: true,
        z: 30,
        lineStyle: { opacity: 0 },
        itemStyle: { opacity: 0 },
        markPoint: {
          silent: true,
          symbol: "circle",
          symbolSize: 2,
          itemStyle: { color: "transparent" },
          label: {
            show: true,
            position: "top",
            distance: 4,
            color: "#263038",
            fontSize: 9,
            fontWeight: 700,
            formatter: ({ value }: { value: number }) => Number(value).toFixed(0),
          },
          data: visibleData.periods.flatMap((period, dataIndex) => period.endsWith(latestQuarter ?? "") ? [{ coord: [period, totals[dataIndex]], value: totals[dataIndex] }] : []),
        },
      }],
    });
    const observer = new ResizeObserver(() => chartRef.current && resizeResponsiveChart(chart, chartRef.current, layoutSpec));
    observer.observe(chartRef.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [comparison, data, endIndex, visibleData]);

  const setRange = (years: number) => {
    const quarters = years * 4;
    setStartPeriod(data.periods[Math.max(0, lastIndex - quarters + 1)]);
    setEndPeriod(data.periods[lastIndex]);
    setRangePreset(String(years));
  };

  return (
    <article className={`duration-chart-module${platforms.length === 4 ? " duration-chart-short" : ""}`}>
      <div className="dau-header">
        <div><h3>{title}（亿小时）</h3></div>
        <div className="duration-controls chart-controls-compact">
          <div className="range-buttons" aria-label="时间范围">
            <button className={rangePreset === "1" ? "selected" : ""} type="button" onClick={() => setRange(1)}>近 1 年</button>
            <button className={rangePreset === "5" ? "selected" : ""} type="button" onClick={() => setRange(5)}>近 5 年</button>
          </div>
          <div className="quarter-controls">
            <label>开始<select value={startPeriod} onChange={(event) => { setStartPeriod(event.target.value); setRangePreset("custom"); }}>{data.periods.slice(0, endIndex + 1).map((period) => <option key={period}>{period}</option>)}</select></label>
            <label>结束<select value={endPeriod} onChange={(event) => { setEndPeriod(event.target.value); setRangePreset("custom"); }}>{data.periods.slice(startIndex).map((period) => <option key={period}>{period}</option>)}</select></label>
          </div>
        </div>
      </div>
      <div ref={chartRef} className="duration-chart" role="img" aria-label={`${startPeriod}至${endPeriod}${title}堆叠面积趋势图`} />
      <div className="chart-meta">
        <p className="chart-hint">悬停查看季度数据。</p>
        <p className="chart-source">数据来源：{data.source}</p>
      </div>
    </article>
  );
}

export function DurationStackedCharts() {
  const data = usePlatformDuration(durationData);
  return <div className="duration-charts">{groups.map((group) => <StackedDurationChart key={group.title} {...group} data={data} />)}</div>;
}
