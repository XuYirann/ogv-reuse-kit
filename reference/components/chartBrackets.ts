import * as echarts from "echarts";

export type BracketComparison = {
  previousIndex: number;
  currentIndex: number;
  previousValue: number;
  currentValue: number;
  label: string;
  color?: string;
  level?: number;
  xAxisIndex?: number;
  yAxisIndex?: number;
  xOffset?: number;
  targetGap?: number;
  variant?: "bracket" | "difference" | "sideLabel" | "barCallout";
  labelFontSize?: number;
  labelYShift?: number;
  labelY?: number;
  arrowOffset?: number;
  barHalfWidth?: number;
  title?: string;
  swatchColor?: string;
  legendWidth?: number;
  legendRightInset?: number;
};

export function setBracketAnnotations(chart: echarts.ECharts, comparisons: BracketComparison[]) {
  const graphics: echarts.GraphicComponentOption[] = [];
  comparisons.forEach((item, index) => {
    const xAxisIndex = item.xAxisIndex ?? 0;
    const yAxisIndex = item.yAxisIndex ?? 0;
    const previous = chart.convertToPixel({ xAxisIndex, yAxisIndex }, [item.previousIndex, item.previousValue]);
    const current = chart.convertToPixel({ xAxisIndex, yAxisIndex }, [item.currentIndex, item.currentValue]);
    if (!Array.isArray(previous) || !Array.isArray(current) || previous.some(Number.isNaN) || current.some(Number.isNaN)) return;
    const color = item.color ?? "#aeb5b0";
    const xOffset = item.xOffset ?? 0;
    const targetGap = item.targetGap ?? 20;
    previous[0] += xOffset;
    current[0] += xOffset;
    const lift = 24 + (item.level ?? 0) * 22;
    const topY = Math.min(previous[1], current[1]) - targetGap - lift;
    const previousEndY = previous[1] - targetGap;
    const currentEndY = current[1] - targetGap;
    const midX = (previous[0] + current[0]) / 2;
    const labelFontSize = item.labelFontSize ?? 8;
    const bubbleHeight = labelFontSize + 10;
    const bubbleWidth = Math.max(36, item.label.length * (labelFontSize * .92) + 14);
    const trendColor = item.label.includes("+") ? "#161917" : "#c74337";
    if (item.variant === "sideLabel") {
      const sideLegendFontSize = 12;
      const legendWidth = item.legendWidth ?? 96;
      const rightInset = item.legendRightInset ?? 6;
      const labelX = Math.max(4, chart.getWidth() - legendWidth - rightInset + (item.xOffset ?? 0));
      const labelY = item.labelY ?? current[1] + (item.labelYShift ?? 0);
      graphics.push({
        id: `comparison-${index}`,
        type: "group",
        silent: true,
        zlevel: 100,
        z: 100,
        children: [
          { type: "rect", shape: { x: labelX, y: labelY - 14, width: 9, height: 9 }, style: { fill: item.swatchColor ?? color } },
          { type: "text", style: { x: labelX + 16, y: labelY - 10, text: item.title ?? "", fill: item.swatchColor ?? "#33403a", font: `600 ${sideLegendFontSize}px sans-serif`, textAlign: "left", textVerticalAlign: "middle" } },
          { type: "text", style: { x: labelX + 16, y: labelY + 7, text: item.label, fill: trendColor, font: `600 ${sideLegendFontSize}px sans-serif`, textAlign: "left", textVerticalAlign: "middle" } },
        ],
      });
      return;
    }
    if (item.variant === "barCallout") {
      const labelY = current[1] + (item.labelYShift ?? 0);
      const barEdgeX = current[0] + (item.barHalfWidth ?? 18);
      const elbowX = current[0] + (item.arrowOffset ?? 25);
      const labelX = elbowX + 5;
      graphics.push({
        id: `comparison-${index}`,
        type: "group",
        silent: true,
        zlevel: 100,
        z: 100,
        children: [
          { type: "polyline", shape: { points: [[barEdgeX, current[1]], [elbowX, current[1]], [elbowX, labelY], [labelX - 2, labelY]] }, style: { stroke: color, lineWidth: 1, fill: "none" } },
          { type: "text", style: { x: labelX, y: labelY, text: item.label, fill: "#263038", font: `500 ${labelFontSize}px sans-serif`, lineHeight: labelFontSize + 2, textAlign: "left", textVerticalAlign: "middle" } },
        ],
      });
      return;
    }
    if (item.variant === "difference") {
      const arrowX = current[0] + (item.arrowOffset ?? 28);
      const bubbleX = Math.min(arrowX + 6, chart.getWidth() - bubbleWidth - 6);
      const descending = current[1] > previous[1];
      const arrowY = current[1] - 3;
      const labelY = (previous[1] + current[1]) / 2 + (item.labelYShift ?? 0);
      const arrowPoints = descending
        ? [[arrowX - 4, arrowY - 7], [arrowX + 4, arrowY - 7], [arrowX, arrowY]]
        : [[arrowX - 4, arrowY + 7], [arrowX + 4, arrowY + 7], [arrowX, arrowY]];
      graphics.push({
        id: `comparison-${index}`,
        type: "group",
        silent: true,
        zlevel: 100,
        z: 100,
        children: [
          { type: "line", shape: { x1: previous[0], y1: previous[1], x2: arrowX, y2: previous[1] }, style: { stroke: "#68716b", lineWidth: 1.1, lineDash: [4, 3] } },
          { type: "line", shape: { x1: current[0], y1: current[1], x2: arrowX, y2: current[1] }, style: { stroke: "#68716b", lineWidth: 1.1, lineDash: [4, 3] } },
          { type: "line", shape: { x1: arrowX, y1: previous[1], x2: arrowX, y2: arrowY }, style: { stroke: trendColor, lineWidth: 1.8 } },
          { type: "polygon", shape: { points: arrowPoints }, style: { fill: trendColor } },
          { type: "rect", shape: { x: bubbleX, y: labelY - bubbleHeight / 2, width: bubbleWidth, height: bubbleHeight, r: bubbleHeight / 2 }, style: { fill: "#fbfcf9", stroke: "#c9ceca", lineWidth: 1 } },
          { type: "text", style: { x: bubbleX + bubbleWidth / 2, y: labelY, text: item.label, fill: trendColor, font: `600 ${labelFontSize}px sans-serif`, textAlign: "center", textVerticalAlign: "middle" } },
        ],
      });
      return;
    }
    graphics.push({
      id: `comparison-${index}`,
      type: "group",
      silent: true,
      zlevel: 100,
      z: 100,
      children: [
        { type: "polyline", shape: { points: [[previous[0], previousEndY], [previous[0], topY], [current[0], topY], [current[0], currentEndY - 4]] }, style: { stroke: color, lineWidth: 1.25, fill: "none" } },
        { type: "polygon", shape: { points: [[current[0] - 4, currentEndY - 8], [current[0] + 4, currentEndY - 8], [current[0], currentEndY - 1]] }, style: { fill: color } },
        { type: "rect", shape: { x: midX - bubbleWidth / 2, y: topY - bubbleHeight / 2, width: bubbleWidth, height: bubbleHeight, r: bubbleHeight / 2 }, style: { fill: "#fbfcf9", stroke: "#c9ceca", lineWidth: 1 } },
        { type: "text", style: { x: midX, y: topY, text: item.label, fill: trendColor, font: `600 ${labelFontSize}px sans-serif`, textAlign: "center", textVerticalAlign: "middle" } },
      ],
    });
  });
  chart.setOption({ graphic: graphics }, { replaceMerge: ["graphic"], silent: true });
}
