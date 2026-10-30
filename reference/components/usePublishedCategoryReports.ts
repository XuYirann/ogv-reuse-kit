"use client";

import { useEffect, useMemo, useState } from "react";

type Row = Record<string, string | number | null>;
type Dataset = { key: string; rows: Row[] };
type Payload = { datasets?: Dataset[] };
const payloadRequests = new Map<string, Promise<Payload | null>>();

const q = (value: unknown) => String(value ?? "").toUpperCase().replace(/^20(?=\d{2}Q)/, "");
const n = (value: unknown, divisor = 1) => value == null || value === "" ? null : Number(value) / divisor;
const series = (rows: Row[], periodField: string, fields: Array<[string, string]>, divisor = 1) => ({
  periods: rows.map((row) => q(row[periodField])),
  series: fields.map(([name, field]) => ({ name, values: rows.map((row) => n(row[field], divisor)) })),
});
const splitPlatforms = (value: unknown) => String(value ?? "").split(/[、,，/+]/).map((item) => item.trim()).filter(Boolean).map((item) => item === "B站" ? "bilibili" : item);

function usePayload(category: string) {
  const [payload, setPayload] = useState<Payload | null>(null);
  useEffect(() => {
    const preview = new URLSearchParams(window.location.search).get("preview") === category;
    const url = preview ? `/ogv/api/admin/preview/${category}` : `/ogv/api/public/categories/${category}`;
    const key = `${url}|${window.location.search}`;
    if (!payloadRequests.has(key)) payloadRequests.set(key, fetch(url, { credentials: "same-origin", cache: "no-store" })
      .then((response) => response.ok ? response.json() as Promise<Payload> : null)
      .catch(() => { payloadRequests.delete(key); return null; }));
    payloadRequests.get(key)?.then((value) => { if (value) setPayload(value); });
  }, [category]);
  useEffect(() => {
    if (payload && new URLSearchParams(window.location.search).get("preview") === category)
      document.documentElement.dataset.ogvPreviewLoaded = category;
  }, [category, payload]);
  return useMemo(() => {
    const selected = typeof window !== "undefined" && !new URLSearchParams(window.location.search).has("preview") ? new URLSearchParams(window.location.search).get("conclusion") : null;
    return new Map((payload?.datasets ?? []).map((item) => [item.key, item.rows.filter(row => {
      if (!selected || !/^\d{2}Q[1-4]$/.test(selected)) return true;
      const period = Object.values(row).map(q).find(value => /^\d{2}Q[1-4]$/.test(value));
      return !period || period <= selected;
    })]));
  }, [payload]);
}

export function usePublishedAnimation(fallback: any) {
  const ds = usePayload("animation");
  return useMemo(() => {
    const total = ds.get("animation_1"), japanese = ds.get("animation_2_1"), chinese = ds.get("animation_2_2"), fresh = ds.get("animation_3_1"), supply = ds.get("animation_3_2"), exclusiveTitles = ds.get("animation_3_3");
    if (!total || !japanese || !chinese || !fresh || !supply) return fallback;
    const examples = new Map((fallback.supply ?? []).flatMap((period: any) => period.platforms.map((item: any) => [`${period.period}\0${item.name}`, item.examples])));
    exclusiveTitles?.forEach((row) => [["爱奇艺","爱奇艺"],["腾讯视频","腾讯"],["bilibili","bilibili"],["优酷","优酷"]].forEach(([name,field]) => { const raw=String(row[`${field}独播`]??""); if(raw) examples.set(`${q(row.quarter)}\0${name}`, raw.match(/《[^》]+》/g) ?? [raw]); }));
    return { ...fallback, periods: total.map((r) => q(r["列1"])), total: series(total, "列1", [["其他","其他"],["国创","国创"],["日番","日番"]]), japanese: series(japanese, "有效播放分平台(B站数据调整后)", [["优酷","优酷"],["爱奇艺","爱奇艺"],["腾讯视频","腾讯视频"],["bilibili","bilibili"]]), chinese: series(chinese, "列1", [["优酷","优酷"],["爱奇艺","爱奇艺"],["腾讯视频","腾讯视频"],["bilibili","bilibili"]]), newRelease: series(fresh, "列1", [["优酷","优酷"],["爱奇艺","爱奇艺"],["腾讯视频","腾讯视频"],["bilibili","bilibili"]]), supply: supply.map((r) => ({ period:q(r.quarter), total:Number(r["新片供给量"]), platforms:[["爱奇艺","爱奇艺"],["腾讯视频","腾讯"],["bilibili","bilibili"],["优酷","优酷"]].map(([name,field]) => ({ name, exclusive:Number(r[`${field}独播`]), nonExclusive:Number(r[`${field}非独`]), examples:examples.get(`${q(r.quarter)}\0${name}`) ?? [] })) })) };
  }, [ds, fallback]);
}

export function usePublishedAnimationTop50(fallback: any, quarterFilter = "all") {
  const ds = usePayload("animation");
  return useMemo(() => {
    const structure = ds.get("animation_5_1__top50"), top10 = ds.get("animation_5_2__top10"), platform = ds.get("animation_5_3__top50");
    if (!structure || !top10 || !platform) return fallback;
    const validStructure = structure.filter((row) => row.TOP10 != null || row["TOP11-50"] != null);
    const validPlatform = platform.filter((row) => row.bilibili != null || row["腾讯视频"] != null || row["爱奇艺"] != null || row["优酷"] != null);
    const availablePeriods = [...new Set([...validStructure.map((r) => q(r["列1"])), ...validPlatform.map((r) => q(r["列1"]))])].sort();
    const latest = availablePeriods.filter(period => quarterFilter === "all" || period.endsWith(quarterFilter)).at(-1) ?? "";
    const previousYear = `${Number(latest.slice(0, 2)) - 1}${latest.slice(2)}`;
    const pair = (rows: Row[]) => rows.filter((row) => [previousYear, latest].includes(q(row["列1"])));
    const periods = [...new Set(top10.map((r) => q(r.quarter)))].sort();
    const byPeriod = (period: string) => top10.filter((r) => q(r.quarter) === period && String(r["剧名"] ?? "").trim() && r["全平台播放修正后"] != null && r["全平台播放修正后"] !== "").sort((a,b) => Number(b["全平台播放修正后"])-Number(a["全平台播放修正后"]));
    const topLatest = periods.filter(period => quarterFilter === "all" || period.endsWith(quarterFilter)).at(-1) ?? latest;
    const topPreviousYear = `${Number(topLatest.slice(0, 2)) - 1}${topLatest.slice(2)}`;
    const previous = byPeriod(topPreviousYear), current = byPeriod(topLatest);
    return { platform: series(pair(validPlatform), "列1", [["腾讯视频","腾讯视频"],["bilibili","bilibili"],["优酷","优酷"],["爱奇艺","爱奇艺"]]), structure: series(pair(validStructure), "列1", [["TOP10","TOP10"],["TOP11–50","TOP11-50"]]), top10Periods:topLatest ? [topPreviousYear,topLatest] : [], top10: current.map((r) => ({ name: String(r["剧名"]), current: Number(r["全平台播放修正后"]), previous: n(previous.find((x) => x["剧名"] === r["剧名"])?.["全平台播放修正后"]) })) };
  }, [ds, fallback, quarterFilter]);
}

export function usePublishedAnimationRanking(fallback: any[]) {
  const ds = usePayload("animation");
  return useMemo(() => (ds.get("animation_4___by_vv") ?? fallback).filter((r:any)=>r.period || (String(r["剧名"]??"").trim() && r["集均vv"]!=="" && r["集均vv"]!=null)).map((r: any) => r.period ? r : ({ period: q(r.quarter), name: String(r["剧名"]), platforms: String(r["播出平台"] ?? ""), value: Number(r["集均vv"]), tier: Number(r["集均vv"]) >= 1e7 ? ">1kw" : Number(r["集均vv"]) >= 1e6 ? "100-1kw" : "<100w" })), [ds, fallback]);
}

export function usePublishedDrama(fallback: any) {
  const ds = usePayload("drama");
  return useMemo(() => {
    const total = ds.get("drama_byq"), platform = ds.get("drama_byq__top50"), concentration = ds.get("drama_by__top50"), episodes = ds.get("drama_top50"), v30 = ds.get("drama_top50___v30"), shortTotal = ds.get("drama_byq_2"), shortPlatform = ds.get("drama_byq__top50_2");
    if (!total || !platform || !concentration || !episodes || !v30 || !shortTotal || !shortPlatform) return fallback;
    return { ...fallback,
      total: { ...series(total,"quarter",[["其他","其他"],["热播剧 TOP50","热播剧top50"]]), totals: total.map((r) => n(r["总计"])) },
      platform: series(platform,"quarter",[["爱奇艺","爱奇艺"],["腾讯视频","腾讯视频"],["优酷","优酷"],["芒果TV","芒果TV"]]),
      efficiency: { periods: concentration.map((r) => q(r.quarter)), concentration: { series:[{name:"11–50",values:concentration.map((r)=>n(r["11-50"]))},{name:"TOP10",values:concentration.map((r)=>n(r.top10))}], totals:concentration.map((r)=>n(r.top50)) }, episodes: { series:[{name:"TOP10",values:episodes.map((r)=>n(r.top10))},{name:"11–50",values:episodes.map((r)=>n(r["11-50"]))}] }, v30: { series:[{name:"TOP10",values:v30.map((r)=>n(r.top10))},{name:"11–50",values:v30.map((r)=>n(r["11-50"]))}] } },
      shortDrama: { periods: shortTotal.map((r) => q(r.quarter)), total: { series: [{ name:"上新剧", values: shortTotal.map((r) => n(r["上新剧"])) }, { name:"其他", values: shortTotal.map((r) => n(r["其他"])) }], totals: shortTotal.map((r) => n(r["总计"])) }, platform: series(shortPlatform,"quarter",[["爱奇艺","爱奇艺"],["腾讯视频","腾讯视频"],["优酷","优酷"],["芒果TV","芒果TV"]]) }
    };
  }, [ds, fallback]);
}

export function usePublishedDramaTop(longFallback:any, shortFallback:any, quarterFilter = "all") {
  const ds = usePayload("drama");
  return useMemo(() => {
    const long = ds.get("drama_top10"), short = ds.get("drama_top10_2");
    if (!long || !short) return { long: longFallback, short: shortFallback };
    const periodPair = (rows:any[], fallback:string[]) => {
      const periods = rows[0]?.quarter ? [...new Set(rows.map((row:any) => String(row.quarter)))].sort() : fallback;
      const available = periods.filter(period => quarterFilter === "all" || period.endsWith(quarterFilter));
      const latest = available.at(-1);
      if (!latest) return [];
      const priorYear = `${Number(latest.slice(0, 2)) - 1}${latest.slice(2)}`;
      return [periods.includes(priorYear) ? priorYear : available.at(-2) ?? latest, latest];
    };
    const longPair = periodPair(long, ["25Q2", "26Q2"]), shortPair = periodPair(short, ["25Q2", "26Q2"]);
    const longRows = (period:string, side:"previous"|"current") => long[0]?.quarter
      ? long.filter((row:any) => String(row.quarter) === period && String(row.title ?? "").trim()).sort((a:any,b:any) => Number(a.rank) - Number(b.rank)).map((row:any) => ({name:String(row.title??""),v30:Number(row["集均V30"]||0),genre:String(row["内容题材"]??""),platforms:splitPlatforms(row["播出平台"])}))
      : long.map((row:any) => ({name:String(row[side === "previous" ? "25Q2top10" : "26Q2top10"]),v30:Number(row[side === "previous" ? "集均V30" : "集均V30_2"]),genre:String(row[side === "previous" ? "内容题材" : "内容题材_2"]),platforms:splitPlatforms(row[side === "previous" ? "播出平台" : "播出平台_2"])}));
    const clean = short.filter((row:any) => Number.isFinite(Number(row["列1"])));
    const shortRows = (period:string, side:"previous"|"current") => short[0]?.quarter
      ? short.filter((row:any) => String(row.quarter) === period).sort((a:any,b:any) => Number(a.rank) - Number(b.rank)).map((row:any) => ({name:String(row.title??""),v30:Number(row["集均V30"]||0),genre:String(row["内容题材"]??""),revenue:row["分账金额"]??"—",platforms:splitPlatforms(row["播出平台"])}))
      : clean.map((row:any) => ({name:String(row[side === "previous" ? "25Q2" : "26Q2"]),v30:Number(row[side === "previous" ? "列4" : "列8"]),genre:String(row[side === "previous" ? "列3" : "列7"]),revenue:row[side === "previous" ? "列5" : "列9"]??"—",platforms:[]}));
    return {
      long: { previous:longPair.length ? longRows(longPair[0], "previous") : [], current:longPair.length ? longRows(longPair[1], "current") : [], periods:longPair },
      short: { previous:shortPair.length ? shortRows(shortPair[0], "previous") : [], current:shortPair.length ? shortRows(shortPair[1], "current") : [], periods:shortPair },
    };
  }, [ds, longFallback, shortFallback, quarterFilter]);
}

export function usePublishedVariety(fallback: any) {
  const ds = usePayload("variety");
  return useMemo(() => { const rows = ds.get("variety_1_1_byq"), platformRows = ds.get("variety_2_by_platform"); return rows ? { ...fallback, periods: rows.map((r) => q(r.quarter)), total: series(rows,"quarter",[["电视综艺","电视综艺"],["网络综艺","网络综艺"],["其他综艺","其他综艺"]]), platform: platformRows ? series(platformRows,"quarter",[["爱奇艺","爱奇艺"],["腾讯视频","腾讯视频"],["优酷","优酷"],["芒果TV","芒果TV"]]) : fallback.platform } : fallback; }, [ds, fallback]);
}
export function usePublishedVarietyTop(fallback: any, quarterFilter = "all") {
  const ds = usePayload("variety");
  return useMemo(() => {
    const rows = ds.get("variety_3_top10");
    if (!rows) return quarterFilter === "all" || quarterFilter === "Q2" ? fallback : { previous: [], current: [], periods: [] };
    const periods = [...new Set(rows.map((row) => q(row.quarter).replace(/top10$/i, "")))].sort();
    const available = periods.filter((period) => quarterFilter === "all" || period.endsWith(quarterFilter));
    const latest = available.at(-1);
    if (!latest) return { previous: [], current: [], periods: [] };
    const priorYear = `${Number(latest.slice(0, 2)) - 1}${latest.slice(2)}`;
    const previous = periods.includes(priorYear) ? priorYear : available.at(-2) ?? latest;
    const convert = (period: string) => rows.filter((row) => q(row.quarter).replace(/top10$/i, "") === period)
      .sort((a, b) => Number(a.rank ?? 0) - Number(b.rank ?? 0))
      .map((row) => ({ name: String(row["综艺名"] ?? ""), plays: Number(row["有效播放"] || 0), genre: String(row["内容题材"] ?? ""), platforms: splitPlatforms(row["播出平台"]) }));
    return { previous: convert(previous), current: convert(latest), periods: [previous, latest] };
  }, [ds, fallback, quarterFilter]);
}

export function usePublishedFilmTrend(fallback: any) {
  const ds = usePayload("film");
  return useMemo(() => { const total=ds.get("film_1"), platform=ds.get("film_1_2_by__top50"), coverage=ds.get("film_1_3_by__top50_b"); if(!total||!platform||!coverage)return fallback; return { ...fallback, total:series(total,"quarter",[["网络电影","网络电影"],["院线电影 - 其他","院线电影 - 其他"],["院线电影上新 TOP 50","院线电影 - 上新top50"]]), platform:series(platform,"quarter",[["爱奇艺","爱奇艺"],["腾讯视频","腾讯视频"],["优酷","优酷"],["B站","Bilibili"]]), coverage:{periods:coverage.map((r)=>q(r.quarter)),covered:coverage.map((r)=>n(r["b站有版权"])),other:coverage.map((r)=>n(r["其他"]))} }; }, [ds,fallback]);
}
export function usePublishedFilmTop10(fallback:any){const ds=usePayload("film");return useMemo(()=>{const rows=ds.get("film_2_top");if(!rows)return fallback;if(rows.some(r=>r.quarter&&r["榜单类型"])){const result={...fallback,newRelease:{...fallback.newRelease},catalog:{...fallback.catalog}};for(const period of [...new Set(rows.map(r=>q(r.quarter)))]){for(const [key,kind] of [["newRelease","新上院线电影"],["catalog","存量院线电影"]]){result[key][period]=rows.filter(r=>q(r.quarter)===period&&r["榜单类型"]===kind&&String(r.title??"").trim()&&r["有效播放"]!==""&&r["有效播放"]!=null&&Number.isFinite(Number(r["有效播放"]))).sort((a,b)=>Number(b["有效播放"])-Number(a["有效播放"])).slice(0,10).map(r=>[String(r.title),Number(r["有效播放"])]);}}return result;}const marker=rows.findIndex((r)=>String(r["top10新上院线电影有效播放"]??"").includes("存量"));const parse=(items:Row[])=>items.filter((r)=>r["列6"]&&Number.isFinite(Number(r["列7"]))).map((r)=>[String(r["列6"]),Number(r["列7"])]);return{...fallback,newRelease:{...fallback.newRelease,"26Q2":parse(rows.slice(0,marker))},catalog:{...fallback.catalog,"26Q2":parse(rows.slice(marker+1))}};},[ds,fallback]);}
export function filmPlatformShare(row: Row, absoluteField: string, legacyField: string): number | null {
  const rawField = absoluteField.replace("播放 亿", "播放量");
  if (Object.prototype.hasOwnProperty.call(row, rawField)) {
    const total = n(row["播放-修正 亿"]), plays = n(row[rawField]);
    return total != null && Number.isFinite(total) && total > 0 && plays != null && Number.isFinite(plays) && plays >= 0 ? plays / (total * 100000000) : null;
  }
  if (!Object.prototype.hasOwnProperty.call(row, absoluteField)) return n(row[legacyField]);
  const total = n(row["播放-修正 亿"]), plays = n(row[absoluteField]);
  return total != null && Number.isFinite(total) && total > 0 && plays != null && Number.isFinite(plays) && plays >= 0 ? plays / total : null;
}

export function usePublishedFilmProject(fallback:any){const ds=usePayload("film");return useMemo(()=>{const rows=ds.get("film_3");if(!rows)return fallback;const periods:Record<string,any[]>={};rows.filter(r=>String(r["电影名"]??"").trim()).forEach((r)=>{const period=q(r["季度"]);(periods[period]??=[]).push({name:String(r["电影名"]),boxOffice:n(r["国内票房 亿"]),plays:Number(r["播放-修正 亿"]),shares:{bilibili:filmPlatformShare(r,"B站播放 亿","B站播放占整体份额"),iqiyi:filmPlatformShare(r,"爱奇艺播放 亿","爱奇艺份额"),tencent:filmPlatformShare(r,"腾讯视频播放 亿","腾讯视频"),youku:filmPlatformShare(r,"优酷播放 亿","优酷")}})});return {...fallback,periods};},[ds,fallback]);}
export function usePublishedFilmBoxOffice(fallback:any){const ds=usePayload("film");return useMemo(()=>{const rows=ds.get("film_4");return rows?{...fallback,periods:rows.map((r)=>q(r.quarter)),values:rows.map((r)=>Number(r["院线电影票房_亿"]))}:fallback;},[ds,fallback]);}

export function documentaryRankingMonth(value: unknown): number | null {
  const text = String(value ?? "").trim();
  const iso = text.match(/^20\d{2}[-/](\d{1,2})(?:[-/]|$)/);
  const legacy = text.match(/^\d{2}\.(\d{1,2})$/);
  const month = iso ? Number(iso[1]) : legacy ? Number(legacy[1].padEnd(2, "0")) : null;
  return month != null && month >= 1 && month <= 12 ? month : null;
}

export function usePublishedDocumentary(fallback:any){const ds=usePayload("documentary");return useMemo(()=>{const rows=ds.get("documentary_q2");if(!rows)return fallback;const quarters=[...new Set(rows.map((r)=>q(r["季度"])))].sort();const comparisons:Record<string,any>={};const monthsFor=(quarter:string)=>quarter.endsWith("Q1")?[1,2,3]:quarter.endsWith("Q2")?[4,5,6]:quarter.endsWith("Q3")?[7,8,9]:[10,11,12];quarters.forEach((quarter)=>{const year=Number(quarter.slice(0,2)),previous=`${String(year-1).padStart(2,"0")}${quarter.slice(2)}`, months=monthsFor(quarter), currentRows=rows.filter((r)=>q(r["季度"])===quarter), previousRows=rows.filter((r)=>q(r["季度"])===previous);const genres=[...new Set([...currentRows,...previousRows].map((r)=>String(r["题材1"]||"其他")))];comparisons[quarter]={previousQuarter:previous,months:months.map((m)=>`${m}月`),groups:genres.map((genre)=>{const cr=currentRows.filter((r)=>String(r["题材1"]||"其他")===genre),pr=previousRows.filter((r)=>String(r["题材1"]||"其他")===genre),names=[...new Set([...cr,...pr].map((r)=>String(r["名称"])))];return{genre,previousCount:new Set(pr.map((r)=>r["名称"])).size,currentCount:new Set(cr.map((r)=>r["名称"])).size,status:!pr.length?"new":!cr.length?"disappeared":"continuing",projects:names.map((name)=>{const ranks=(source:Row[])=>months.map((month)=>{const row=source.find((r)=>String(r["名称"])===name&&documentaryRankingMonth(r["排名时间"])===month);return row?Number(row["排名"]):null});const currentRanks=ranks(cr);return{name,previousRanks:ranks(pr),currentRanks,appearances:currentRanks.filter(Boolean).length};})};})};});return{...fallback,availableQuarters:Object.keys(comparisons),comparisons};},[ds,fallback]);}
export function usePublishedDocumentaryExtras(h1Fallback:any,platformFallback:any){const ds=usePayload("documentary");return useMemo(()=>{const rows=ds.get("documentary_q2");if(!rows)return{h1:h1Fallback,platforms:platformFallback};const platforms={...platformFallback};rows.forEach((r)=>{platforms[String(r["名称"])]=splitPlatforms(r["播出平台"]).map((x)=>x==="bilibili"?"B站":x)});const h1Periods:Record<string,any[]>={};[25,26].forEach((year)=>{const key=`${year}H1`,unique=new Map<string,Row>();rows.filter((r)=>q(r["季度"]).startsWith(String(year))&&/[Q1Q2]$/.test(q(r["季度"]))).forEach((r)=>{const name=String(r["名称"]);const current=unique.get(name);if(!current||Number(r["正片有效播放量"])>Number(current["正片有效播放量"]))unique.set(name,r)});h1Periods[key]=[...unique.values()].sort((a,b)=>Number(b["正片有效播放量"])-Number(a["正片有效播放量"])).slice(0,10).map((r,index)=>({rank:index+1,name:String(r["名称"]),plays:Math.round(Number(r["正片有效播放量"])/10000),genre:String(r["题材1"]||"其他"),subgenre:String(r["题材2"]||""),platforms:platforms[String(r["名称"])]||[]}));});return{h1:{...h1Fallback,periods:h1Periods},platforms};},[ds,h1Fallback,platformFallback]);}

export function usePublishedAnimationProjects() {
  const ds = usePayload("animation");
  return useMemo(() => {
    const periods: Record<string, any[]> = {};
    (ds.get("animation_top50_projects") ?? []).forEach(r => {
      const period = q(r["季度"]);
      periods[period] ??= [];
      if (!String(r["剧名"] ?? "").trim()) return;
      const legacyTotal = n(r["播放-修正 亿"]);
      const total = Object.prototype.hasOwnProperty.call(r, "全平台播放量") ? n(r["全平台播放量"], 100000000) : legacyTotal == null ? null : legacyTotal >= 10000 ? legacyTotal / 100000000 : legacyTotal;
      periods[period].push({ name: String(r["剧名"]), plays: total, shares: {
        bilibili: n(r["B站播放量"]), iqiyi: n(r["爱奇艺播放量"]),
        tencent: n(r["腾讯视频播放量"]), youku: n(r["优酷播放量"])
      }});
    });
    Object.values(periods).forEach(rows => rows.sort((a,b) => (b.plays ?? -1) - (a.plays ?? -1)));
    return periods;
  }, [ds]);
}
