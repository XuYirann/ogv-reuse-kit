"use client";

import * as echarts from "echarts";
import { useEffect, useMemo, useRef } from "react";
import fallbackData from "../data/horizontalDramaTrend.json";
import { usePublishedDrama } from "./usePublishedCategoryReports";
import { EditableInsight } from "./EditableInsight";
import { setBracketAnnotations } from "./chartBrackets";
import { ShortDramaTopSeries } from "./HorizontalDramaTopSeries";
import { getChartLayout, resizeResponsiveChart } from "./chartResponsive";

type QuarterFilter = "Q1" | "Q2" | "Q3" | "Q4" | "all";
let data: any = fallbackData;

const colors: Record<string, string> = {
  上新剧: "#385577",
  其他: "#d9dfe8",
  爱奇艺: "#C0D688",
  腾讯视频: "#A9BACF",
  优酷: "#89D8F0",
  芒果TV: "#EDB795",
};

function yoy(current: number | null | undefined, previous: number | null | undefined) {
  if (current == null || previous == null || previous === 0) return null;
  return (current / previous - 1) * 100;
}

function pct(value: number | null) {
  return value == null ? "-" : `${value > 0 ? "+" : ""}${value.toFixed(0)}%`;
}

function ShortDramaChart({ kind, filter }: { kind: "total" | "platform"; filter: QuarterFilter }) {
  const chartRef = useRef<HTMLDivElement>(null);
  const model = data.shortDrama;
  const sourceSeries = kind === "total"
    ? [...model.total.series].sort((a, b) => Number(b.name === "上新剧") - Number(a.name === "上新剧"))
    : model.platform.series;
  const view = useMemo(() => {
    const indexes = model.periods
      .map((period, index) => ({ period, index }))
      .filter(({ period }) => filter === "all" || period.endsWith(filter));
    const series = sourceSeries.map((item) => ({ ...item, values: indexes.map(({ index }) => item.values[index]) }));
    return { indexes, periods: indexes.map(({ period }) => period), series };
  }, [filter, model.periods, sourceSeries]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, undefined, { renderer: "svg" });
    const layoutSpec = { left: 46, right: kind === "total" ? 96 : 152, top: 62, bottom: 46, variant: kind === "total" ? "plain" as const : "wide-right-legend" as const, minRight: kind === "total" ? 96 : 152 };
    const totals = view.periods.map((_, index) => view.series.reduce((sum, item) => sum + Number(item.values[index] ?? 0), 0));
    const latestIndex = view.periods.length - 1;
    const previousIndex = latestIndex - 1;
    const showComparison = filter !== "all" && previousIndex >= 0;

    chart.setOption({
      animationDuration: 420,
      color: view.series.map((item) => colors[item.name]),
      grid: getChartLayout(chartRef.current.clientWidth, layoutSpec).grid,
      tooltip: { show: false },
      legend: { show: kind === "total", bottom: 6, data: view.series.map((item) => item.name), itemWidth: 10, itemHeight: 10, textStyle: { color: "#58615b", fontSize: 12 } },
      xAxis: { type: "category", data: view.periods, axisTick: { show: false }, axisLine: { lineStyle: { color: "#aeb7b0" } }, axisLabel: { color: "#737c76", fontSize: 10, interval: filter === "all" ? 3 : 0 } },
      yAxis: { type: "value", axisLabel: { color: "#737c76", fontSize: 10 }, splitLine: { lineStyle: { color: "#e4e7e4" } } },
      series: [
        ...view.series.map((item) => ({
          name: item.name,
          type: "bar" as const,
          stack: "total",
          data: item.values,
          barMaxWidth: 38,
          itemStyle: { color: colors[item.name] },
          label: {
            show: true,
            position: "inside" as const,
            color: item.name === "其他" || kind === "platform" ? "#263038" : "#fff",
            fontSize: filter === "all" ? 8 : 10,
            formatter: ({ value, dataIndex }: { value: number | null; dataIndex: number }) => {
              if (value == null || Math.abs(value) < .08) return "";
              if (kind === "platform" && (item.name === "优酷" || item.name === "芒果TV")) return "";
              const share = totals[dataIndex] ? Number(value) / totals[dataIndex] * 100 : 0;
              return kind === "total" ? Number(value).toFixed(1) : `${Number(value).toFixed(1)}\n(${share.toFixed(0)}%)`;
            },
          },
        })),
        {
          name: "柱顶合计",
          type: "bar" as const,
          data: totals,
          barMaxWidth: 38,
          barGap: "-100%",
          silent: true,
          z: 20,
          itemStyle: { color: "rgba(0,0,0,0)" },
          label: { show: true, position: "top" as const, distance: 8, color: "#161917", fontSize: 12, fontWeight: 700, formatter: ({ value }: { value: number }) => value.toFixed(1) },
        },
      ],
    });
    chartRef.current.dataset.ogvRenderedPeriod = view.periods.at(-1) ?? "";

    const drawAnnotations = () => {
      if (!showComparison) return setBracketAnnotations(chart, []);
      if (kind === "total") {
        const newValues = view.series.find((item) => item.name === "上新剧")!.values;
        return setBracketAnnotations(chart, [
          { previousIndex, currentIndex: latestIndex, previousValue: totals[previousIndex], currentValue: totals[latestIndex], label: pct(yoy(totals[latestIndex], totals[previousIndex])), level: 1, targetGap: 26, labelFontSize: 8 },
          { previousIndex, currentIndex: latestIndex, previousValue: Number(newValues[previousIndex]), currentValue: Number(newValues[latestIndex]), label: pct(yoy(Number(newValues[latestIndex]), Number(newValues[previousIndex]))), variant: "difference", arrowOffset: 28, labelFontSize: 8 },
        ]);
      }

      let lower = 0;
      const seriesByLegendOrder = ["芒果TV", "优酷", "腾讯视频", "爱奇艺"]
        .map((name) => view.series.find((item) => item.name === name))
        .filter((item): item is (typeof view.series)[number] => Boolean(item));
      const legendRows = [92, 157, 232, 307];
      const comparisons = seriesByLegendOrder.map((item, index) => {
        const current = Number(item.values[latestIndex] ?? 0);
        const previous = Number(item.values[previousIndex] ?? 0);
        const sourceIndex = view.series.findIndex((series) => series.name === item.name);
        lower = view.series.slice(0, sourceIndex).reduce((sum, series) => sum + Number(series.values[latestIndex] ?? 0), 0);
        const center = lower + current / 2;
        return {
          previousIndex,
          currentIndex: latestIndex,
          previousValue: center,
          currentValue: center,
          label: `同比 ${pct(yoy(current, previous))}`,
          variant: "sideLabel" as const,
          title: item.name,
          swatchColor: colors[item.name],
          labelFontSize: 8,
          labelY: legendRows[index],
        };
      });
      view.periods.forEach((_, dataIndex) => {
        let cumulative = 0;
        const smallSegments = view.series.flatMap((item) => {
          const value = Number(item.values[dataIndex] ?? 0);
          const center = cumulative + value / 2;
          cumulative += value;
          if ((item.name !== "优酷" && item.name !== "芒果TV") || value < .08) return [];
          const share = totals[dataIndex] ? value / totals[dataIndex] * 100 : 0;
          return [{ item, value, center, share }];
        }).sort((a, b) => b.center - a.center);
        smallSegments.forEach((segment, index) => comparisons.push({
          previousIndex: dataIndex,
          currentIndex: dataIndex,
          previousValue: segment.center,
          currentValue: segment.center,
          label: `${segment.value.toFixed(1)}\n(${segment.share.toFixed(0)}%)`,
          variant: "barCallout",
          color: colors[segment.item.name],
          labelFontSize: filter === "all" ? 7 : 8,
          labelYShift: index === 0 ? -7 : 8,
          arrowOffset: 25,
        }));
      });
      setBracketAnnotations(chart, comparisons);
    };

    requestAnimationFrame(drawAnnotations);
    const observer = new ResizeObserver(() => chartRef.current && resizeResponsiveChart(chart, chartRef.current, layoutSpec, () => requestAnimationFrame(drawAnnotations)));
    observer.observe(chartRef.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [filter, view]);

  return <div ref={chartRef} className="horizontal-drama-chart short-drama-chart" role="img" aria-label={kind === "total" ? "季度横屏短剧有效播放" : "分平台TOP50上新横屏短剧播放"} />;
}

function HorizontalShortDramaTrendContent({ filter }: { filter: QuarterFilter }) {
  const model = data.shortDrama;
  const currentIndex = model.periods.length - 1;
  const previousIndex = currentIndex - 4;
  const totalYoy = yoy(model.total.totals[currentIndex], model.total.totals[previousIndex]);
  const newSeries = model.total.series.find((item) => item.name === "上新剧")!;
  const otherSeries = model.total.series.find((item) => item.name === "其他")!;
  const newYoy = yoy(newSeries.values[currentIndex], newSeries.values[previousIndex]);
  const otherYoy = yoy(otherSeries.values[currentIndex], otherSeries.values[previousIndex]);
  const platformTotal = model.platform.series.reduce((sum, item) => sum + Number(item.values[currentIndex] ?? 0), 0);
  const previousPlatformTotal = model.platform.series.reduce((sum, item) => sum + Number(item.values[previousIndex] ?? 0), 0);
  const platformYoy = yoy(platformTotal, previousPlatformTotal);
  const platformChanges = Object.fromEntries(model.platform.series.map((item) => [item.name, yoy(item.values[currentIndex], item.values[previousIndex])]));
  const body = `26Q2 横屏短剧有效播放 ${model.total.totals[currentIndex]!.toFixed(1)} 亿，同比 ${pct(totalYoy)}；其中上新剧 ${Number(newSeries.values[currentIndex]).toFixed(1)} 亿，同比 ${pct(newYoy)}，其他内容同比 ${pct(otherYoy)}。分平台 TOP50 上新播放 ${platformTotal.toFixed(1)} 亿，同比 ${pct(platformYoy)}；爱奇艺同比 ${pct(platformChanges["爱奇艺"])}，腾讯、优酷分别同比 ${pct(platformChanges["腾讯视频"])}、${pct(platformChanges["优酷"])}。`;

  return <section className="horizontal-drama-efficiency horizontal-short-drama">
    <div className="horizontal-drama-lead">
      <div className="horizontal-drama-subhead"><span>03</span><h4>横屏短剧大盘趋势</h4></div>
      <EditableInsight lead="短剧大盘回升" body="但主要由爱奇艺头部定制的《灵魂摆渡·十年》带动，其他内容水位较低。" highlights={["《灵魂摆渡·十年》"]} storageKey="ogv-market-review:26q2:horizontal-short-drama" />
    </div>
    <div className="horizontal-drama-charts asymmetric-platform-charts">
      <article className="horizontal-drama-panel"><header><h5>byQ 横屏短剧有效播放（亿）</h5></header><ShortDramaChart kind="total" filter={filter} /></article>
      <article className="horizontal-drama-panel"><header><h5>byQ 分平台 TOP50 上新横屏短剧播放（亿）</h5></header><ShortDramaChart kind="platform" filter={filter} /></article>
    </div>
    <p className="horizontal-drama-source">数据来源：{data.source}</p>
    <ShortDramaTopSeries filter={filter} />
  </section>;
}

export function HorizontalShortDramaTrend({ filter }: { filter: QuarterFilter }) {
  data = usePublishedDrama(fallbackData);
  return <HorizontalShortDramaTrendContent key={JSON.stringify(data)} filter={filter} />;
}
