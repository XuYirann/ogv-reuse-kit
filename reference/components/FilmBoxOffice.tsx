"use client";

import * as echarts from "echarts";
import { useEffect, useMemo, useRef, useState } from "react";
import fallbackData from "../data/filmBoxOffice.json";
import { usePublishedFilmBoxOffice } from "./usePublishedCategoryReports";
import { EditableInsight } from "./EditableInsight";
import { getChartLayout, resizeResponsiveChart } from "./chartResponsive";

import { reportEndPeriod } from "./reportPeriod";

type Preset = "1" | "3" | "custom";
let data: any = fallbackData;

function FilmBoxOfficeContent() {
  const chartRef = useRef<HTMLDivElement>(null);
  const lastIndex = data.periods.length - 1;
  const [startPeriod, setStartPeriod] = useState("23Q2");
  const [endPeriod, setEndPeriod] = useState(data.periods[lastIndex]);
  const [preset, setPreset] = useState<Preset>("custom");
  const startIndex = Math.max(0, data.periods.indexOf(startPeriod));
  const rawEndIndex = data.periods.indexOf(endPeriod);
  const endIndex = rawEndIndex < startIndex ? lastIndex : rawEndIndex;
  const view = useMemo(() => ({ periods: data.periods.slice(startIndex, endIndex + 1), values: data.values.slice(startIndex, endIndex + 1) }), [endIndex, startIndex]);
  const latestQuarter = view.periods.at(-1)?.slice(-2);

  useEffect(() => {
    setEndPeriod(reportEndPeriod(data.periods));
  }, [data.periods]);

  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current, undefined, { renderer: "svg" });
    const layoutSpec = { left: 50, right: 22, top: 38, bottom: 42, variant: "plain" as const };
    chart.setOption({
      animationDuration: 420,
      grid: getChartLayout(chartRef.current.clientWidth, layoutSpec).grid,
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (value: number) => `${Number(value).toFixed(1)} 亿` },
      xAxis: { type: "category", data: view.periods, axisTick: { show: false }, axisLine: { lineStyle: { color: "#aeb7b0" } }, axisLabel: { color: "#737c76", fontSize: 10, interval: 0 } },
      yAxis: { type: "value", name: "票房（亿）", nameTextStyle: { color: "#5f6862", fontSize: 10 }, axisLabel: { color: "#737c76", fontSize: 9 }, splitLine: { lineStyle: { color: "#e4e7e4" } } },
      series: [{ name: "院线电影票房", type: "bar", data: view.values, barMaxWidth: 44, itemStyle: { color: ({ dataIndex }: { dataIndex: number }) => view.periods[dataIndex].endsWith(latestQuarter) ? "#385577" : "#9eb3c9" }, label: { show: true, position: "top", distance: 6, color: "#263038", fontSize: 10, fontWeight: 650, formatter: ({ value }: { value: number }) => value.toFixed(0) } }],
    });
    const observer = new ResizeObserver(() => chartRef.current && resizeResponsiveChart(chart, chartRef.current, layoutSpec)); observer.observe(chartRef.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [latestQuarter, view]);

  const setRange = (years: 1 | 3) => {
    const quarters = years * 4;
    setStartPeriod(data.periods[Math.max(0, lastIndex - quarters + 1)]);
    setEndPeriod(data.periods[lastIndex]);
    setPreset(String(years) as Preset);
  };

  return <section className="horizontal-drama-efficiency film-box-office">
    <div className="horizontal-drama-lead"><div className="horizontal-drama-subhead"><span>04</span><h4>院线票房表现</h4></div>
      <EditableInsight lead="Q2票房同比修复，但仍未回到前期水位" body="26Q2 院线电影票房 54.8 亿，同比回升 13%；但仍处低位，后续线上新供给继续承压。" highlights={["54.8 亿","回升 13%","仍处低位"]} storageKey="ogv-market-review:26q2:film-box-office-v1"/>
    </div>
    <article className="horizontal-drama-panel film-box-office-panel">
      <header className="film-box-office-header"><div><h5>byQ 院线电影票房（亿）</h5><span>默认展示 23Q2 至今</span></div>
        <div className="duration-controls chart-controls-compact film-box-office-controls">
          <div className="range-buttons" aria-label="票房时间范围"><button className={preset === "1" ? "selected" : ""} type="button" onClick={() => setRange(1)}>近 1 年</button><button className={preset === "3" ? "selected" : ""} type="button" onClick={() => setRange(3)}>近 3 年</button></div>
          <div className="quarter-controls"><label>开始<select value={startPeriod} onChange={(event) => { setStartPeriod(event.target.value); setPreset("custom"); }}>{data.periods.slice(0, endIndex + 1).map((period) => <option key={period}>{period}</option>)}</select></label><label>结束<select value={endPeriod} onChange={(event) => { setEndPeriod(event.target.value); setPreset("custom"); }}>{data.periods.slice(startIndex).map((period) => <option key={period}>{period}</option>)}</select></label></div>
        </div>
      </header>
      <div ref={chartRef} className="film-box-office-chart" role="img" aria-label={`${startPeriod}至${endPeriod}院线电影票房季度柱状图`}/>
      <div className="chart-meta"><p className="chart-hint">悬停查看季度票房。</p><p className="chart-source">数据来源：{data.source}</p></div>
    </article>
  </section>;
}

export function FilmBoxOffice() {
  data = usePublishedFilmBoxOffice(fallbackData);
  return <FilmBoxOfficeContent key={JSON.stringify(data)} />;
}
