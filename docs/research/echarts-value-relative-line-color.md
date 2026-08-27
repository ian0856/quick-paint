# ECharts 折线按相对数值着色调研

## 结论

可以。Apache ECharts 6.1.0 的笛卡尔坐标折线可通过 `visualMap` 将 y 值映射为颜色：`continuous` 产生连续色阶，`piecewise` 按阈值产生离散色带。官方“Line Gradient”示例同时演示了沿 y 值和沿 x 位置的连续渐变；“Distribution of Electricity”示例演示了按 x 区间切换折线颜色。[Line Gradient](https://echarts.apache.org/examples/en/editor.html?c=line-gradient) · [Distribution of Electricity](https://echarts.apache.org/examples/en/editor.html?c=line-sections) · [视觉映射手册](https://echarts.apache.org/handbook/en/concepts/visual-map/)

这与 Quick Paint 当前的“渐变”含义不同。当前 `seriesGradient` 把一个固定的 `linear` 画刷从绘图包围盒左侧铺到右侧，所以颜色只随 x 像素位置变化，不读取数据值；低值出现在右侧时仍会得到右端颜色。[当前实现](../../src/views/workbench/utils/chartConfig.ts#L382-L406) · [`seriesGradient`](../../src/views/workbench/utils/chartConfig.ts#L461-L473)

## 三种机制

### 1. 静态 `LinearGradient`

`lineStyle.color` 接受线性渐变对象，其中 `x/y/x2/y2` 定义画刷方向，`colorStops[].offset` 定义画刷位置。这适合“从左到右逐渐变色”之类的空间效果，但 stop 与数据的最小值、最大值或阈值没有对应关系。Quick Paint 当前即为 `x: 0, y: 0, x2: 1, y2: 0, global: false` 的局部坐标渐变。

因此，单纯把画刷改成竖向只能得到“按 y 像素高度着色”的视觉近似；它不会建立可配置的数据值域，也没有 `visualMap` 的范围、阈值和维度语义。

### 2. 数据驱动的 `visualMap`

`visualMap` 定义“哪个数据维度映射到哪个视觉通道”；颜色是官方列出的可映射通道。连续映射用 `min`、`max` 和 `inRange.color` 建立线性色阶，分段映射用 `pieces`、`splitNumber` 或 `categories` 建立离散区间。[视觉映射手册](https://echarts.apache.org/handbook/en/concepts/visual-map/) · [`visualMap-continuous`](https://echarts.apache.org/en/option.html#visualMap-continuous) · [`visualMap-piecewise`](https://echarts.apache.org/en/option.html#visualMap-piecewise)

对折线而言，ECharts 6.1.0 会把 visualMap 生成的数值 stops 投影到对应的 x 或 y 轴坐标，再生成实际绘制折线的 `LinearGradient`。实现只接受 `cartesian2d`，且映射维度必须对应 x 或 y；极坐标折线不支持这种 line-style visual gradient。[`LineView.getVisualGradient`](https://github.com/apache/echarts/blob/6.1.0/src/chart/line/LineView.ts#L268-L367) · [visualMap 生成 `visualMeta`](https://github.com/apache/echarts/blob/6.1.0/src/component/visualMap/visualEncoding.ts#L52-L79)

连续映射在 stops 之间插值，所以线条随数值高度连续变色；分段映射在区间边界生成同色 stop 对，因此得到清晰的阈值色带，而不是平滑过渡。[连续 stops 实现](https://github.com/apache/echarts/blob/6.1.0/src/component/visualMap/ContinuousModel.ts#L245-L297) · [分段 stops 实现](https://github.com/apache/echarts/blob/6.1.0/src/component/visualMap/PiecewiseModel.ts#L353-L410)

### 3. 单点与单线段样式

折线数据项支持的是 `itemStyle`、标签和 symbol 等点样式，并不提供逐数据项的 `lineStyle`；`lineStyle` 属于整个 Line Series。因此给 `series.data[i].itemStyle.color` 赋值只会改变数据点，不能直接指定“点 i 到点 i+1”这段线的颜色。[ECharts 6.1.0 Line 类型定义](https://github.com/apache/echarts/blob/6.1.0/src/chart/line/LineSeries.ts#L56-L67) · [Series 级 `lineStyle`](https://github.com/apache/echarts/blob/6.1.0/src/chart/line/LineSeries.ts#L74-L121)

任意逐段规则可用多个 Line Series 拆线：每个系列只保留目标区间，并在相邻系列重复边界点以免断开；代价是图例、tooltip、强调状态和动画都要额外合并。更复杂的逐段绘制可使用 Custom Series 的 `renderItem`，但会承担坐标转换、交互和绘制实现成本。[Custom Series 官方手册](https://echarts.apache.org/handbook/en/how-to/custom-series/) · [`series-custom.renderItem`](https://echarts.apache.org/en/option.html#series-custom.renderItem)

## Quick Paint 的推荐映射

若产品语义是“每条系列内，较小值用浅色、较大值用系列基色”，应为每个开启 `seriesGradient` 的 Line Series 生成一个隐藏的 continuous visualMap：

```ts
visualMap: enabledSeries.map(({ seriesIndex, min, max, lightColor, baseColor }) => ({
  show: false,
  type: 'continuous',
  seriesIndex,
  dimension: 1,
  min,
  max,
  inRange: { color: [lightColor, baseColor] },
}))
```

这里应显式写 `dimension: 1`。Quick Paint 使用 category x 轴和标量 `series.data`；ECharts 会把该输入补成 `[categoryIndex, value]`，所以内部 x 为维度 0、y 值为维度 1。[category 数据补全实现](https://github.com/apache/echarts/blob/6.1.0/src/chart/helper/createSeriesData.ts#L161-L179) ECharts 未指定 `dimension` 时会从最后一个非计算维度开始选，但显式配置更能固定语义。[默认维度选择](https://github.com/apache/echarts/blob/6.1.0/src/component/visualMap/VisualMapModel.ts#L457-L472)

实现时还有四个关键点：

- `min` / `max` 应由每个系列的非 null 数值计算，才能表达“系列内相对大小”；若所有系列共用一组 `min` / `max`，表达的则是跨系列统一色标。
- 值域渐变模式下必须省略 `lineStyle.color` 和 `areaStyle.color`。ECharts 使用 `lineStyle` / `areaStyle` 的显式颜色优先，只在缺省时采用 visualMap 生成的 `visualColor`；保留当前颜色配置会让 visualMap 看似无效。[折线与面积颜色优先级](https://github.com/apache/echarts/blob/6.1.0/src/chart/line/LineView.ts#L828-L874)
- visualMap 默认也会把颜色应用到数据点。若产品仍要求 Point 和图例保持系列基色，可继续显式控制图例；Point 需要单独决定是随值变化，还是把数据项设为 `{ value, visualMap: false }` 并保留显式 `itemStyle`。ECharts 的 visualMap 编码阶段会跳过 `visualMap: false` 的数据项，但系列级 `visualMeta` 仍用于折线渐变。[数据项跳过逻辑](https://github.com/apache/echarts/blob/6.1.0/src/visual/visualSolution.ts#L167-L186) · [折线读取系列 `visualMeta`](https://github.com/apache/echarts/blob/6.1.0/src/chart/line/LineView.ts#L268-L322)
- 当前按需引入未注册 visualMap。连续方案需从 `echarts/components` 引入并向 `use()` 注册 `VisualMapContinuousComponent`，同时把 `VisualMapComponentOption` 纳入组合类型；分段方案则注册 `VisualMapPiecewiseComponent`。[ECharts 6.1.0 组件导出](https://github.com/apache/echarts/blob/6.1.0/src/export/components.ts#L55-L59)

常量系列没有“相对高低”。ECharts 对零跨度值域会取色阶中点，而不是产生从浅到深的变化；产品上更清晰的处理是回退为系列基色或固定中性色。[零跨度线性映射](https://github.com/apache/echarts/blob/6.1.0/src/util/number.ts#L67-L85)

## 建议

如果需求确实是“低值浅、高值深”，应将现有开关的实现从静态 x 向渐变改为每系列的 continuous visualMap，并把设置文案改成能体现“按数值着色”的名称。若需要“低 / 中 / 高”业务阈值，选择 piecewise visualMap；只有当颜色规则依赖相邻点、涨跌方向或每条线段的独立属性时，才考虑拆分系列或 Custom Series。
