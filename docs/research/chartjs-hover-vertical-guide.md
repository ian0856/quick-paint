# Chart.js hover 竖直虚线调研

## 结论

Chart.js 4.5.1 没有用于“hover 到折线图 Point 时绘制竖直虚线”的内置配置。官方 Line Chart 配置只提供折线、Point 及其 hover 样式；其中 `borderDash` 控制的是数据折线本身，不是 hover guide。官方将额外绘制行为放在 Plugin API 中，因此这里应使用一个小型内联插件。[Line Chart 配置](https://www.chartjs.org/docs/4.5.1/charts/line.html#dataset-properties) · [Element 配置](https://www.chartjs.org/docs/4.5.1/configuration/elements.html#line-configuration) · [Plugin 文档](https://www.chartjs.org/docs/4.5.1/developers/plugins.html)

`interaction.mode: 'x'` 的官方说明虽然称其适合实现 vertical cursor，但该选项只决定哪些元素进入 active 集合，并不绘制 cursor。[Interaction modes: x](https://www.chartjs.org/docs/4.5.1/configuration/interactions.html#x)

Quick Paint 已使用 `interaction: { mode: 'index', intersect: false }`。在此模式下，Chart.js 取 x 方向最近元素的数据索引，并返回同一索引的元素；全局 interaction 配置默认同时作用于 hover 和 tooltip。因此无需改为 `mode: 'x'`，现有配置已经满足“同一 Record 的所有 Value Series”与 guide 共用索引的要求。[Interaction modes: index](https://www.chartjs.org/docs/4.5.1/configuration/interactions.html#index) · [hover 与 tooltip 配置继承](https://www.chartjs.org/docs/4.5.1/configuration/interactions.html#modes)

## 最小插件方案

推荐在 `afterDatasetsDraw` 中绘制：数据集已经完成绘制，而 Chart.js 内置 tooltip 在稍后的 `afterDraw` 阶段绘制，所以 guide 可覆盖折线但不会盖住 tooltip。[Plugin hook 类型](https://github.com/chartjs/Chart.js/blob/v4.5.1/src/types/index.d.ts#L1019-L1052) · [Chart 绘制顺序](https://github.com/chartjs/Chart.js/blob/v4.5.1/src/core/core.controller.js#L698-L731) · [Tooltip 的 `afterDraw`](https://github.com/chartjs/Chart.js/blob/v4.5.1/src/plugins/plugin.tooltip.js#L1246-L1262)

```ts
import type { Plugin } from 'chart.js'

const verticalHoverGuide: Plugin<'line'> = {
  id: 'vertical-hover-guide',
  afterDatasetsDraw(chart) {
    // 以 tooltip 的 active 集合为准，确保 guide 和 tooltip 使用同一交互结果；
    // tooltip 未启用时仍可退回普通 hover active 集合。
    const active = chart.tooltip?.getActiveElements() ?? chart.getActiveElements()
    const x = active[0]?.element.x
    if (typeof x !== 'number') return

    const { ctx, chartArea: { top, bottom, left, right } } = chart
    if (x < left || x > right) return

    ctx.save()
    ctx.beginPath()
    ctx.setLineDash([4, 4])
    ctx.lineWidth = 1
    ctx.strokeStyle = '#98a2b3'
    ctx.moveTo(x, top)
    ctx.lineTo(x, bottom)
    ctx.stroke()
    ctx.restore()
  },
}
```

`Chart#getActiveElements()` 返回当前 hovered elements；`TooltipModel#getActiveElements()` 返回 tooltip 自己的 active elements。二者均返回带 `datasetIndex`、`index` 和 `element` 的 `ActiveElement[]`。当 tooltip 的 interaction 配置将来被独立覆盖时，优先读 tooltip 集合可避免 guide 与 tooltip 指向不同 Record。[Chart/ActiveElement 类型](https://github.com/chartjs/Chart.js/blob/v4.5.1/src/types/index.d.ts#L489-L546) · [TooltipModel 类型](https://github.com/chartjs/Chart.js/blob/v4.5.1/src/types/index.d.ts#L2647-L2655) · [Tooltip active-elements 实现](https://github.com/chartjs/Chart.js/blob/v4.5.1/src/plugins/plugin.tooltip.js#L1093-L1129)

active 集合中的首个元素即可提供 indexed interaction 的 x 像素坐标；竖线端点应使用 `chart.chartArea.top` 和 `chart.chartArea.bottom`，而不是整个 canvas 高度，以免穿过标题、图例和 x 轴标签。`ChartArea` 明确定义了 `top/right/bottom/left` 边界。[Chart 的 `chartArea` 与 active API](https://github.com/chartjs/Chart.js/blob/v4.5.1/src/types/index.d.ts#L499-L546) · [ChartArea 类型](https://github.com/chartjs/Chart.js/blob/v4.5.1/src/types/geometric.d.ts#L1-L8)

`setLineDash` 会改变共享 canvas context 的绘图状态，所以应像 Chart.js 官方插件示例一样用 `ctx.save()` / `ctx.restore()` 包住全部样式和绘制操作，防止后续折线、坐标轴或 tooltip 继承虚线样式。[官方自定义 canvas 插件示例](https://www.chartjs.org/docs/4.5.1/developers/plugins.html#plugin-defaults) · [Chart.js 4.5.1 的 `save → setLineDash → restore`](https://github.com/chartjs/Chart.js/blob/v4.5.1/src/core/core.scale.js#L1474-L1489)

## 产品边界建议

该 guide 是 hover 反馈，应只注册到响应式预览，不应注册到 PNG 导出。导出 Chart 没有指针事件和 active element，插件通常不会画出任何内容；但明确保持 preview-only 更能表达语义，也避免未来通过程序设置 active elements 时把瞬时交互状态写入 Chart Image。Chart.js 支持按 Chart 实例传入内联插件，正适合这种预览/导出分流。[每实例 inline plugin](https://www.chartjs.org/docs/4.5.1/developers/plugins.html#using-plugins) · [程序化 active elements API](https://www.chartjs.org/docs/4.5.1/samples/advanced/programmatic-events.html)

因此，Quick Paint 应在非 `forExport` 的 Line Chart 配置中加入该插件；Bar Chart 与 export 配置均不加入。现有 `createChartConfig` 已通过 `forExport` 区分实例插件，适合在该边界实现。[项目 Chart 配置](../../src/views/workbench/utils/chartConfig.ts) · [项目导出器](../../src/views/workbench/utils/chartExporter.ts)
