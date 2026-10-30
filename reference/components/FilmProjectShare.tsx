"use client";

import fallbackData from "../data/filmProjectShare.json";
import { usePublishedFilmProject } from "./usePublishedCategoryReports";
import { EditableInsight } from "./EditableInsight";

type QuarterFilter = "Q1" | "Q2" | "Q3" | "Q4" | "all";
type FilmRow = {
  name: string;
  boxOffice: number | null;
  plays: number;
  shares: { bilibili: number | null; iqiyi: number | null; tencent: number | null; youku: number | null };
};

let data: any = fallbackData;
let periodData = data.periods as Record<string, FilmRow[]>;
const shareKeys = ["bilibili", "iqiyi", "tencent", "youku"] as const;
const shareMeta = {
  bilibili: { label: "B站", color: "#D99AAF" },
  iqiyi: { label: "爱奇艺", color: "#C0D688" },
  tencent: { label: "腾讯视频", color: "#A9BACF" },
  youku: { label: "优酷", color: "#89D8F0" },
};

function resolvePeriods(filter: QuarterFilter) {
  const selected = filter === "all" ? "Q2" : filter;
  const periods = Object.keys(periodData).filter((period) => period.endsWith(selected)).sort();
  return { previous: periods.length > 1 ? periods.at(-2) ?? null : null, latest: periods.at(-1) ?? null };
}

function formatNumber(value: number | null, digits = 2) {
  return value == null ? "—" : value.toFixed(digits);
}

function ShareBar({ row }: { row: FilmRow }) {
  return <div className="film-share-cell" aria-label={`${row.name}分平台播放份额`}>
    <div className="film-share-bar">{shareKeys.map((key) => {
      const value = row.shares[key] ?? 0;
      return value > 0 ? <i key={key} style={{ width: `${value * 100}%`, background: shareMeta[key].color }} title={`${shareMeta[key].label} ${(value * 100).toFixed(0)}%`} /> : null;
    })}</div>
    <span>{shareKeys.map((key) => `${shareMeta[key].label} ${row.shares[key] == null ? "—" : `${(row.shares[key]! * 100).toFixed(0)}%`}`).join(" · ")}</span>
  </div>;
}

function PeriodPanel({ period, side }: { period: string | null; side: "previous" | "latest" }) {
  const rows = period ? periodData[period] ?? [] : [];
  return <article className="horizontal-drama-panel film-project-panel">
    <header><div><h5>{period ?? "暂无数据"}</h5><span>{side === "previous" ? "上一年" : "最新"} · Top 50 院线电影</span></div></header>
    {rows.length ? <div className="film-project-table">
      <div className="film-project-row film-project-head"><span>电影名</span><span>播放（亿）</span><span>B / 爱 / 腾 / 优播放份额</span></div>
      {rows.map((row, index) => <div className="film-project-row" key={`${period}-${row.name}`}>
        <span className="film-project-name"><em>{String(index + 1).padStart(2, "0")}</em><b title={row.name}>{row.name}</b></span>
        <span className="film-project-number film-project-plays">{formatNumber(row.plays)}</span>
        <ShareBar row={row} />
      </div>)}
    </div> : <div className="film-project-empty">当前季度暂无可对比数据</div>}
  </article>;
}

function FilmProjectShareContent({ filter }: { filter: QuarterFilter }) {
  const { previous, latest } = resolvePeriods(filter);
  return <section className="horizontal-drama-efficiency film-project-share">
    <div className="horizontal-drama-lead"><div className="horizontal-drama-subhead"><span>03</span><h4>单项目份额</h4></div>
      <EditableInsight lead="B站覆盖面扩大" body="单片份额较高的仍为动画电影和海外片。" highlights={["动画电影和海外片"]} storageKey="ogv-market-review:26q2:film-project-share-v1"/>
    </div>
    <div className="film-share-legend">{shareKeys.map((key) => <span key={key}><i style={{ background: shareMeta[key].color }}/>{shareMeta[key].label}</span>)}</div>
    <div className="film-project-layout"><PeriodPanel period={previous} side="previous"/><PeriodPanel period={latest} side="latest"/></div>
    <p className="horizontal-drama-source film-project-source">数据范围：各季度院线电影播放 Top 50；数据来源：{data.source}。顶部季度按钮控制本模块展示。</p>
  </section>;
}

export function FilmProjectShare({ filter }: { filter: QuarterFilter }) {
  data = usePublishedFilmProject(fallbackData);
  periodData = data.periods as Record<string, FilmRow[]>;
  return <FilmProjectShareContent key={JSON.stringify(data)} filter={filter} />;
}
