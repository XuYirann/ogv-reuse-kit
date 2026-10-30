"use client";
import * as echarts from "echarts";
import { useEffect, useMemo, useRef, useState } from "react";
import fallbackData from "../data/filmTrend.json";
import { usePublishedFilmTrend } from "./usePublishedCategoryReports";
import { EditableInsight } from "./EditableInsight";
import { type BracketComparison, setBracketAnnotations } from "./chartBrackets";
import { FilmTop10 } from "./FilmTop10";
import { FilmProjectShare } from "./FilmProjectShare";
import { FilmBoxOffice } from "./FilmBoxOffice";
import { getChartLayout, resizeResponsiveChart } from "./chartResponsive";

type QuarterFilter = "Q1" | "Q2" | "Q3" | "Q4" | "all";
type ChartKind = "total" | "coverage" | "platform";
let data: any = fallbackData;
const colors: Record<string, string> = { "网络电影":"#d9dfe8","院线电影 - 其他":"#9eb3c9","院线电影上新 TOP 50":"#385577","爱奇艺":"#C0D688","腾讯视频":"#A9BACF","优酷":"#89D8F0","B站":"#D99AAF" };
const displayName = (name: string) => ({ "网络电影": "网络电影", "院线电影 - 其他": "存量院线电影", "院线电影上新 TOP 50": "上新院线电影" }[name] ?? name);
const pct = (a:number,b:number) => `${a >= b ? "+" : ""}${((a / b - 1) * 100).toFixed(0)}%`;

function FilmChart({ kind, filter }: { kind: ChartKind; filter: QuarterFilter }) {
  const ref = useRef<HTMLDivElement>(null);
  const view = useMemo(() => {
    const sourcePeriods = kind === "total" ? data.total.periods : kind === "coverage" ? data.coverage.periods : data.platform.periods;
    const indexes = sourcePeriods.map((period,index)=>({period,index})).filter(({period})=>filter === "all" || period.endsWith(filter));
    const periods = indexes.map(({period})=>period);
    if (kind === "total") return { periods, series: data.total.series.map(item=>({...item,values:indexes.map(({index})=>item.values[index])})) };
    if (kind === "platform") return { periods, series: data.platform.series.map(item=>({...item,values:indexes.map(({index})=>item.values[index])})) };
    return { periods, series: [
      { name:"B站有版权", values:indexes.map(({index})=>data.coverage.covered[index]) },
      { name:"其他", values:indexes.map(({index})=>data.coverage.other[index]) },
    ] };
  }, [filter,kind]);

  useEffect(() => {
    if (!ref.current || !view.periods.length) return;
    const chart = echarts.init(ref.current, undefined, { renderer: "svg" });
    const layoutSpec = { left: 38, right: kind === "platform" ? 122 : 18, top: kind === "total" ? 78 : 44, bottom: 64, variant: kind === "platform" ? "right-legend" as const : "plain" as const, minRight: kind === "platform" ? 122 : 18 };
    const totals = view.periods.map((_,i)=>view.series.reduce((sum,item)=>sum + Number(item.values[i] ?? 0),0));
    const common = { animationDuration:420, tooltip:{show:false}, grid:getChartLayout(ref.current.clientWidth, layoutSpec).grid, xAxis:{type:"category",data:view.periods,axisTick:{show:false},axisLine:{lineStyle:{color:"#aeb7b0"}},axisLabel:{color:"#737c76",fontSize:10}}, yAxis:{type:"value",...(kind === "coverage" ? {min:0,max:50,interval:10}:{}),axisLabel:{color:"#737c76",fontSize:9},splitLine:{lineStyle:{color:"#e4e7e4"}}} };
    let legend: object | undefined;
    let series: object[] = [];
    if (kind === "total") {
      legend = {data:[...view.series].reverse().map(item=>displayName(item.name)),bottom:10,itemWidth:9,itemHeight:9,textStyle:{color:"#58615b",fontSize:12}};
      series = [...view.series.map(item=>({name:displayName(item.name),type:"bar",stack:"total",data:item.values,barMaxWidth:38,itemStyle:{color:colors[item.name]},label:{show:true,position:"inside",color:item.name === "院线电影上新 TOP 50" ? "#fff":"#263038",fontSize:9,formatter:({value}:{value:number})=>value.toFixed(1)}})),{name:"柱顶合计",type:"bar",data:totals,barMaxWidth:38,barGap:"-100%",silent:true,z:20,itemStyle:{color:"rgba(0,0,0,0)"},label:{show:true,position:"top",distance:8,color:"#161917",fontSize:11,fontWeight:700,formatter:({value}:{value:number})=>value.toFixed(1)}}];
    }
    if (kind === "coverage") {
      legend = {bottom:10,data:["B站有版权","其他"],itemWidth:9,itemHeight:9,textStyle:{color:"#58615b",fontSize:12}};
      series = view.series.map(item=>({name:item.name,type:"bar",stack:"total",data:item.values,barMaxWidth:42,itemStyle:{color:item.name === "B站有版权" ? "#385577":"#d9dfe8"},label:{show:true,position:"inside",color:item.name === "B站有版权" ? "#fff":"#263038",fontSize:9,formatter:({value}:{value:number})=>item.name === "B站有版权" ? `${value}部\n${value*2}%`:`${value}部`}}));
    }
    if (kind === "platform") {
      series = [...view.series.map(item=>({name:item.name,type:"bar",stack:"total",data:item.values,barMaxWidth:38,itemStyle:{color:colors[item.name]},label:{show:item.name !== "B站",position:"inside",color:item.name === "腾讯视频" ? "#fff":"#263038",fontSize:9,formatter:({value,dataIndex}:{value:number,dataIndex:number})=>`${value.toFixed(1)}\n(${(value/totals[dataIndex]*100).toFixed(0)}%)`}})),{name:"柱顶合计",type:"bar",data:totals,barMaxWidth:38,barGap:"-100%",silent:true,z:20,itemStyle:{color:"rgba(0,0,0,0)"},label:{show:true,position:"top",distance:8,color:"#161917",fontSize:11,fontWeight:700,formatter:({value}:{value:number})=>value.toFixed(1)}}];
    }
    chart.setOption({...common,legend,series});
    const draw = () => {
      const comparisons: BracketComparison[] = [];
      const latest = view.periods.length - 1, previous = latest - 1;
      if (filter !== "all" && previous >= 0 && kind === "total") comparisons.push({previousIndex:previous,currentIndex:latest,previousValue:totals[previous],currentValue:totals[latest],label:pct(totals[latest],totals[previous]),level:1,targetGap:26,labelFontSize:8});
      if (filter !== "all" && previous >= 0 && kind === "platform") {
        const rows=[80,142,204,266];
        ["B站", "优酷", "腾讯视频", "爱奇艺"].forEach((name,rowIndex)=>{const item=view.series.find(entry=>entry.name===name);if(!item)return;const index=view.series.findIndex(entry=>entry.name===name),current=Number(item.values[latest]),prev=Number(item.values[previous]),lower=view.series.slice(0,index).reduce((sum,entry)=>sum+Number(entry.values[latest]),0);comparisons.push({previousIndex:previous,currentIndex:latest,previousValue:lower+current/2,currentValue:lower+current/2,label:`同比 ${pct(current,prev)}`,variant:"sideLabel",title:item.name,swatchColor:colors[item.name],labelFontSize:8,labelY:rows[rowIndex]});});
        const bi=view.series.findIndex(item=>item.name === "B站"), b=view.series[bi];
        b?.values.forEach((raw,dataIndex)=>{const value=Number(raw),lower=view.series.slice(0,bi).reduce((sum,item)=>sum+Number(item.values[dataIndex]),0);comparisons.push({previousIndex:dataIndex,currentIndex:dataIndex,previousValue:lower,currentValue:lower,label:`${value.toFixed(1)}\n(${(value/totals[dataIndex]*100).toFixed(0)}%)`,variant:"barCallout",color:colors.B站,labelFontSize:8,labelYShift:8,arrowOffset:25});});
      }
      setBracketAnnotations(chart,comparisons);
    };
    requestAnimationFrame(draw);
    const observer = new ResizeObserver(()=>ref.current && resizeResponsiveChart(chart, ref.current, layoutSpec, () => requestAnimationFrame(draw))); observer.observe(ref.current);
    return ()=>{observer.disconnect();chart.dispose()};
  }, [filter,kind,view]);
  if (!view.periods.length) return <div className="film-chart film-chart-empty">当前季度暂无数据</div>;
  return <div ref={ref} className="film-chart" role="img" aria-label={kind === "total" ? "电影有效播放构成" : kind === "coverage" ? "B站版权覆盖率":"分平台播放量"}/>;
}

function FilmTrendContent() {
  const [quarterFilter,setQuarterFilter] = useState<QuarterFilter>((data.total.periods.at(-1)?.slice(-2) as QuarterFilter) || "Q2");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search), period = params.get("conclusion");
    if (!params.has("preview") && period && /^\d{2}Q[1-4]$/.test(period)) setQuarterFilter(period.slice(-2) as QuarterFilter);
  }, []);
  return <section className="horizontal-drama-trend film-trend">
    <div className="horizontal-drama-lead"><div className="horizontal-drama-subhead"><span>01</span><h4>电影大盘趋势</h4></div><EditableInsight lead="电影播放继续收缩，B站院线新片覆盖提升" body="26Q2 新上新上院线电影播放 9.8 亿，同比 -8%。B站覆盖院线新片 TOP50 中的 33 部，覆盖率升至 66%。" highlights={["9.8 亿","-8%","33 部","66%"]} storageKey="ogv-market-review:26q2:film-trend-v1"/></div>
    <div className="horizontal-drama-quarter-filter" aria-label="选择季度"><span>显示季度</span>{(["Q1","Q2","Q3","Q4","all"] as const).map(q=><button key={q} type="button" className={quarterFilter === q ? "selected":""} aria-pressed={quarterFilter === q} onClick={()=>setQuarterFilter(q)}>{q === "all" ? "全部":q}</button>)}</div>
    <div className="film-charts"><article className="horizontal-drama-panel"><header><h5>byQ 电影有效播放（亿）</h5></header><FilmChart kind="total" filter={quarterFilter}/></article><article className="horizontal-drama-panel"><header><div><h5>B站版权覆盖率</h5><span>上新院线电影</span></div></header><FilmChart kind="coverage" filter={quarterFilter}/></article><article className="horizontal-drama-panel"><header><div><h5>byQ 分平台播放（亿）</h5><span>上新院线电影</span></div></header><FilmChart kind="platform" filter={quarterFilter}/></article></div>
    <p className="horizontal-drama-source film-source">数据范围：左图为全部电影有效播放，覆盖存量与增量；右侧两图仅统计院线电影上新 TOP 50。数据来源：{data.source}。</p>
    <FilmTop10 filter={quarterFilter}/><FilmProjectShare filter={quarterFilter}/><FilmBoxOffice/>
  </section>;
}

export function FilmTrend() {
  data = usePublishedFilmTrend(fallbackData);
  return <FilmTrendContent key={JSON.stringify(data)} />;
}
