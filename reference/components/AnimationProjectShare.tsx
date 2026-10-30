"use client";
import { usePublishedAnimationProjects } from "./usePublishedCategoryReports";
import { EditableInsight } from "./EditableInsight";
const logos: Record<string, string> = { bilibili: "bilibili.png", iqiyi: "iqiyi.png", tencent: "tencent-video.png", youku: "youku.png" };
const platforms = [ ["bilibili", "B站", "#D99AAF"], ["iqiyi", "爱奇艺", "#C0D688"], ["tencent", "腾讯视频", "#A9BACF"], ["youku", "优酷", "#89D8F0"] ];
export function AnimationProjectShare({ currentPeriod }: { currentPeriod: string }) {
  const data = usePublishedAnimationProjects();
  const previous = `${Number(currentPeriod.slice(0,2))-1}${currentPeriod.slice(2)}`;
  const maxPlays = Math.max(1, ...[previous,currentPeriod].flatMap(period => (data[period] ?? []).map(row => row.plays ?? 0)));
  return <div className="animation-project-share film-project-share">
    <EditableInsight lead="头部内容观察" body="长线 IP 仍是头部播放的主要支撑。《仙逆》《斗破苍穹年番》等腾讯老作播放回落；B站《凡人修仙传》保持稳定，《牧神记》进入头部；优酷《沧元图》进入 TOP10，平台头部内容表现有所分化。" highlights={[]} storageKey="ogv-market-review:26q2:animation-top50-project-insight-v1" />
    <div className="film-project-layout">{[previous,currentPeriod].map(period => {
      const rows = data[period] ?? [];
      const basePeriod = `${Number(period.slice(0,2))-1}${period.slice(2)}`;
      const baseRows = data[basePeriod] ?? [];
      const normalizedName = (name: string) => name.replace(/\s+/g, "").normalize("NFKC");
      return <article className="horizontal-drama-panel film-project-panel" key={period}>
        <header className="animation-project-header"><div><h5>{period}</h5><span>{period === previous ? "上一年" : "本季"} · TOP50 国创长片</span></div>{period === currentPeriod && <div className="animation-project-legend" aria-label="播放平台颜色图例">{platforms.map(([key,label,color]) => <span key={key}><i style={{background:color}}/>{label}</span>)}</div>}</header>
        <div className="film-project-table">
          <div className="film-project-row film-project-head"><span>剧名</span><span>播放（亿）</span><span>同比</span><span>播出平台</span></div>
          {rows.slice(0,50).map((row,index) => { const base = baseRows.find(item => normalizedName(item.name) === normalizedName(row.name)); const growth = base?.plays > 0 && row.plays != null ? (row.plays/base.plays-1)*100 : null; return <div className="film-project-row" key={`${row.name}-${index}`}>
            <span className="film-project-name"><em>{String(index+1).padStart(2,"0")}</em><b title={row.name}>{row.name}</b></span>
            <span className="animation-project-plays"><i style={{width:`${(row.plays ?? 0)/maxPlays*100}%`}}>{platforms.map(([key,label,color]) => {
              const total = platforms.reduce((sum,[platform]) => sum + (row.shares[platform] ?? 0),0);
              return row.shares[key] > 0 && total > 0 ? <span key={key} style={{width:`${row.shares[key]/total*100}%`,background:color}} title={`${label} ${(row.shares[key]/total*100).toFixed(0)}%`}/> : null;
            })}</i><b style={{left:`${(row.plays ?? 0)/maxPlays*100}%`}}>{row.plays == null ? "—" : row.plays.toFixed(2)}</b></span>
            <span className={`animation-project-yoy${growth != null && growth < 0 ? " negative" : ""}`} title={`对比 ${basePeriod} 同名作品`}>{growth != null ? `${growth > 0 ? "+" : ""}${growth.toFixed(0)}%` : !baseRows.length ? "—" : !base ? "新上榜" : "—"}</span>
            <div className="animation-platform-shares" aria-label={`${row.name}播放平台`}>{platforms.filter(([key]) => row.shares[key] != null && row.shares[key] > 0).map(([key,label]) => <img key={key} src={`/ogv/platform-logos/${logos[key]}`} alt={label} title={label}/>)}{platforms.every(([key]) => row.shares[key] == null) && <small>待补</small>}</div>
          </div>;})}
        </div>
      </article>;
    })}</div>
  </div>;
}
