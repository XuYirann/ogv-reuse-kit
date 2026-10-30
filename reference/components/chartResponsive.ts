import type * as echarts from "echarts";

export type ChartLayoutVariant = "plain" | "right-legend" | "wide-right-legend" | "end-label";

export type ChartLayoutSpec = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  variant?: ChartLayoutVariant;
  minRight?: number;
};

export function getChartLayout(width: number, spec: ChartLayoutSpec) {
  const compact = width < 520;
  const tight = width < 680;
  const keepsRightRail = spec.variant === "right-legend" || spec.variant === "wide-right-legend" || spec.variant === "end-label";
  const rightRail = keepsRightRail ? Math.max(spec.minRight ?? spec.right, spec.right) : spec.right;
  return {
    grid: {
      left: compact ? Math.min(spec.left, 38) : tight ? Math.min(spec.left, 44) : spec.left,
      right: rightRail,
      top: spec.top,
      bottom: spec.bottom,
    },
    axisFontSize: compact ? 8 : tight ? 9 : 10,
    barMaxWidth: compact ? 24 : tight ? 30 : 38,
  };
}

export function resizeResponsiveChart(
  chart: echarts.ECharts,
  element: HTMLElement,
  spec: ChartLayoutSpec,
  redraw?: () => void,
) {
  const width = element.getBoundingClientRect().width;
  if (!width) return;
  requestAnimationFrame(() => {
    if (!element.isConnected) return;
    const settledWidth = element.getBoundingClientRect().width;
    if (!settledWidth) return;
    chart.setOption({ grid: getChartLayout(settledWidth, spec).grid }, { silent: true });
    chart.resize({ width: Math.floor(settledWidth) });
    if (redraw) requestAnimationFrame(redraw);
  });
}
