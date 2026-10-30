"use client";

import { useEffect, useState } from "react";
import { EditableInsight } from "./EditableInsight";
import { usePublishedDramaTop } from "./usePublishedCategoryReports";

type LongSeries = {
  name: string;
  v30: number;
  genre: string;
  platforms: string[];
};

type ShortSeries = {
  name: string;
  v30: number;
  genre: string;
  revenue: number | string;
  platforms?: string[];
};

function numericRevenue(value: ShortSeries["revenue"]): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = String(value).trim();
  return /^\d[\d,]*(?:\.\d+)?(?:\s*万)?$/.test(text) ? Number(text.replace(/[,万\s]/g, "")) : null;
}

export type VisualRules = { platforms: { name: string; logo: string; aliases: string[] }[]; genres: { name: string; keywords: string[]; color: string }[] };
export const defaultVisualRules: VisualRules = {
  platforms: [
    { name: "爱奇艺", logo: "iqiyi.png", aliases: ["爱奇艺", "iQIYI"] },
    { name: "腾讯视频", logo: "tencent-video.png", aliases: ["腾讯视频", "腾讯"] },
    { name: "优酷", logo: "youku.png", aliases: ["优酷", "优酷视频", "YOUKU"] },
    { name: "芒果TV", logo: "mango-tv.png", aliases: ["芒果TV", "芒果"] },
    { name: "B站", logo: "bilibili.png", aliases: ["B站", "哔哩哔哩", "bilibili"] },
  ],
  genres: [
    { name: "爱情", keywords: ["爱情", "言情"], color: "#cf2863" },
    { name: "男频", keywords: ["爽剧", "逆袭", "神医", "金手指", "男频"], color: "#087d66" },
    { name: "古装喜剧", keywords: ["古装喜剧"], color: "#9b7215" },
    { name: "喜剧", keywords: ["喜剧"], color: "#bd4a30" },
    { name: "喜剧悬疑", keywords: ["喜剧悬疑", "悬疑喜剧"], color: "#bd4a30" },
    { name: "罪案", keywords: ["刑侦", "罪案", "犯罪", "悬疑", "推理"], color: "#237b88" },
    { name: "非爱情古装", keywords: ["仙侠", "武侠", "玄幻", "古装", "古偶", "历史"], color: "#6068a8" },
    { name: "民国", keywords: ["民国"], color: "#a34d5b" },
    { name: "年代", keywords: ["年代", "近代"], color: "#927019" },
    { name: "现实", keywords: ["现实", "生活", "家庭"], color: "#247c9a" },
    { name: "主旋律", keywords: ["主旋律", "革命", "军旅"], color: "#ac453b" },
    { name: "奇幻", keywords: ["奇幻", "惊悚", "修仙"], color: "#7655a5" },
    { name: "综艺·明星社交", keywords: ["明星社交", "社交", "游戏"], color: "#087d66" },
    { name: "综艺·舞台竞演", keywords: ["舞台竞演", "竞演", "演技"], color: "#ac5632" },
    { name: "综艺·户外旅行", keywords: ["户外", "旅行"], color: "#247c9a" },
    { name: "综艺·恋爱", keywords: ["恋爱", "素人"], color: "#cf2863" },
  ],
};

const long25: LongSeries[] = [
  { name: "藏海传", v30: 4351, genre: "古装 × 男频逆袭", platforms: ["优酷"] },
  { name: "折腰", v30: 3266, genre: "古装 × 爱情", platforms: ["腾讯视频"] },
  { name: "临江仙", v30: 3239, genre: "古装 × 爱情", platforms: ["爱奇艺"] },
  { name: "无忧渡", v30: 2812, genre: "古装 × 爱情", platforms: ["爱奇艺"] },
  { name: "蛮好的人生", v30: 2585, genre: "现实生活", platforms: ["优酷"] },
  { name: "棋士", v30: 2583, genre: "悬疑 × 刑侦罪案", platforms: ["腾讯视频"] },
  { name: "乌云之上", v30: 2336, genre: "悬疑 × 刑侦罪案", platforms: ["爱奇艺"] },
  { name: "借命而生", v30: 1755, genre: "悬疑 × 刑侦罪案", platforms: ["爱奇艺"] },
  { name: "无尽的尽头", v30: 1725, genre: "悬疑 × 刑侦罪案", platforms: ["爱奇艺"] },
  { name: "淮水竹亭", v30: 1651, genre: "古装 × 爱情", platforms: ["爱奇艺"] },
];

const long26: LongSeries[] = [
  { name: "低智商犯罪", v30: 3888.71, genre: "悬疑 × 喜剧", platforms: ["爱奇艺"] },
  { name: "主角", v30: 3872.29, genre: "年代剧 × 女性成长", platforms: ["腾讯视频"] },
  { name: "蜜语纪", v30: 3471.39, genre: "都市 × 爱情", platforms: ["爱奇艺", "腾讯视频"] },
  { name: "月鳞绮纪", v30: 2399.84, genre: "古装 × 爱情", platforms: ["优酷"] },
  { name: "家业", v30: 1990.18, genre: "古装 × 爱情", platforms: ["爱奇艺"] },
  { name: "佳偶天成", v30: 1702.99, genre: "古装 × 爱情", platforms: ["腾讯视频", "爱奇艺"] },
  { name: "翘楚", v30: 1599.53, genre: "古装 × 爱情", platforms: ["腾讯视频"] },
  { name: "南部档案", v30: 1421.76, genre: "悬疑 × 奇幻", platforms: ["爱奇艺"] },
  { name: "白日提灯", v30: 1384.38, genre: "古装 × 爱情", platforms: ["腾讯视频"] },
  { name: "方圆八百米", v30: 1333.59, genre: "悬疑 × 刑侦罪案", platforms: ["腾讯视频"] },
];

const short25: ShortSeries[] = [
  { name: "彼岸灯塔", v30: 332, genre: "犯罪悬疑", revenue: 1200 },
  { name: "逆天成仙", v30: 285, genre: "逆袭修仙", revenue: 1200 },
  { name: "狮城山海", v30: 273, genre: "近代其他", revenue: "爱奇艺定制" },
  { name: "名不虚传", v30: 257, genre: "神医逆袭", revenue: 1100 },
  { name: "藏珠", v30: 235, genre: "古装爱情 / 伪骨科", revenue: 800 },
  { name: "我叫赵甲第之锋芒", v30: 221, genre: "都市逆袭", revenue: 700 },
  { name: "宫墙厌", v30: 208, genre: "古装爱情 / 小妈文学", revenue: 600 },
  { name: "我能预见成功率", v30: 194, genre: "金手指逆袭", revenue: 800 },
  { name: "麻衣神婿", v30: 190, genre: "复仇逆袭", revenue: 500 },
  { name: "权宠", v30: 165, genre: "古装爱情 / 女帝", revenue: 300 },
];

const short26: ShortSeries[] = [
  { name: "灵魂摆渡·十年", v30: 1257, genre: "奇幻惊悚", revenue: "爱奇艺定制" },
  { name: "她的罪名", v30: 366, genre: "犯罪悬疑", revenue: 1318 },
  { name: "憨婿", v30: 221, genre: "男频爽剧", revenue: 2000 },
  { name: "嫁金枝", v30: 214, genre: "古装爱情", revenue: 1000 },
  { name: "有港回信", v30: 196, genre: "都市爱情", revenue: 1000 },
  { name: "罪无可逃", v30: 190, genre: "犯罪悬疑", revenue: 700 },
  { name: "罪案痕迹", v30: 188, genre: "犯罪悬疑", revenue: 917 },
  { name: "婚后再心动", v30: 187, genre: "都市爱情", revenue: 600 },
  { name: "暴锋雨", v30: 159, genre: "犯罪悬疑", revenue: 600 },
  { name: "着迷", v30: 134, genre: "都市爱情", revenue: 1500 },
];

function genreClass(genre: string) {
  const primary = genre.trim().split(/[×xX/｜|·]/)[0].trim();
  if (/古装|古偶|仙侠|武侠|历史/.test(primary)) return "genre-costume";
  if (/都市|现代|爱情|言情/.test(primary)) return "genre-love";
  if (/悬疑|犯罪|刑侦|罪案|推理/.test(primary)) return "genre-suspense";
  if (/民国/.test(primary)) return "genre-republic";
  if (/年代|近代/.test(primary)) return "genre-period";
  if (/现实|生活|家庭/.test(primary)) return "genre-reality";
  if (/主旋律|革命|军旅/.test(primary)) return "genre-mainstream";
  if (/奇幻|惊悚|修仙/.test(primary)) return "genre-fantasy";
  if (/爽剧|逆袭|神医|金手指|男频/.test(primary)) return "genre-male";
  return "genre-other";
}

export function PlatformLogos({ platforms, rules }: { platforms: string[]; rules: VisualRules }) {
  const items = platforms.map((raw) => {
    const match = rules.platforms.find((rule) => rule.aliases.some((alias) => alias.trim().toLowerCase() === raw.trim().toLowerCase()));
    return { raw: raw.trim(), match };
  }).filter((item) => item.raw);
  if (!items.length) return <span className="top-series-platforms top-series-platforms-empty">—</span>;
  return <span className="top-series-platforms">{items.map(({ raw, match }, index) => match
    ? <img key={`${match.name}-${index}`} className={`platform-logo platform-logo-${match.name === "B站" ? "bilibili" : match.name}`} src={`platform-logos/${match.logo}`} alt={match.name} title={raw} />
    : <span key={`${raw}-${index}`} className="top-series-platform-unknown" title="未匹配到平台 logo">{raw}</span>
  )}</span>;
}

export function longGenreColor(genre: string, rules: VisualRules) {
  const matching = rules.genres.filter((rule) => rule.keywords.some((keyword) => keyword.trim() && genre.includes(keyword.trim())));
  const love = /爱情|言情/.test(genre)
    ? matching.find((rule) => rule.keywords.some((keyword) => /爱情|言情/.test(keyword)))
    : null;
  return (love || matching[0])?.color ?? "#697476";
}

function LongQuarter({ quarter, rows, rules, max, limit = 10 }: { quarter: string; rows: LongSeries[]; rules: VisualRules; max: number; limit?: number }) {
  return <article className="top-series-quarter">
    <h6>{quarter} TOP{limit}</h6>
    <div className={limit === 30 ? "top-series-long-scroll" : undefined}>
    <div className="top-series-grid top-series-grid-long top-series-grid-head"><span>剧名</span><span>集均 V30（万）</span><span>内容题材</span><span>播出平台</span></div>
    {rows.slice(0,limit).map((row, index) => <div className="top-series-grid top-series-grid-long top-series-row" key={`${quarter}-${row.name}`}>
      <span className="top-series-name film-project-name"><em>{String(index + 1).padStart(2, "0")}</em><b title={row.name}>{row.name}</b></span>
      <span className="top-series-bar-cell"><i style={{ width: `${Math.max(12, row.v30 / max * 62)}%` }} /><b>{Math.round(row.v30).toLocaleString("zh-CN")}</b></span>
      <span className="top-series-genre top-series-genre-chip" style={{ color: longGenreColor(row.genre, rules) }} title={row.genre}>{row.genre || "—"}</span>
      <PlatformLogos platforms={row.platforms} rules={rules} />
    </div>)}
    </div>
    {quarter === "26Q3" && <p className="top-series-quarter-note">注：《兰香如故》于 9 月 11 日上线，统计数据时未到完结时间，集均 V30 存在低估。</p>}
  </article>;
}

function ShortQuarter({ quarter, rows, rules, max, revenueMax }: { quarter: string; rows: ShortSeries[]; rules: VisualRules; max: number; revenueMax: number }) {
  return <article className="top-series-quarter">
    <h6>{quarter} TOP10</h6>
    <div className="top-series-grid top-series-grid-short top-series-grid-head"><span>剧名</span><span>集均 V30（万）</span><span>内容题材</span><span>分账金额（万）</span><span>播出平台</span></div>
    {rows.map((row) => {
      const revenue = numericRevenue(row.revenue);
      return <div className="top-series-grid top-series-grid-short top-series-row" key={`${quarter}-${row.name}`}>
      <span className="top-series-name">{row.name}</span>
      <span className="top-series-bar-cell"><i style={{ width: `${Math.max(10, row.v30 / max * 62)}%` }} /><b>{row.v30.toLocaleString("zh-CN")}</b></span>
      <span className="top-series-genre top-series-genre-chip" style={{ color: longGenreColor(row.genre, rules) }} title={row.genre}>{row.genre || "—"}</span>
      <span className={`top-series-revenue ${revenue !== null ? "top-series-revenue-heat" : "top-series-revenue-note"}`}
        style={revenue !== null ? { backgroundColor: `rgb(190 72 76 / ${0.14 + revenue / revenueMax * 0.28})` } : undefined}>
        {revenue !== null ? revenue.toLocaleString("zh-CN") : row.revenue || "—"}
      </span>
      <PlatformLogos platforms={row.platforms || []} rules={rules} />
    </div>})}
  </article>;
}

function LongDramaTopSeriesContent({ periods, rules, previous, current }: { periods: string[]; rules: VisualRules; previous: LongSeries[]; current: LongSeries[] }) {
  const max = Math.max(1, ...previous.map((row) => row.v30), ...current.map((row) => row.v30));
  const latest = periods[1] || "26Q2";
  const limit = latest >= "26Q3" ? 30 : 10;
  return <section className="top-series-part top-series-part-embedded">
      <div className="horizontal-drama-lead">
        <EditableInsight
          lead={`${latest} 头部题材观察`}
          body={latest === "26Q2" ? "古偶仍然是基本盘 5/10，但没有超级爆款；TOP2 两部都为主流题材 × 高口碑，悬疑喜剧《低智商犯罪》豆瓣评分 8.2；年代剧《主角》豆瓣评分 8.1。拼播仍然是趋势，TOP10 出现 2 部爱奇艺和腾讯的拼播作品。" : "本季榜单已更新，可在此填写当季观察。"}
          highlights={latest === "26Q2" ? ["3 部集均 V30 超过 3,000 万", "低于 25Q2"] : []}
          storageKey={`ogv-market-review:${latest.toLowerCase()}:horizontal-drama-top10`}
        />
      </div>
      <div className="top-series-evidence"><div className="top-series-quarters"><LongQuarter quarter={periods[0] || "25Q2"} rows={previous} rules={rules} max={max} limit={periods[0] === "25Q3" ? 10 : limit} /><LongQuarter quarter={periods[1] || "26Q2"} rows={current} rules={rules} max={max} limit={limit} /></div></div>
      <p className="horizontal-drama-source">数据来源：云和数据</p>
    </section>;
}

function ShortDramaTopSeriesContent({ periods, rules, previous, current }: { periods: string[]; rules: VisualRules; previous: ShortSeries[]; current: ShortSeries[] }) {
  const max = Math.max(1, ...previous.map((row) => row.v30), ...current.map((row) => row.v30));
  const revenueMax = Math.max(1, ...previous.map((row) => numericRevenue(row.revenue) ?? 0), ...current.map((row) => numericRevenue(row.revenue) ?? 0));
  const latest = periods[1] || "26Q2";
  return <section className="top-series-part top-series-part-embedded">
      <div className="horizontal-drama-lead">
        <EditableInsight
          lead={latest === "26Q2" ? "26Q2《灵魂摆渡·十年》集均 V30 明显领先" : `${latest} 头部短剧观察`}
          body={latest === "26Q2" ? "其余项目多集中在 130–370 万，与去年比下滑。题材上主要为犯罪、爱情、男频爽剧。" : "本季榜单已更新，可在此填写当季观察。"}
          highlights={latest === "26Q2" ? ["集均 V30 明显领先", "130-370 万"] : []}
          storageKey={`ogv-market-review:${latest.toLowerCase()}:horizontal-short-drama-top10`}
        />
      </div>
      <div className="top-series-evidence"><div className="top-series-quarters"><ShortQuarter quarter={periods[0] || "25Q2"} rows={previous} rules={rules} max={max} revenueMax={revenueMax} /><ShortQuarter quarter={latest} rows={current} rules={rules} max={max} revenueMax={revenueMax} /></div></div>
    </section>;
}

export function LongDramaTopSeries({ filter }: { filter: string }) {
  const [rules, setRules] = useState<VisualRules>(defaultVisualRules);
  const [rulesLoaded, setRulesLoaded] = useState(false);
  useEffect(() => { fetch("/ogv/api/visual-rules", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => { if (data?.rules) setRules(data.rules); }).catch(() => undefined).finally(() => setRulesLoaded(true)); }, []);
  useEffect(() => { if (rulesLoaded) document.documentElement.dataset.ogvVisualRulesLoaded = "true"; }, [rules, rulesLoaded]);
  const live = usePublishedDramaTop({ previous: long25, current: long26 }, { previous: short25, current: short26 }, filter);
  if (!live.long.current.length) return <section className="top-series-part top-series-part-embedded"><p>{filter} 暂无横屏长剧 TOP10 数据</p></section>;
  return <LongDramaTopSeriesContent periods={live.long.periods || ["25Q2", "26Q2"]} previous={live.long.previous} current={live.long.current} rules={rules} />;
}

export function ShortDramaTopSeries({ filter }: { filter: string }) {
  const [rules, setRules] = useState<VisualRules>(defaultVisualRules);
  const [rulesLoaded, setRulesLoaded] = useState(false);
  useEffect(() => { fetch("/ogv/api/visual-rules", { cache: "no-store" }).then((response) => response.ok ? response.json() : null).then((data) => { if (data?.rules) setRules(data.rules); }).catch(() => undefined).finally(() => setRulesLoaded(true)); }, []);
  useEffect(() => { if (rulesLoaded) document.documentElement.dataset.ogvVisualRulesLoaded = "true"; }, [rules, rulesLoaded]);
  const live = usePublishedDramaTop({ previous: long25, current: long26 }, { previous: short25, current: short26 }, filter);
  if (!live.short.current.length) return <section className="top-series-part top-series-part-embedded"><p>{filter} 暂无横屏短剧 TOP10 数据</p></section>;
  return <ShortDramaTopSeriesContent periods={live.short.periods || ["25Q2", "26Q2"]} previous={live.short.previous} current={live.short.current} rules={rules} />;
}
