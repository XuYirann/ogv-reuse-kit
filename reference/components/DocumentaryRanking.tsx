"use client";

import fallbackData from "../data/documentaryRanking.json";
import fallbackPlatformData from "../data/documentaryPlatforms.json";
import fallbackH1Data from "../data/documentaryH1.json";
import { usePublishedDocumentary, usePublishedDocumentaryExtras } from "./usePublishedCategoryReports";
import { EditableInsight } from "./EditableInsight";

type Rank = number | null;
export type DocumentaryQuarter = string;
let data: any = fallbackData;
let platformData: any = fallbackPlatformData;
let h1Data: any = fallbackH1Data;
const platformLogos: Record<string, string> = {
  爱奇艺: "platform-logos/iqiyi.png",
  腾讯视频: "platform-logos/tencent-video.png",
  芒果TV: "platform-logos/mango-tv.png",
  优酷: "platform-logos/youku.png",
  B站: "platform-logos/bilibili.png",
  央视频: "platform-logos/cctv-video.png",
  西瓜视频: "platform-logos/xigua-video.png",
};

function DocumentaryPlatforms({ name }: { name: string }) {
  const platforms = (platformData as Record<string, string[]>)[name] ?? [];
  const aliases: Record<string, string> = { "哔哩哔哩": "B站", bilibili: "B站", "优酷视频": "优酷", "腾讯": "腾讯视频", "芒果": "芒果TV", "芒果tv": "芒果TV" };
  const normalized = [...new Set(platforms.map(platform => aliases[platform.trim()] ?? platform.trim()))];
  return <span className="documentary-platforms" role="cell">{normalized.map(platform => platformLogos[platform]
    ? <img key={platform} className={`platform-logo platform-logo-${platform === "B站" ? "bilibili" : platform}`} src={`/ogv/${["西瓜视频", "央视频"].includes(platform) ? platformLogos[platform].replace(/\.png$/, "-normalized.svg") : platformLogos[platform]}`} alt={platform} title={platform} />
    : <span key={platform} title={platform}>{platform}</span>
  )}</span>;
}

const countHeat = (count: number) => ({
  backgroundColor: `rgb(78 123 104 / ${count === 0 ? 0.04 : 0.1 + count / 8 * 0.54})`,
  color: count >= 5 ? "#ffffff" : "#26352f",
});

const rankPalettes = {
  previous: ["#FDEEEE", "#F6D6D6", "#EEAAAA", "#C27B7B", "#D45959"],
  current: ["#EDF1F5", "#DCE5EF", "#C0CCDB", "#9FB3CA", "#728FB6"],
};

const rankHeat = (rank: Rank, period: keyof typeof rankPalettes) => {
  if (rank == null) return undefined;
  const level = Math.min(4, Math.floor((10 - rank) / 2));
  return { backgroundColor: rankPalettes[period][level], color: level >= 3 ? "#ffffff" : "#263038" };
};

type H1Period = string;
type H1Row = { rank:number; name:string; plays:number; genre:string };
const h1Max = Math.max(...Object.values(h1Data.periods).flat().map((row) => row.plays));

function DocumentaryH1Panel({ period, rows }: { period: H1Period; rows: readonly H1Row[] }) {
  return <article className="documentary-h1-panel">
    <header><h5>{period}</h5><span>TOP10 正片有效播放</span></header>
    <div className="documentary-h1-head" aria-hidden="true"><span>排名 / 片名</span><span>题材</span><span>播放（万）</span></div>
    <div className="documentary-h1-list">
      {rows.map((row) => <div className="documentary-h1-row" key={`${period}-${row.rank}`}>
        <span className="documentary-h1-rank">{String(row.rank).padStart(2, "0")}</span>
        <span className="documentary-h1-name" title={row.name}>{row.name}</span>
        <span className="documentary-h1-genre">{row.genre}</span>
        <span className="documentary-h1-bar"><i style={{ width: `${row.plays / h1Max * 100}%` }} /></span>
        <b>{row.plays.toLocaleString("zh-CN")}</b>
      </div>)}
    </div>
  </article>;
}

function DocumentaryH1Comparison() {
  return <section className="documentary-h1-comparison">
    <div className="horizontal-drama-lead documentary-h1-lead">
      <EditableInsight
        lead="头部播放小幅增长，医疗与职业纪实进一步集中"
        body="26H1 纪录片 TOP10 正片有效播放合计 4.25 亿，同比上升 7%；前三名合计占 TOP10 的 55%，较上年同期提升 7 个百分点。医疗题材占据前二并贡献 2.01 亿播放，职业纪实亦有两部进入前五。"
        highlights={["4.25 亿", "上升 7%", "55%", "提升 7 个百分点", "2.01 亿"]}
        storageKey="ogv-market-review:documentary:h1-playback-insight-v1"
      />
    </div>
    <div className="documentary-h1-title">
      <h4>H1 头部纪录片播放对比</h4>
      <span>25H1 vs 26H1 · 左右榜单使用统一比例尺</span>
    </div>
    <div className="documentary-h1-layout">
      <DocumentaryH1Panel period="25H1" rows={h1Data.periods["25H1"]} />
      <DocumentaryH1Panel period="26H1" rows={h1Data.periods["26H1"]} />
    </div>
    <div className="documentary-footer"><span>数据来源：{h1Data.source}；播放单位：万；柱长按两期共同最大值 9,956 万计算。</span></div>
  </section>;
}

function DocumentaryQuarterSelectContent({ value, onChange }: { value: DocumentaryQuarter; onChange: (quarter: DocumentaryQuarter) => void }) {
  return <label className="documentary-quarter-select"><span>选择季度</span><select value={value} onChange={(event) => onChange(event.target.value as DocumentaryQuarter)}>{data.availableQuarters.map((quarter) => <option key={quarter} value={quarter}>{quarter}</option>)}</select></label>;
}

function DocumentaryRankingContent({ quarter }: { quarter: DocumentaryQuarter }) {
  const comparison = data.comparisons[quarter];
  if (!comparison) return <section className="documentary-ranking"><p className="chart-hint">{quarter} 纪录片数据加载中，暂无可显示的榜单。</p></section>;
  const groups = comparison.groups.filter((group) => group.genre !== "职业纪实");
  const professional = comparison.groups.find((group) => group.genre === "职业纪实");
  if (professional) {
    const medicalIndex = groups.findIndex((group) => group.genre === "医疗");
    groups.splice(medicalIndex < 0 ? groups.length : medicalIndex + 1, 0, professional);
  }
  const previousTotal = comparison.groups.reduce((sum, group) => sum + group.previousCount, 0);
  const currentTotal = comparison.groups.reduce((sum, group) => sum + group.currentCount, 0);
  const change = previousTotal ? Math.round((currentTotal / previousTotal - 1) * 100) : 0;
  const newGenres = comparison.groups.filter((group) => group.status === "new").map((group) => group.genre);
  const disappearedGenres = comparison.groups.filter((group) => group.status === "disappeared").map((group) => group.genre);
  const leadingGenre = [...comparison.groups].sort((a, b) => b.currentCount - a.currentCount)[0];

  return (
    <section className="documentary-ranking">
      <div className="horizontal-drama-lead documentary-lead" key={quarter}>
        <EditableInsight
          lead="头部观察"
          body="26Q2 月榜 TOP 内容主要题材为职业纪实、医疗、自然；头部内容中 B 站覆盖率高，仅 2 部作品 B 站没有播出（十三邀、了不起的妈妈）。"
          highlights={[`${currentTotal} 个项目`, `${previousTotal} 个`, `${Math.abs(change)}%`, `${leadingGenre.currentCount} 个项目`, ...newGenres, ...disappearedGenres]}
          storageKey={`ogv-market-review:documentary:${quarter}:insight-v1`}
          contentKey="ogv-market-review:documentary:26Q2:insight-v1"
        />
      </div>
      <div className="documentary-table-wrap">
        <div className="documentary-module-title"><h4>纪录片月度 TOP10 题材扫描</h4><span>{comparison.previousQuarter} vs {quarter}</span></div>
        <div className="documentary-table" role="table" aria-label={`${quarter} 纪录片月度排名，按题材分组并对比去年同期`}>
          <div className="documentary-period-bands" aria-hidden="true"><span /><span /><b>{comparison.previousQuarter}</b><b>{quarter}</b><span /><span /></div>
          <div className="documentary-row documentary-head" role="row">
            <span role="columnheader">题材</span><span role="columnheader">名称</span>
            {comparison.months.map((month) => <span role="columnheader" key={`previous-${month}`}>{month}排名</span>)}
            {comparison.months.map((month) => <span role="columnheader" key={`current-${month}`}>{month}排名</span>)}
            <span role="columnheader">本季上榜次数</span>
            <span role="columnheader">播出平台</span>
          </div>
          {groups.map((group) => (
            <div className={`documentary-group documentary-group-${group.status}`} key={group.genre}>
              <div className="documentary-group-row" role="row">
                <span className="documentary-genre" role="rowheader">{group.genre}</span>
                <span className="documentary-status">{group.status === "new" && <em>新增题材</em>}{group.status === "disappeared" && <em>本季消失</em>}</span>
                <span className="documentary-count-pair"><small>去年同期项目数</small><strong style={countHeat(group.previousCount)}>{group.previousCount}</strong></span>
                <span className="documentary-count-pair"><small>本季项目数</small><strong style={countHeat(group.currentCount)}>{group.currentCount}</strong></span>
              </div>
              {group.projects.map((project) => (
                <div className="documentary-row documentary-project-row" role="row" key={project.name}>
                  <span aria-hidden="true" /><span className="documentary-project-name" role="cell">{project.name}</span>
                  {project.previousRanks.map((rank, index) => <span className="documentary-rank documentary-rank-previous" role="cell" style={rankHeat(rank as Rank, "previous")} key={`previous-${project.name}-${index}`}>{rank ?? "—"}</span>)}
                  {project.currentRanks.map((rank, index) => <span className="documentary-rank" role="cell" style={rankHeat(rank as Rank, "current")} key={`current-${project.name}-${index}`}>{rank ?? "—"}</span>)}
                  <strong className="documentary-appearances" role="cell">{project.appearances}</strong>
                  <DocumentaryPlatforms name={project.name} />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="documentary-footer"><span>颜色越深，项目数越多 / 月度排名越靠前</span></div>
    </section>
  );
}

export function DocumentaryQuarterSelect(props: { value: DocumentaryQuarter; onChange: (quarter: DocumentaryQuarter) => void }) {
  data = usePublishedDocumentary(fallbackData);
  return <DocumentaryQuarterSelectContent key={JSON.stringify(data)} {...props} />;
}

export function DocumentaryRanking({ quarter }: { quarter: DocumentaryQuarter }) {
  data = usePublishedDocumentary(fallbackData);
  const extras = usePublishedDocumentaryExtras(fallbackH1Data, fallbackPlatformData);
  h1Data = extras.h1; platformData = extras.platforms;
  return <DocumentaryRankingContent key={JSON.stringify([data, extras])} quarter={quarter} />;
}
