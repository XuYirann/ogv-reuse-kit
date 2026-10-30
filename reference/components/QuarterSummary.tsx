"use client";

import { type ReactNode, useState } from "react";
import { HideIn26Q3 } from "./ReportQuarterVisibility";

function SummaryDocument({ title, contentId, contentKey, children }: { title: string; contentId: string; contentKey: string; children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return <div className={`quarter-summary-document${expanded ? " is-expanded" : " is-collapsed"}`}>
    <button className="quarter-summary-toggle" type="button" aria-expanded={expanded} aria-controls={contentId} onClick={() => setExpanded((value) => !value)}>
      <span className="quarter-summary-toggle-label"><strong>{title}</strong><small>{expanded ? "点击收起" : "点击展开查看"}</small></span><b aria-hidden="true">{expanded ? "−" : "+"}</b>
    </button>
    <div hidden={!expanded} id={contentId} className="quarter-summary-content quarter-summary-static" data-content-key={contentKey}>{children}</div>
  </div>;
}

function OgvSummaryContent() {
  return <>
      <h2>平台整体</h2>
      <ol>
        <li><strong>长视频平台的用户、时长、收入继续收缩，短剧平台持续高速增长</strong>
          <ol>
            <li><strong>红果的 MAU 首次超过腾讯视频：</strong>26Q2 红果免费短剧 MAU 3.68 亿（同比 +74%）、DAU 1.57 亿（+106%），均超过腾讯视频的 3.19 亿（-12%）和 5051 万（-25%）；红果 DAU 已达到腾讯视频的 3.1 倍，腾讯、爱奇艺 DAU 均降至 2018 年以来最低。</li>
            <li><strong>红果持续吸收长视频用户，同时继续拓展新用户：</strong>从 MAU 看，26Q2 红果与爱腾重叠用户升至 1.61 亿（环比 +10%），红果独家用户升至 2.08 亿（+22%）；爱腾独家用户降至 3.03 亿（-10%）。</li>
            <li><strong>时长格局的差距进一步扩大：</strong>短剧平台总用户时长达到 325.9 亿小时（同比 +142%），已是爱优腾芒等长视频平台合计的 1.7 倍，长视频用户总时长 186.7 亿小时（同比 -14%），长视频平台的基本盘继续承压。</li>
            <li><strong>长视频平台收入持续下滑：</strong>长视频会员收入同比下滑 4%、广告收入同比下滑 4%，会员数同比 -3%～+7%，ARPPU 同比 -12%～1%，会员单价在下跌。腾讯视频外渠收入同比增长 +2.1%，占会员收入的 37%，自渠拉新能力持续减弱。</li>
          </ol>
        </li>
        <li><strong>短剧市场：免费持续替代付费，AI 短剧收入首次超过真人</strong>
          <ol>
            <li><strong>短剧持续从付费转向免费：</strong>26Q2 短剧平台 IAA 广告收入达到 317 亿，其中抖音 163.0 亿、红果 91.0 亿；IAP 付费短剧收入仅 30.8 亿（-26%）。IAA 已占两类平台收入合计的 91%。</li>
            <li><strong>AI 短剧收入环比翻倍，超过真人短剧：</strong>26Q2 AI 短剧收入 218 亿（+127%），收入首次超过真人短剧的 130 亿（-19%）。AI 短剧已经贡献整体短剧市场的 63%。</li>
          </ol>
        </li>
        <li><strong>趋势判断：</strong>
          <ol>
            <li>长视频用户和收入缓慢下滑仍是长周期趋势；短剧继续依靠免费模式、广告变现和更短的生产周期扩大市场。</li>
            <li>AI 内容正在依靠成本优势替代中腰部真人内容，但 OGV 和短剧的精品还需持续观察下一季度表现（vs PUGV 已有部分精品 AI 剧情内容）。</li>
          </ol>
        </li>
      </ol>

      <h2>分品类</h2>
      <ol>
        <li><strong>动画：</strong>
          <ol>
            <li><strong>番剧：</strong>23Q1 以来（有复盘数据以来）同比播放持续下跌，本季度下跌幅度（同比 -17%）与 25Q2（同比 -18%）相比略有收窄；分平台看，26Q1 各平台有效播放同比均有不同程度下跌，B 站下跌幅度最小。</li>
            <li><strong>国创：</strong>24Q2 以来连续 9 个季度同比播放下跌，本季度下跌幅度（同比 -25%）较 25Q1（同比 -15%）大幅扩大；分平台看，26Q1 各平台有效播放同比均有不同程度下跌，优酷跌幅最小（同比 -2%），B 站跌幅第二小（同比 -12%），爱奇艺（同比 -22%）、腾讯（同比 -36%）跌幅明显。
              <ol>
                <li><strong>国创新作播放回落，腾讯贡献进一步提升：</strong>1）26Q2 国创长片新作腾讯视频贡献 5.2 亿，占比 82%，是主要播放来源。B 站新作播放降至 0.7 亿，同比下降 82%。同期全网新片供给 27 部，腾讯独播 16 部，独播供给显著领先。2）玄幻、奇幻仍是新作主要题材；长线 IP 续作占据新作主力，纯新 IP 难突围。3）新作中头部内容供给量稳定，但档内差距依然显著：26Q2 与 25Q2 均有 3 部新作进入千万级集均播放，头部第一名与同档其他作品仍存在明显断层。</li>
                <li><strong>国创头部内容：</strong>TOP50 国创长片有效播放跌幅超大盘，同比 -20% vs 国创大盘同比 -12%。进一步下拆发现下滑主要由 TOP11-50 内容贡献，国创用户消费进一步向少数长线头部内容集中。分平台看，腾讯头部老作播放下滑，新进榜多为腰尾部，内容补位不足；B 站《凡人修仙传》《牧神记》持续增长，但其他头部内容播放水位下降；优酷头部内容池相比去年明显扩容，《光阴之外》等多部内容进入 TOP50，长线 IP《沧元图》《师兄啊师兄》播放也大幅提升。</li>
              </ol>
            </li>
          </ol>
        </li>
        <li><strong>横屏剧集：</strong>
          <ol>
            <li><strong>横屏长剧：</strong>1）<strong>用户继续流失，</strong>26Q2 热播剧播放 152 亿（-15%），TOP10 长剧集均 V30 下降 20%。2）<strong>芒果TV少量回升，</strong>主要来自 2 部高投入的独家剧集《良陈美锦》《耀眼》，局部供给驱动增长，但不影响大盘下行。3）<strong>头部内容中，古偶仍是基本盘 5/10，</strong>但没有超级爆款，<strong>TOP2 为悬疑和年代剧的高口碑内容</strong>（豆瓣 8+）——《低智商犯罪》《主角》。</li>
            <li><strong>横屏短剧：</strong><strong>大盘有所回升，</strong>但主要由爱奇艺头部定制《灵魂摆渡·十年》单个内容带动，其他内容水位较低。</li>
          </ol>
        </li>
        <li><strong>综艺：热播综艺触底平稳，播放小幅回升（+8%），</strong>主要来自头部综 N 代播放上涨，《五哈6》作为 TOP1 综艺，占 TOP10 整体播放的 34%；榜单继续由综 N 代主导，唯一进入 TOP10 的新综艺为演技综艺，<strong>无模式创新。</strong></li>
        <li><strong>电影：26Q2 新上新院线电影播放 9.8 亿，</strong>同比 -8%。<strong>B 站覆盖院线新片 TOP50 中的 33 部，</strong>覆盖率升至 66%，单片份额较高的仍为动画电影和海外片。院线票房 26Q2 54.8 亿，仍处低位，<strong>后续线上新供给继续承压。</strong></li>
        <li><strong>纪录片：</strong>26Q2 月榜 TOP 内容主要题材为<strong>职业纪实、医疗、自然</strong>；头部内容中<strong>B 站覆盖率高，仅 2 部作品 B 站没有播出</strong>（《十三邀》《了不起的妈妈》）。</li>
      </ol>
  </>;
}

function AiSummaryContent() {
  return <>
    <h2>现状总结</h2>
    <ul>
      <li><strong>OGV 平台的 AI 内容仍处于验证期。</strong>头部精品项目预计到 2026 年底至 2027 年陆续交付，部分内容预告质量较高，但内容效果和商业回报尚待验证；腰尾部分账内容 Q2 上线 6 部，但仅体现制作降本，尚未带来播放、收入或商业模式上的突破。</li>
      <li><strong>反而是抖音等 UGC 平台，AI 内容已跑通变现、快速增长中，头部内容开始精品化。</strong>抖音 AI 创作者通过商单和激励初步跑通变现，MCN 在加速入场，进入加速增长阶段。在 AI 大赛等活动引导下，头部内容从猎奇和视觉刺激转向精品原创剧情，部分作品已接近优质 OGV 水准，并进一步催生 AI 偶像、AI 演员等新内容形态。AI 正在把过去成本过高、难以形成 UGC 供给的内容，转化为规模化的新供给。</li>
    </ul>

    <h2>趋势判断</h2>
    <ul>
      <li><strong>AI 目前对 OGV 只是生产的边际改善，难转化为供给收入增长。</strong>各平台仍沿用“头部定制、腰尾部分账”的传统模式，供给方、规模和质量均未发生变化；平台也在尝试引入 UGC 创作者，但中心化分发不适配高频长尾的 UGC 内容。OGV 的瓶颈不只在 AI 能力，而在原有供给与分发机制。</li>
      <li><strong>下个阶段的关键是争夺优质 AI 原生创作者。</strong>AI 原生创作者仍在快速增长阶段，可以提供稳定分发和变现的平台，能更快吸引到这波增量创作者。目前来看，OGV 平台只是用 AI 优化旧内容体系，而抖音等 UGC 平台是在批量吸引 AI 新供给。</li>
    </ul>

    <h2>OGV — AI 内容仍处于验证期</h2>
    <ul>
      <li><strong>AI 影视（剧集 / 电影）：</strong>
        <ul>
          <li>平台投资的精品剧集 / 电影仍在尝试阶段，2026 年底至 2027 年初可见成品，效果待验证。爱奇艺、腾讯投入最大，规划数量在几十部，欢娱传媒、长信传媒等头部公司参与；其中欢娱有 3 部预告片上线，题材市场化，剧情和叙事节奏优质，画面相比原有实拍内容有突破，需要持续关注。</li>
          <li>分账剧集 / 电影 Q2 已有 5 部 AI 内容上线，只降本无提效，无商业模式和收入突破。原有分账玩家在尝试 AI 剧集、AI 网络电影，题材以志怪、悬疑、甜宠等传统题材为主，商业模式依然是会员 + 分账；成片效果看只有降本没有增效，也没有带来更高收入。</li>
        </ul>
      </li>
      <li><strong>AI 横屏动画：</strong>
        <ul>
          <li>头部的单点项目可依靠 AI 提效，主要为年番 IP，如腾讯《斗罗大陆》、爱奇艺《无敌剑域》。</li>
          <li>腰尾部走原有分账模式。爱奇艺、腾讯、优酷均发布专门针对横屏 AI 动画的分账规则，但整体供给偏腰尾部内容填充（1–2k / min，各平台日供几十到几百部）。</li>
        </ul>
      </li>
      <li><strong>AI 综艺、AI 互动内容：</strong>仍在创新品类尝试中。AI 互动影游方面，腾讯有 400 万成本的末世题材立项；爱奇艺、腾讯视频、阿里等均发布互动影游制作相关工具和能力。AI 综艺主要由芒果尝试，纯原创 AI 综艺《幻音歌手》等正在规划。</li>
      <li><strong>竖屏 AI 短剧：</strong>各家均在批量化布局。</li>
    </ul>

    <h2>UGC — 实现了 AI 内容供给、商业化与质量的突破</h2>
    <ul>
      <li><strong>创作者：抖音 AIGC 创作者增速快，且已经靠商单和平台激励跑通变现。</strong>
        <ul>
          <li>6 月 AI 创作者：抖音 8.4 万（1 万粉以上，环比增速 30%）、B 站 5.4 万（1 千粉以上），B 站占整体 40%。</li>
          <li>抖音正在持续激励优质 AI 创作者，现金激励高于真人内容，并持续举办活动、大赛和签约创作者。</li>
          <li>抖音 AI 账号相比真人账号涨粉快、成本低，变现已经跑通；头部 AI 账号月收入可超过百万元（商单 80%、激励 20%）。头部 MCN 已经入场：麦芽以 40 人团队运营 200 个 AI 账号，蜂群以 30 人团队运营 200 多个 AI 账号，且均以抖音为主阵地。</li>
        </ul>
      </li>
      <li><strong>头部内容：抖音 AI 内容正在逐渐精品化，已区别于早期依靠视觉刺激、短平快消费的内容。</strong>
        <ul>
          <li>AI 影视、AI 二次元内容最多，占头部内容的 60%；其中精品原创剧情内容已占 30%（工业化内容占比 35%），并出现《被裁掉的女孩》《万物生》等超头部连载内容，制作和剧情水平具备超过头部 OGV 内容的潜力。</li>
          <li>AI 偶像、AI 演员值得关注。大量 AI 虚拟人账号已开始依靠 AI 剧情、综艺内容起号，如《被裁掉的女孩》主演方桃子个人账号粉丝量 40 万，《十万个挑战》综艺主理人账号粉丝量 216 万。</li>
        </ul>
      </li>
      <li><strong>短漫剧：制作降本带来 AI 短漫剧供给的持续增长，但内容题材无明显突破。</strong>
        <ul>
          <li>AI 短漫剧的供给持续增长，持续挤压真人短剧和 2D 漫市场；受平台监管政策影响，Q2 供给有小幅回落。</li>
          <li>内容题材仍然沿用爽文范式，未打开精品内容天花板。</li>
        </ul>
      </li>
    </ul>
  </>;
}

export function QuarterSummary() {
  return <div className="quarter-summary-list">
    <SummaryDocument title="OGV市场本季判断" contentId="quarter-summary-ogv" contentKey="ogv-market-review:26q2:quarter-summary-ogv"><OgvSummaryContent /></SummaryDocument>
    <HideIn26Q3><SummaryDocument title="AI 内容本季判断" contentId="quarter-summary-ai" contentKey="ogv-market-review:26q2:quarter-summary-ai"><AiSummaryContent /></SummaryDocument></HideIn26Q3>
  </div>;
}
