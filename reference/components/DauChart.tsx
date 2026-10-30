"use client";

import * as echarts from "echarts";
import { useEffect, useMemo, useRef, useState } from "react";
import dauData from "../data/platformAudienceDau.json";
import mauData from "../data/platformAudienceMau.json";
import { getChartLayout, resizeResponsiveChart } from "./chartResponsive";
import { usePlatformTrend } from "./usePublishedPlatformData";

import { reportEndPeriod } from "./reportPeriod";

type AudienceData = typeof dauData;

const colors: Record<string, string> = {
  红果免费短剧: "#ef3f3a",
  红果免费漫剧: "#ff7168",
  河马剧场: "#98506e",
  腾讯视频: "#486b9f",
  爱奇艺: "#7ba900",
  芒果TV: "#df661d",
  优酷视频: "#00aee8",
  长视频平台: "#26364d",
  短剧平台: "#9b6bde",
};

const platformOrder = [
  "腾讯视频",
  "爱奇艺",
  "芒果TV",
  "优酷视频",
  "红果免费短剧",
  "红果免费漫剧",
  "河马剧场",
];

function shiftMonths(period: string, months: number) {
  const [year, month] = period.split("-").map(Number);
  const date = new Date(year, month - 1 - months, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function yoyAt(series: (number | null)[], index: number) {
  const current = series[index];
  const previous = series[index - 12];
  if (current == null || previous == null || previous === 0) return null;
  return (current / previous - 1) * 100;
}

function AudienceTrendChart({ data, showHint = true }: { data: AudienceData; showHint?: boolean }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const lastPeriod = data.periods.at(-1) ?? "2026-06";
  const firstPeriod = data.periods[0];
  const [startPeriod, setStartPeriod] = useState(shiftMonths(lastPeriod, 59));
  const [endPeriod, setEndPeriod] = useState(lastPeriod);
  const [rangePreset, setRangePreset] = useState<string>("5");

  useEffect(() => {
    const end = reportEndPeriod(data.periods, true);
    setEndPeriod(end);
    setStartPeriod(shiftMonths(end, 59));
  }, [data.periods, lastPeriod]);

  const startIndex = Math.max(0, data.periods.indexOf(startPeriod));
  const endIndexRaw = data.periods.indexOf(endPeriod);
  const endIndex = endIndexRaw < startIndex ? data.periods.length - 1 : endIndexRaw;

  const visibleData = useMemo(() => {
    const periods = data.periods.slice(startIndex, endIndex + 1);
    const orderedSeries = platformOrder
      .map((name) => data.series.find((item) => item.name === name))
      .filter((item): item is (typeof data.series)[number] => item != null);
    const series = orderedSeries.map((item) => {
        let started = false;
        const values = item.values.slice(startIndex, endIndex + 1).map((value) => {
          if (!started && value === 0) return null;
          if (value != null && value > 0) started = true;
          return value;
        });
        return { ...item, values };
      });
    return { periods, series };
  }, [data, endIndex, startIndex]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, undefined, { renderer: "svg" });
    const layoutSpec = { left: 50, right: 152, top: 42, bottom: 68, variant: "end-label" as const, minRight: 152 };
    const useAxisBreak = data.metric === "DAU" && visibleData.series.some(item => item.values.some(value => value != null && value > 1.8));
    const option: echarts.EChartsOption = {
      animationDuration: 420,
      color: visibleData.series.map((item) => colors[item.name]),
      grid: { ...getChartLayout(chartRef.current.clientWidth, layoutSpec).grid, containLabel: false },
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(27, 32, 29, .94)",
        borderWidth: 0,
        padding: [12, 14],
        textStyle: { color: "#f3f6f3", fontSize: 12 },
        axisPointer: { type: "line", lineStyle: { color: "#87918a", type: "dashed" } },
        valueFormatter: (value) => `${Number(value).toFixed(2)} 亿`,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: visibleData.periods,
        axisLine: { lineStyle: { color: "#b8c0ba" } },
        axisTick: { show: false },
        axisLabel: {
          color: "#7b847e",
          fontSize: 11,
          margin: 15,
          hideOverlap: true,
          formatter: (value: string) => value.endsWith("-01") ? value.slice(0, 4) : value,
        },
      },
      yAxis: {
        type: "value",
        name: `${data.metric}（${data.unit}）`,
        nameLocation: "end",
        nameGap: 18,
        nameTextStyle: { color: "#5f6862", align: "left", fontSize: 12, fontWeight: 600 },
        ...(useAxisBreak ? { max: (extent: { max: number }) => Math.ceil(extent.max * 10) / 10 + 0.1, breaks: [{ start: 1.1, end: 1.7, gap: "4%" }], breakArea: { show: true, expandOnClick: false, zigzagAmplitude: 3, itemStyle: { color: "#f8faf7", borderColor: "#9aa49c", borderWidth: 1 } } } : {}),
        splitNumber: 5,
        axisLabel: { color: "#7b847e", fontSize: 11, formatter: (value: number) => value.toFixed(1) },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { lineStyle: { color: "#e2e6e2" } },
      },
      dataZoom: [{ type: "inside", zoomOnMouseWheel: "shift", moveOnMouseMove: true }],
      series: visibleData.series.map((item) => {
        const sourceSeries = data.series.find((series) => series.name === item.name);
        const yoy = item.name === "红果免费漫剧" ? null : sourceSeries ? yoyAt(sourceSeries.values, endIndex) : null;
        const yoyLabel = yoy == null ? "—" : `${yoy > 0 ? "+" : ""}${yoy.toFixed(0)}%`;

        return {
          name: item.name,
          type: "line",
          data: item.values,
          clip: false,
          showSymbol: false,
          connectNulls: false,
          smooth: 0.16,
          lineStyle: { width: item.name === "红果免费短剧" ? 3.2 : 2.3 },
          emphasis: { focus: "series", lineStyle: { width: 4 } },
          endLabel: {
            show: true,
            fontSize: 11,
            fontWeight: 650,
            distance: 7,
            formatter: () => `{platform|${item.name}}  {yoy|同比 ${yoyLabel}}`,
            rich: {
              platform: { color: colors[item.name], fontSize: 12, fontWeight: 650 },
              yoy: { color: yoy != null && yoy < 0 ? "#c74337" : "#161917", fontSize: 12, fontWeight: 650 },
            },
          },
          labelLayout: { moveOverlap: "shiftY" },
        };
      }),
    };
    chart.setOption(option);
    const resizeObserver = new ResizeObserver(() => chartRef.current && resizeResponsiveChart(chart, chartRef.current, layoutSpec));
    resizeObserver.observe(chartRef.current);
    return () => {
      resizeObserver.disconnect();
      chart.dispose();
    };
  }, [data, endIndex, visibleData]);

  const setRange = (years: number) => {
    setEndPeriod(lastPeriod);
    setStartPeriod(shiftMonths(lastPeriod, years * 12 - 1));
    setRangePreset(String(years));
  };

  return (
    <article className="dau-module">
      <div className="dau-header">
        <div>
          <h3>{data.metric}（{data.unit}）</h3>
        </div>
        <div className="chart-controls chart-controls-compact">
          <div className="range-buttons" aria-label="时间范围">
            <button className={rangePreset === "1" ? "selected" : ""} type="button" onClick={() => setRange(1)}>近 1 年</button>
            <button className={rangePreset === "5" ? "selected" : ""} type="button" onClick={() => setRange(5)}>近 5 年</button>
          </div>
          <div className="month-controls">
            <label>开始<input type="month" min={firstPeriod} max={endPeriod} value={startPeriod} onChange={(event) => { setStartPeriod(event.target.value); setRangePreset("custom"); }} /></label>
            <label>结束<input type="month" min={startPeriod} max={lastPeriod} value={endPeriod} onChange={(event) => { setEndPeriod(event.target.value); setRangePreset("custom"); }} /></label>
          </div>
        </div>
      </div>

      <div ref={chartRef} className="dau-chart" role="img" aria-label={`${startPeriod}至${endPeriod}各平台${data.metric}趋势图`} />
      <div className="chart-meta">
        <p className="chart-hint">{showHint ? "悬停查看月度数据；DAU 高于 1.8 亿时压缩 1.1–1.7 亿区间，折线标记表示断轴。" : "悬停查看月度数据。"}</p>
        <p className="chart-source">数据来源：{data.source}</p>
      </div>
    </article>
  );
}

export function DauChart() {
  const data = usePlatformTrend("platform_platform_audience_dau", dauData, 10000);
  return <AudienceTrendChart data={data} />;
}

export function MauChart() {
  const data = usePlatformTrend("platform_platform_audience_mau", mauData, 10000);
  return <AudienceTrendChart data={data} showHint={false} />;
}
