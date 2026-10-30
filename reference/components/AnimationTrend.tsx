"use client";

import * as echarts from "echarts";
import { useEffect, useMemo, useRef, useState } from "react";
import fallbackData from "../data/animationTrend.json";
import fallbackVvRankingData from "../data/animationVvRanking.json";
import { AnimationProjectShare } from "./AnimationProjectShare";
import fallbackTop50Data from "../data/animationTop50.json";
import { usePublishedAnimation, usePublishedAnimationRanking, usePublishedAnimationTop50 } from "./usePublishedCategoryReports";
import { EditableInsight } from "./EditableInsight";
import { HideIn26Q3 } from "./ReportQuarterVisibility";
import { type BracketComparison, setBracketAnnotations } from "./chartBrackets";
import { getChartLayout, resizeResponsiveChart } from "./chartResponsive";

type QuarterFilter = "Q1" | "Q2" | "Q3" | "Q4" | "all";
type ChartKind = "total" | "japanese" | "chinese";
let data: any = fallbackData;
let vvRankingData: any = fallbackVvRankingData;
let top50Data: any = fallbackTop50Data;

const categoryColors: Record<string, string> = { 其他: "#385577", 国创: "#b7d9ea", 日番: "#ed8f8b" };
const platformColors: Record<string, string> = { 优酷: "#89D8F0", 爱奇艺: "#C0D688", 腾讯视频: "#A9BACF", bilibili: "#D99AAF" };
const legendOrder: Record<ChartKind, string[]> = {
  total: ["日番", "国创", "其他"],
  japanese: ["bilibili", "腾讯视频", "爱奇艺", "优酷"],
  chinese: ["bilibili", "腾讯视频", "爱奇艺", "优酷"],
};
const pct = (current: number, previous: number) => previous ? `${current >= previous ? "+" : ""}${((current / previous - 1) * 100).toFixed(0)}%` : "–";

type ComicOverlapKind = "bilibili" | "kuaikan";
const comicOverlapData = {
  periods: ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"],
  bilibili: { core: "哔哩哔哩漫画", red: [76, 77, 81, 85, 88, 89], coreLabels: [24, 23, 18, 15, 12, 11], overlap: [.4, .5, .4, .4, .4, .4], users: [11.90, 14.76, 13.69, 13.24, 16.84, 19.80] },
  kuaikan: { core: "快看漫画", red: [72, 75, 79, 83, 86, 88], coreLabels: [27, 25, 20, 16, 14, 11], overlap: [1.0, 1.0, .8, .8, .9, .8], users: [29.02, 31.00, 26.22, 26.84, 40.29, 41.23] },
};

function ComicOverlapChart({ kind }: { kind: ComicOverlapKind }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const source = comicOverlapData[kind];
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" });
    const layoutSpec = { left: 42, right: 18, top: 34, bottom: 68, variant: "plain" as const, minRight: 18 };
    const coreValues = source.red.map((value, index) => 100 - value - source.overlap[index]);
    chart.setOption({
      animationDuration: 420,
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
      grid: getChartLayout(ref.current.clientWidth, layoutSpec).grid,
      legend: { bottom: 14, data: ["红果免费漫剧独占", "重合", `${source.core}独占`], itemWidth: 11, itemHeight: 11, textStyle: { color: "#58615b", fontSize: 10 } },
      xAxis: { type: "category", data: comicOverlapData.periods, axisTick: { show: false }, axisLine: { lineStyle: { color: "#aeb7b0" } }, axisLabel: { color: "#66736b", fontSize: 10, margin: 13 } },
      yAxis: { type: "value", min: 0, max: 100, interval: 20, axisLabel: { color: "#7b8780", fontSize: 9, formatter: "{value}%" }, splitLine: { lineStyle: { color: "#e4e7e4" } } },
      series: [
        { name: "红果免费漫剧独占", type: "bar", stack: "total", data: source.red, barMaxWidth: 58, itemStyle: { color: "#e66757" }, label: { show: true, position: "inside", color: "#fff", fontSize: 11, fontWeight: 700, formatter: "{c}%" } },
        { name: "重合", type: "bar", stack: "total", data: source.overlap, barMaxWidth: 58, itemStyle: { color: "#648ce0" }, label: { show: false } },
        { name: `${source.core}独占`, type: "bar", stack: "total", data: coreValues, barMaxWidth: 58, itemStyle: { color: "#5eb16e" }, label: { show: true, position: "inside", color: "#fff", fontSize: 11, fontWeight: 700, formatter: ({ dataIndex }: { dataIndex: number }) => `${source.coreLabels[dataIndex]}%` } },
      ],
    });
    const drawLabels = () => {
      const graphics = comicOverlapData.periods.map((_, index) => {
        const point = chart.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [index, source.red[index] + source.overlap[index] / 2]);
        if (!Array.isArray(point)) return null;
        return { id: `comic-overlap-${kind}-${index}`, type: "text", silent: true, z: 100, style: { x: point[0], y: point[1], text: `${source.users[index].toFixed(2)}万 / ${source.overlap[index].toFixed(1)}%`, fill: "#648ce0", font: "700 10px sans-serif", textAlign: "center", textVerticalAlign: "middle", backgroundColor: "#fbfcf9", borderColor: "#648ce0", borderWidth: 1, borderRadius: 2, padding: [2, 3] } };
      }).filter(Boolean);
      chart.setOption({ graphic: graphics }, { replaceMerge: ["graphic"], silent: true });
    };
    requestAnimationFrame(drawLabels);
    const observer = new ResizeObserver(() => ref.current && resizeResponsiveChart(chart, ref.current, layoutSpec, drawLabels));
    observer.observe(ref.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [kind, top50Data]);
  return <div ref={ref} className="animation-comic-overlap-chart" role="img" aria-label={kind === "bilibili" ? "红果漫剧与哔哩哔哩漫画用户重合度" : "红果漫剧与快看漫画用户结构"} />;
}

function AnimationComicOverlap() {
  return <section className="animation-comic-overlap-section">
    <div className="horizontal-drama-lead">
      <EditableInsight
        lead="从用户重合情况看，漫剧对动画核心用户的直接分流相对有限"
        body="以B漫、快看漫画用户作为核心二次元人群代表，红果免费漫剧对该人群的渗透率较低，重合用户占比不足1%。"
        highlights={["直接分流相对有限", "重合用户占比不足1%"]}
        storageKey="ogv-market-review:26q2:animation-comic-overlap-v1"
      />
    </div>
    <div className="animation-comic-overlap-grid">
      <article className="horizontal-drama-panel"><header><h5>红果漫剧 vs 哔哩哔哩漫画用户重合度</h5></header><ComicOverlapChart kind="bilibili" /></article>
      <article className="horizontal-drama-panel"><header><h5>红果漫剧 vs 快看漫画用户结构</h5></header><ComicOverlapChart kind="kuaikan" /></article>
    </div>
    <p className="horizontal-drama-source animation-source">注：云和数据对爱优腾存在高估、对 B 站存在低估。左图「 byQ 动画有效播放」为未修正云合数据；中图、右图的「分平台有效播放」均为站内播放修正后数据。<br />数据来源：云和数据，战略发展部分析。</p>
  </section>;
}

type VvTier = ">1kw" | "100-1kw" | "<100w";
type VvRankingItem = { period: string; name: string; value: number; tier: VvTier; platforms?: string };
const vvTiers: VvTier[] = [">1kw", "100-1kw", "<100w"];
const vvTierLabels: Record<VvTier, string> = { ">1kw": "头部｜> 1,000 万", "100-1kw": "腰部｜100–1,000 万", "<100w": "长尾｜< 100 万" };
const formatVv = (value: number) => value < 10000 ? "<1 万" : `${Math.round(value / 10000)} 万`;

function VvRankingPanel({ period, maxValue }: { period: string; maxValue: number }) {
  const rows = (vvRankingData as VvRankingItem[]).filter((item) => item.period.toUpperCase() === period.toUpperCase());
  const releaseCount = rows.length;
  return <article className="animation-vv-panel">
    <header className="animation-vv-panel-head"><div><strong>{period} 国创长片新作</strong><span>按集均 VV 从高到低</span></div><b>共上新 {releaseCount} 部</b></header>
    <div className="animation-vv-column-head"><span>剧名</span><span>集均 VV</span><span>播出平台</span></div>
    <div className="animation-vv-scroll" tabIndex={0} aria-label={`${period} 国创长片新作集均VV排序`}>
      {vvTiers.map((tier) => {
        const items = rows.filter((item) => item.tier === tier).sort((a, b) => b.value - a.value);
        return <section className={`animation-vv-tier animation-vv-tier-${tier.replace(/[^a-z0-9]/gi, "-")}`} key={tier}>
          <div className="animation-vv-tier-head"><strong>{vvTierLabels[tier]}</strong><span>{items.length} 部</span></div>
          {items.map((item, index) => <div className="animation-vv-row" key={`${period}-${item.name}`}>
            <span className="animation-vv-rank">{String(index + 1).padStart(2, "0")}</span>
            <span className="animation-vv-name" title={item.name}>{item.name}</span>
            <span className="animation-vv-bar-cell"><i style={{ width: `${Math.max(1, item.value / maxValue * 100)}%` }} /></span>
            <strong className="animation-vv-value">{formatVv(item.value)}</strong>
            <span className="animation-vv-platforms" aria-label={item.platforms || "平台待补"}>{item.platforms ? [["B站", "bilibili", "bilibili.png"], ["爱奇艺", "iqiyi", "iqiyi.png"], ["腾讯", "tencent", "tencent-video.png"], ["优酷", "youku", "youku.png"]].filter(([name, alias]) => item.platforms!.toLowerCase().includes(name.toLowerCase()) || item.platforms!.toLowerCase().includes(alias)).map(([name,,logo]) => <img key={name} src={`/ogv/platform-logos/${logo}`} alt={name} title={name}/>) : "—"}</span>
          </div>)}
        </section>;
      })}
    </div>
  </article>;
}

function VvRankingModule({ filter }: { filter: QuarterFilter }) {
  const latest = [...new Set((vvRankingData as VvRankingItem[]).map((item) => item.period.toUpperCase()))].filter(period => filter === "all" || period.endsWith(filter)).sort().at(-1);
  if (!latest) return <div className="animation-supply-empty">当前季度暂无新作排名数据</div>;
  const previousYear = `${Number(latest.slice(0, 2)) - 1}${latest.slice(2)}`;
  const maxValue = Math.max(1, ...(vvRankingData as VvRankingItem[]).filter(item => [previousYear, latest].includes(item.period.toUpperCase())).map(item => item.value));
  return <section className="animation-vv-followup">
    <div className="horizontal-drama-lead">
      <EditableInsight
        lead="玄幻、奇幻是新作主要题材；长线 IP 续作占据新作主力，纯新 IP 难突围"
        body="新作中还是稳定能产生头部爆款，26Q2 与 25Q2 均有 3 部千万级播放新作，但腰尾部内容水位持续下降。"
        highlights={["均有 3 部", "明显断层", "长尾项目数量较多"]}
        storageKey="ogv-market-review:26q2:animation-vv-ranking-v1"
      />
    </div>
    <div className="animation-vv-frame"><div className="animation-vv-quarter-grid"><VvRankingPanel period={previousYear} maxValue={maxValue} /><VvRankingPanel period={latest} maxValue={maxValue} /></div></div>
  </section>;
}

type Top50ChartKind = "platform" | "structure";
const top50StructureColors: Record<string, string> = { "TOP11–50": "#b7d9ea", TOP10: "#385577" };

function Top50Chart({ kind, top50Data }: { kind: Top50ChartKind; top50Data: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" });
    const source = kind === "platform" ? top50Data.platform : top50Data.structure;
    const order = kind === "platform" ? ["腾讯视频", "bilibili", "优酷", "爱奇艺"] : ["TOP10", "TOP11–50"];
    const colors = kind === "platform" ? platformColors : top50StructureColors;
    const renderSeries = [...order].reverse();
    const totals = source.periods.map((_, index) => order.reduce((sum, name) => sum + Number(source.series.find((item) => item.name === name)?.values[index] ?? 0), 0));
    const layoutSpec = { left: 42, right: kind === "platform" ? 94 : 88, top: 68, bottom: 42, variant: "right-legend" as const, minRight: kind === "platform" ? 94 : 88 };
    chart.setOption({
      animationDuration: 420,
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (value: number) => `${Number(value).toFixed(1)} 亿` },
      grid: getChartLayout(ref.current.clientWidth, layoutSpec).grid,
      xAxis: { type: "category", data: source.periods, axisTick: { show: false }, axisLine: { lineStyle: { color: "#aeb7b0" } }, axisLabel: { color: "#737c76", fontSize: 10 } },
      yAxis: { type: "value", name: "亿", nameTextStyle: { color: "#737c76", fontSize: 9 }, axisLabel: { color: "#737c76", fontSize: 9 }, splitLine: { lineStyle: { color: "#e4e7e4" } } },
      series: [
        ...renderSeries.map((name) => {
          const item = source.series.find((entry) => entry.name === name)!;
          return { name, type: "bar" as const, stack: "total", data: item.values, barMaxWidth: 54, itemStyle: { color: colors[name] }, label: { show: true, position: "inside" as const, color: name === "TOP10" || name === "腾讯视频" ? "#fff" : "#263038", fontSize: 9, formatter: ({ value, dataIndex }: { value: number; dataIndex: number }) => kind === "platform" && value < 4.5 ? "" : value < 1 ? "" : `${value.toFixed(1)}\n(${(value / totals[dataIndex] * 100).toFixed(0)}%)` } };
        }),
        { name: "柱顶合计", type: "bar", data: totals, barMaxWidth: 54, barGap: "-100%", silent: true, z: 20, itemStyle: { color: "transparent" }, label: { show: true, position: "top", distance: 7, color: "#161917", fontSize: 11, fontWeight: 700, formatter: ({ value }: { value: number }) => value.toFixed(1) } },
      ],
    });
    const draw = () => {
      if (source.periods.length < 2) return setBracketAnnotations(chart, []);
      const comparisons: BracketComparison[] = [{ previousIndex: 0, currentIndex: 1, previousValue: totals[0], currentValue: totals[1], label: pct(totals[1], totals[0]), targetGap: 26, labelFontSize: 8 }];
      order.forEach((name, index) => {
        const item = source.series.find((entry) => entry.name === name)!;
        comparisons.push({ previousIndex: 0, currentIndex: 1, previousValue: item.values[1], currentValue: item.values[1], variant: "sideLabel", title: name, label: `同比 ${pct(item.values[1], item.values[0])}`, swatchColor: colors[name], labelFontSize: 8, labelY: 88 + index * (kind === "platform" ? 52 : 74), legendWidth: kind === "platform" ? 90 : 84, legendRightInset: 0 });
      });
      if (kind === "platform") source.periods.forEach((_, dataIndex) => {
        const small = renderSeries.map((name, seriesIndex) => ({ name, seriesIndex, item: source.series.find((entry) => entry.name === name)! })).filter(({ item }) => item.values[dataIndex] > 0 && item.values[dataIndex] < 4.5);
        small.forEach(({ name, seriesIndex, item }, smallIndex) => {
          const value = item.values[dataIndex];
          const lower = renderSeries.slice(0, seriesIndex).reduce((sum, lowerName) => sum + (source.series.find((entry) => entry.name === lowerName)?.values[dataIndex] ?? 0), 0);
          const shiftByPlatform: Record<string, number> = { bilibili: -18, 优酷: 14, 爱奇艺: -8 };
          const elbowByPlatform: Record<string, number> = { bilibili: 35, 优酷: 31, 爱奇艺: 29 };
          comparisons.push({ previousIndex: dataIndex, currentIndex: dataIndex, previousValue: lower + value / 2, currentValue: lower + value / 2, label: `${value.toFixed(1)}\n(${(value / totals[dataIndex] * 100).toFixed(0)}%)`, variant: "barCallout", color: colors[name], labelFontSize: 8, labelYShift: shiftByPlatform[name] ?? (smallIndex * 12), arrowOffset: elbowByPlatform[name] ?? 31, barHalfWidth: 27 });
        });
      });
      setBracketAnnotations(chart, comparisons);
    };
    requestAnimationFrame(draw);
    const observer = new ResizeObserver(() => ref.current && resizeResponsiveChart(chart, ref.current, layoutSpec, draw));
    observer.observe(ref.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [kind, top50Data]);
  return <div ref={ref} className="animation-top50-chart" role="img" aria-label={kind === "platform" ? "TOP50国创分平台有效播放" : "TOP50国创有效播放结构"} />;
}

function Top10DetailTable({ top50Data }: { top50Data: any }) {
  const [previousPeriod, currentPeriod] = top50Data.top10Periods ?? ["25Q2", "26Q2"];
  return <div className="animation-top10-table-wrap">
    <div className="animation-top10-table" role="table" aria-label={`${currentPeriod}国创长片TOP10播放明细`}>
      <div className="animation-top10-row animation-top10-head" role="row"><span>排名</span><span>剧名</span><span>{currentPeriod}</span><span>{previousPeriod}</span><span>同比</span></div>
      {top50Data.top10.map((item: { name: string; current: number; previous: number | null }, index: number) => <div className="animation-top10-row" role="row" key={item.name}>
        <span>{String(index + 1).padStart(2, "0")}</span><strong title={item.name}>{item.name}</strong><span>{(item.current / 100000000).toFixed(1)} 亿</span><span>{item.previous == null ? "—" : `${(item.previous / 100000000).toFixed(1)} 亿`}</span><b className={item.previous != null && item.current < item.previous ? "negative" : ""}>{item.previous == null ? "新上榜" : pct(item.current, item.previous)}</b>
      </div>)}
    </div>
  </div>;
}

function Top50Module({ filter }: { filter: QuarterFilter }) {
  const top50Data = usePublishedAnimationTop50(fallbackTop50Data, filter);
  const currentPeriod = top50Data.top10Periods?.[1];
  const [expandedTop50, setExpandedTop50] = useState(false);
  useEffect(() => { const p = new URLSearchParams(window.location.search); setExpandedTop50(p.get("conclusion") === "26Q3" || p.get("preview") === "animation"); }, []);
  return <section className="animation-top50-section">
    <div className="horizontal-drama-lead">
      <div className="horizontal-drama-subhead"><span>03</span><h4>国创 TOP50 下拆</h4></div>
      <EditableInsight
        lead="TOP50 国创长片有效播放跌幅超大盘，同比 -20% vs 国创大盘同比 -12%"
        body="进一步下拆发现下滑主要由 TOP11–50 内容贡献，国创用户消费进一步向少数长线头部内容集中。分平台看，腾讯头部老作播放下滑，新进榜多为腰尾部，内容补位不足；B站《凡人修仙传》《牧神记》持续增长，但其他头部内容播放水位下降；优酷头部内容池相比去年明显扩容，《光阴之外》等多部内容进入 TOP50，长线 IP《沧元图》《师兄啊师兄》播放也大幅提升。"
        highlights={["64.8 亿", "下降 20%", "41.0 亿", "下降 15%", "28%", "提升至 63%", "43.9 亿", "下降 32%", "11.9 亿", "7.1 亿"]}
        storageKey="ogv-market-review:26q2:animation-top50-v1"
      />
    </div>
    <div className={`animation-top50-grid${expandedTop50 ? " animation-top50-summary-pair" : ""}`}>
      <article className="horizontal-drama-panel"><header><h5>TOP50 国创分平台有效播放（亿）</h5></header><Top50Chart kind="platform" top50Data={top50Data} /></article>
      <article className="horizontal-drama-panel"><header><h5>TOP50 国创有效播放（亿）</h5></header><Top50Chart kind="structure" top50Data={top50Data} /></article>
      {!expandedTop50 && <article className="horizontal-drama-panel"><header><h5>{currentPeriod ?? "当前季度"} TOP10 播放明细</h5></header>{currentPeriod ? <Top10DetailTable top50Data={top50Data} /> : <div className="animation-supply-empty">当前季度暂无 TOP10 数据</div>}</article>}
    </div>
    {expandedTop50 && currentPeriod && <AnimationProjectShare currentPeriod={currentPeriod} />}
    <p className="horizontal-drama-source animation-source">注：B 站播放已用站内数据修正；播放的颜色条按播出平台区分。数据来源：云和数据，战略发展部分析。</p>
  </section>;
}

function AnimationChart({ kind, filter }: { kind: ChartKind; filter: QuarterFilter }) {
  const ref = useRef<HTMLDivElement>(null);
  const view = useMemo(() => {
    const indexes = data.periods
      .map((period, index) => ({ period, index }))
      .filter(({ period }) => period >= "24Q2" && (filter === "all" || period.endsWith(filter)));
    return {
      periods: indexes.map(({ period }) => period),
      series: data[kind].series.map((item) => ({ ...item, values: indexes.map(({ index }) => item.values[index]) })),
    };
  }, [filter, kind]);

  useEffect(() => {
    if (!ref.current || !view.periods.length) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" });
    const layoutSpec = { left: 40, right: 20, top: 82, bottom: 42, variant: "right-legend" as const, minRight: 20 };
    const colors = kind === "total" ? categoryColors : platformColors;
    const totals = view.periods.map((_, index) => view.series.reduce((sum, item) => sum + Number(item.values[index] ?? 0), 0));
    chart.setOption({
      animationDuration: 420,
      legend: [0, 1].map(row => ({ top: row * 22, left: 16, orient: "horizontal", selectedMode: false, itemWidth: 9, itemHeight: 9, itemGap: 12, data: legendOrder[kind].slice(row * 2, row * 2 + 2), textStyle: { fontSize: 11, color: "#58615b", rich: { down: { color: "#c74337", fontSize: 11, fontWeight: 700 }, up: { color: "#161917", fontSize: 11, fontWeight: 700 } } }, formatter: (name: string) => {
        const item = view.series.find(entry => entry.name === name);
        const last = view.periods.length - 1;
        const displayName = name === "bilibili" ? "B站" : name === "腾讯视频" ? "腾讯" : name;
        if (!item || filter === "all" || last < 1) return displayName;
        const current = Number(item.values[last]), previous = Number(item.values[last - 1]);
        return `${displayName} {${current < previous ? "down" : "up"}|同比 ${pct(current, previous)}}`;
      } })),
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (value: number) => `${Number(value).toFixed(1)} 亿` },
      grid: getChartLayout(ref.current.clientWidth, layoutSpec).grid,
      xAxis: { type: "category", data: view.periods, axisTick: { show: false }, axisLine: { lineStyle: { color: "#aeb7b0" } }, axisLabel: { color: "#737c76", fontSize: 9, interval: filter === "all" ? 3 : 0 } },
      yAxis: { type: "value", name: "亿", nameTextStyle: { color: "#737c76", fontSize: 9 }, axisLabel: { color: "#737c76", fontSize: 9 }, splitLine: { lineStyle: { color: "#e4e7e4" } } },
      series: [
        ...view.series.map((item) => ({
          name: item.name,
          type: "bar" as const,
          stack: "total",
          data: item.values,
          barMaxWidth: 36,
          itemStyle: { color: colors[item.name] },
          label: {
            show: filter !== "all",
            position: "inside" as const,
            color: item.name === "其他" || item.name === "腾讯视频" ? "#fff" : "#263038",
            fontSize: 8,
            formatter: ({ value, dataIndex }: { value: number; dataIndex: number }) => value < 2.5 ? "" : `${value.toFixed(0)}\n(${(value / totals[dataIndex] * 100).toFixed(0)}%)`,
          },
        })),
        { name: "柱顶合计", type: "bar", data: totals, barMaxWidth: 36, barGap: "-100%", silent: true, z: 20, itemStyle: { color: "transparent" }, label: { show: true, position: "top", distance: 7, color: "#161917", fontSize: 10, fontWeight: 700, formatter: ({ value }: { value: number }) => value.toFixed(0) } },
      ],
    });

    const draw = () => {
      const currentIndex = view.periods.length - 1;
      const previousIndex = currentIndex - 1;
      if (filter === "all" || previousIndex < 0) return setBracketAnnotations(chart, []);
      const comparisons: BracketComparison[] = [{
        previousIndex, currentIndex,
        previousValue: totals[previousIndex], currentValue: totals[currentIndex],
        label: pct(totals[currentIndex], totals[previousIndex]), targetGap: 24, labelFontSize: 8,
      }];
      setBracketAnnotations(chart, comparisons);
    };
    requestAnimationFrame(draw);
    const observer = new ResizeObserver(() => ref.current && resizeResponsiveChart(chart, ref.current, layoutSpec, draw));
    observer.observe(ref.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [filter, kind, view]);

  return <div ref={ref} className="animation-chart" role="img" aria-label={kind === "total" ? "动画有效播放分品类" : kind === "japanese" ? "分平台日番有效播放" : "分平台国创有效播放"} />;
}

function NewReleaseChart({ filter }: { filter: QuarterFilter }) {
  const ref = useRef<HTMLDivElement>(null);
  const view = useMemo(() => {
    const matching = data.newRelease.periods.map((period, index) => ({ period, index })).filter(({ period }) => filter === "all" || period.endsWith(filter));
    const latestYear = Number(matching.at(-1)?.period.slice(0, 2));
    const indexes = matching.filter(({ period }) => Number(period.slice(0, 2)) >= latestYear - 2);
    return {
      periods: indexes.map(({ period }) => period),
      series: data.newRelease.series.map((item) => ({ ...item, values: indexes.map(({ index }) => item.values[index]) })),
    };
  }, [filter]);

  useEffect(() => {
    if (!ref.current || !view.periods.length) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" });
    const layoutSpec = { left: 42, right: 100, top: 66, bottom: 42, variant: "right-legend" as const, minRight: 100 };
    const totals = view.periods.map((_, index) => view.series.reduce((sum, item) => sum + Number(item.values[index] ?? 0), 0));
    chart.setOption({
      animationDuration: 420,
      tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (value: number) => `${Number(value).toFixed(2)} 亿` },
      grid: getChartLayout(ref.current.clientWidth, layoutSpec).grid,
      xAxis: { type: "category", data: view.periods, axisTick: { show: false }, axisLine: { lineStyle: { color: "#aeb7b0" } }, axisLabel: { color: "#737c76", fontSize: 10 } },
      yAxis: { type: "value", name: "亿", nameTextStyle: { color: "#737c76", fontSize: 9 }, axisLabel: { color: "#737c76", fontSize: 9 }, splitLine: { lineStyle: { color: "#e4e7e4" } } },
      series: [
        ...view.series.map((item) => ({
          name: item.name, type: "bar" as const, stack: "total", data: item.values, barMaxWidth: 48,
          itemStyle: { color: platformColors[item.name] },
          label: { show: true, position: "inside" as const, color: "#263038", fontSize: 9, formatter: ({ value, dataIndex }: { value: number; dataIndex: number }) => item.name !== "bilibili" && value < 2 ? "" : value <= 0 ? "" : `${value.toFixed(1)}\n(${(value / totals[dataIndex] * 100).toFixed(0)}%)` },
        })),
        { name: "柱顶合计", type: "bar", data: totals, barMaxWidth: 48, barGap: "-100%", silent: true, z: 20, itemStyle: { color: "transparent" }, label: { show: true, position: "top", distance: 7, color: "#161917", fontSize: 11, fontWeight: 700, formatter: ({ value }: { value: number }) => value.toFixed(1) } },
      ],
    });
    const draw = () => {
      const currentIndex = view.periods.length - 1;
      const previousIndex = currentIndex - 1;
      if (previousIndex < 0) return setBracketAnnotations(chart, []);
      const comparisons: BracketComparison[] = [{ previousIndex, currentIndex, previousValue: totals[previousIndex], currentValue: totals[currentIndex], label: pct(totals[currentIndex], totals[previousIndex]), targetGap: 24, labelFontSize: 8 }];
      ["腾讯视频", "bilibili", "优酷", "爱奇艺"].forEach((name, index) => {
        const item = view.series.find((entry) => entry.name === name);
        if (!item) return;
        comparisons.push({ previousIndex, currentIndex, previousValue: Number(item.values[currentIndex]), currentValue: Number(item.values[currentIndex]), variant: "sideLabel", title: name, label: `同比 ${pct(Number(item.values[currentIndex]), Number(item.values[previousIndex]))}`, swatchColor: platformColors[name], labelFontSize: 8, labelY: 84 + index * 54, legendWidth: 96, legendRightInset: 0 });
      });
      view.periods.forEach((_, dataIndex) => {
        const small = view.series.map((item, seriesIndex) => ({ item, seriesIndex })).filter(({ item }) => item.name !== "bilibili" && Number(item.values[dataIndex]) > 0 && Number(item.values[dataIndex]) < 2);
        small.forEach(({ item, seriesIndex }, smallIndex) => {
          const value = Number(item.values[dataIndex]);
          const lower = view.series.slice(0, seriesIndex).reduce((sum, entry) => sum + Number(entry.values[dataIndex] ?? 0), 0);
          const shiftByPlatform: Record<string, number> = { 优酷: -34, 爱奇艺: -8 };
          const elbowByPlatform: Record<string, number> = { 优酷: 31, 爱奇艺: 28 };
          comparisons.push({ previousIndex: dataIndex, currentIndex: dataIndex, previousValue: lower + value / 2, currentValue: lower + value / 2, label: `${value.toFixed(1)} (${(value / totals[dataIndex] * 100).toFixed(0)}%)`, variant: "barCallout", color: platformColors[item.name], labelFontSize: 8, labelYShift: shiftByPlatform[item.name] ?? (smallIndex * 10), arrowOffset: elbowByPlatform[item.name] ?? 29, barHalfWidth: 24 });
        });
      });
      setBracketAnnotations(chart, comparisons);
    };
    requestAnimationFrame(draw);
    const observer = new ResizeObserver(() => ref.current && resizeResponsiveChart(chart, ref.current, layoutSpec, draw));
    observer.observe(ref.current);
    return () => { observer.disconnect(); chart.dispose(); };
  }, [view]);

  if (!view.periods.length) return <div className="animation-new-release-empty">当前季度暂无有效播放数据</div>;
  return <div ref={ref} className="animation-new-release-chart" role="img" aria-label="国创长片新作分平台有效播放" />;
}

function SupplyPanel({ filter }: { filter: QuarterFilter }) {
  const candidates = data.supply.filter((item) => filter === "all" || item.period.endsWith(filter));
  const current = candidates.at(-1);
  if (!current) return <div className="animation-supply-empty">当前季度暂无上新及独播数据</div>;
  const max = Math.max(...current.platforms.map((item) => item.exclusive + item.nonExclusive));
  return <div className="animation-supply" aria-label={`${current.period}分平台上新及独播数量`}>
    <div className="animation-supply-meta"><strong>{current.period}</strong><span>全网新片供给 {current.total} 部</span></div>
    <div className="animation-supply-head"><span>平台</span><span>独播内容举例</span><span>非独 / 独播</span></div>
    {[...current.platforms].sort((a, b) => ["腾讯视频", "爱奇艺", "bilibili", "优酷"].indexOf(a.name) - ["腾讯视频", "爱奇艺", "bilibili", "优酷"].indexOf(b.name)).map((item) => <div className="animation-supply-row" key={item.name}>
      <strong>{item.name}</strong>
      <div className="animation-supply-examples">{item.examples.length ? item.examples.map((example) => <span key={example}>{example}</span>) : <span>—</span>}</div>
      <div className="animation-supply-counts">
        <div className="animation-supply-bar" style={{ width: `${Math.max(18, (item.exclusive + item.nonExclusive) / max * 100)}%` }}>
          <i className="non-exclusive" style={{ flex: item.nonExclusive }}>{item.nonExclusive}</i>
          <i className="exclusive" style={{ flex: item.exclusive, background: platformColors[item.name] }}>{item.exclusive}</i>
        </div>
        <b>{item.exclusive + item.nonExclusive}</b>
      </div>
    </div>)}
  </div>;
}

function AnimationTrendContent() {
  const [filter, setFilter] = useState<QuarterFilter>((data.periods.at(-1)?.slice(-2) as QuarterFilter) || "Q2");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search), period = params.get("conclusion");
    if (!params.has("preview") && period && /^\d{2}Q[1-4]$/.test(period)) setFilter(period.slice(-2) as QuarterFilter);
  }, []);
  return <section className="horizontal-drama-trend animation-trend">
    <div className="horizontal-drama-lead">
      <div className="horizontal-drama-subhead"><span>01</span><h4>动画大盘趋势</h4></div>
      <EditableInsight
        lead="番剧"
        body={"23Q1 以来（有复盘数据以来）同比播放持续下跌，本季度下跌幅度（同比 -17%）与 25Q2（同比 -18%）相比略有收窄；分平台看，26Q1 各平台有效播放同比均有不同程度下跌，B 站下跌幅度最小。\n国创：24Q2 以来连续 9 个季度同比播放下跌，本季度下跌幅度（同比 -25%）较 25Q1（同比 -15%）大幅扩大；分平台看，26Q1 各平台有效播放同比均有不同程度下跌，优酷跌幅最小（同比 -2%），B 站跌幅第二小（同比 -12%），爱奇艺（同比 -22%）、腾讯（同比 -36%）跌幅明显。"}
        highlights={["国创："]}
        storageKey="ogv-market-review:26q2:animation-trend-v2"
      />
    </div>
    <div className="horizontal-drama-quarter-filter" aria-label="选择季度">
      <span>显示季度</span>
      {(["Q1", "Q2", "Q3", "Q4", "all"] as const).map((quarter) => <button key={quarter} type="button" className={filter === quarter ? "selected" : ""} aria-pressed={filter === quarter} onClick={() => setFilter(quarter)}>{quarter === "all" ? "全部" : quarter}</button>)}
    </div>
    <div className="animation-charts">
      <article className="horizontal-drama-panel"><header><h5>byQ 动画有效播放（亿）</h5></header><AnimationChart kind="total" filter={filter} /></article>
      <article className="horizontal-drama-panel"><header><h5>byQ 分平台日番有效播放（亿）</h5></header><AnimationChart kind="japanese" filter={filter} /></article>
      <article className="horizontal-drama-panel"><header><h5>byQ 分平台国创有效播放（亿）</h5></header><AnimationChart kind="chinese" filter={filter} /></article>
    </div>
    <p className="horizontal-drama-source animation-source">注：云和数据对爱优腾存在高估、对 B 站存在低估。左图「 byQ 动画有效播放」为未修正云合数据；中图、右图的「分平台有效播放」均为站内播放修正后数据。<br />数据来源：云和数据，战略发展部分析。</p>
    <HideIn26Q3><AnimationComicOverlap /></HideIn26Q3>
    <section className="animation-new-release-section">
      <div className="horizontal-drama-lead">
        <div className="horizontal-drama-subhead"><span>02</span><h4>国创长片新作下拆</h4></div>
        <EditableInsight
          lead="国创新作播放回落，腾讯贡献进一步提升"
          body="26Q2 国创长片新作腾讯视频贡献 5.2 亿，占比 82%，是主要播放来源。B站新作播放降至 0.7 亿，同比下降 82%。同期全网新片供给 27 部，腾讯独播 16 部，独播供给显著领先。"
          highlights={["6.3 亿", "下降 24%", "5.2 亿", "占比 82%", "0.7 亿", "下降 82%", "27 部", "独播 16 部"]}
          storageKey="ogv-market-review:26q2:animation-new-release-v1"
        />
      </div>
      <div className="animation-new-release-grid">
        <article className="horizontal-drama-panel"><header><h5>分平台有效播放（亿）</h5></header><NewReleaseChart filter={filter} /></article>
        <article className="horizontal-drama-panel"><header><h5>分平台上新及独播数量</h5></header><SupplyPanel filter={filter} /></article>
      </div>
      <p className="horizontal-drama-source animation-source">注：B 站播放已用站内数据修正；独播指内容只有单平台可播放，不代表真正有独播版权。数据来源：{data.source}。</p>
      <VvRankingModule filter={filter} />
    </section>
    <Top50Module filter={filter} />
  </section>;
}

export function AnimationTrend() {
  data = usePublishedAnimation(fallbackData);
  vvRankingData = usePublishedAnimationRanking(fallbackVvRankingData);
  top50Data = usePublishedAnimationTop50(fallbackTop50Data);
  return <AnimationTrendContent key={JSON.stringify([data, vvRankingData, top50Data])} />;
}
