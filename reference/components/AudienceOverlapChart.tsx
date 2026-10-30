"use client";

import * as echarts from "echarts";
import { useEffect, useRef } from "react";
import overlapData from "../data/platformAudienceOverlap.json";
import { getChartLayout, resizeResponsiveChart } from "./chartResponsive";
import { usePlatformTrend } from "./usePublishedPlatformData";

const colors: Record<string, string> = {
  "爱腾独家MAU": "#7c9fc4",
  "红果x爱腾重叠MAU": "#3c5575",
  "红果独家MAU": "#b8cadb",
};

const order = ["爱腾独家MAU", "红果x爱腾重叠MAU", "红果独家MAU"];

function changeAt(values: number[], index: number) {
  if (index < 1 || values[index - 1] === 0) return null;
  return (values[index] / values[index - 1] - 1) * 100;
}

function periodLabel(period: string) {
  const [year, month] = period.split("-");
  return `${year.slice(2)}年${Number(month)}月`;
}

export function AudienceOverlapChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const data = usePlatformTrend("platform_vs_mau", overlapData);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, undefined, { renderer: "svg" });
    const layoutSpec = { left: 72, right: 210, top: 46, bottom: 58, variant: "wide-right-legend" as const, minRight: 210 };
    const totals = data.periods.map((_, index) => data.series.reduce((sum, series) => sum + Number(series.values[index] ?? 0), 0));
    chart.setOption({
      animationDuration: 420,
      color: order.map((name) => colors[name]),
      grid: getChartLayout(chartRef.current.clientWidth, layoutSpec).grid,
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow", shadowStyle: { color: "rgba(32, 49, 72, .045)" } },
        backgroundColor: "rgba(27, 32, 29, .94)",
        borderWidth: 0,
        textStyle: { color: "#f3f6f3", fontSize: 12 },
        valueFormatter: (value: number) => `${Number(value).toFixed(2)} 亿`,
      },
      xAxis: {
        type: "category",
        data: data.periods.map(periodLabel),
        axisTick: { show: false },
        axisLine: { lineStyle: { color: "#aeb7b0", width: 1.2 } },
        axisLabel: { color: "#303733", fontSize: 11, fontWeight: 650, margin: 18 },
      },
      yAxis: {
        type: "value",
        name: "MAU（亿）",
        nameGap: 24,
        nameTextStyle: { color: "#5f6862", align: "left", fontSize: 11, fontWeight: 600 },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: "#8a928c", fontSize: 10 },
        splitNumber: 4,
        splitLine: { lineStyle: { color: "#e7eae7" } },
      },
      series: order.map((name) => {
        const series = data.series.find((item) => item.name === name)!;
        return {
          name,
          type: "bar",
          stack: "composition",
          barMaxWidth: 82,
          barCategoryGap: "48%",
          data: series.values,
          itemStyle: { color: colors[name], borderColor: "#f9faf7", borderWidth: 1 },
          label: {
            show: true,
            position: "inside",
            color: name === "红果独家MAU" ? "#39434c" : "#fff",
            fontSize: 11,
            fontWeight: 650,
            formatter: (params: { value: number; dataIndex: number }) => params.value >= 0.18 ? Number(params.value).toFixed(2) : "",
          },
          labelLayout: { hideOverlap: true },
        };
      }).concat([{
        name: "平台用户总计",
        type: "bar",
        data: totals,
        barMaxWidth: 82,
        barGap: "-100%",
        silent: true,
        tooltip: { show: false },
        itemStyle: { color: "transparent" },
        label: {
          show: true,
          position: "top",
          distance: 9,
          color: "#161917",
          fontSize: 11,
          fontWeight: 700,
          formatter: (params: { value: number }) => Number(params.value).toFixed(2),
        },
        z: 20,
      }]),
    });
    const observer = new ResizeObserver(() => chartRef.current && resizeResponsiveChart(chart, chartRef.current, layoutSpec));
    observer.observe(chartRef.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [data]);

  return (
    <article className="overlap-chart-module">
      <div className="dau-header">
        <div><span>用户重合结构</span><h3>红果 vs 爱腾 MAU 构成对比</h3></div>
        <p>单位：亿</p>
      </div>
      <div className="overlap-chart-wrap">
        <div ref={chartRef} className="overlap-chart" role="img" aria-label="红果与爱腾MAU构成堆积柱状图" />
        <div className="overlap-direct-labels" aria-label="最新一期用户构成及环比">
          {order.slice().reverse().map((name, index) => {
            const series = data.series.find((item) => item.name === name)!;
            const change = changeAt(series.values as number[], data.periods.length - 1);
            const positions = [82, 168, 252];
            return <span key={name} style={{ color: colors[name], top: positions[index] }}><b>{name.replace("MAU", "")}</b><em className={change != null && change < 0 ? "down" : ""}>{change == null ? "环比 -" : `环比 ${change > 0 ? "+" : ""}${change.toFixed(0)}%`}</em></span>;
          })}
        </div>
      </div>
      <p className="overlap-source">数据来源：QuestMobile。QM 只能比较三个平台的用户重合情况，此处用爱奇艺和腾讯视频的去重汇总用户代替整体长视频用户，看和红果的重叠用户趋势。</p>
    </article>
  );
}
