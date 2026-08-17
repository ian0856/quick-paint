# 浏览器本地表格解析、图表渲染与 PNG 导出基础

研究日期：2026-08-17  
对应决策票：[选择浏览器本地表格解析、图表渲染与 PNG 导出基础](https://github.com/ian0856/quick-paint/issues/2)

## 结论

MVP 采用以下组合：

- **Data Source 解析：SheetJS Community Edition 0.20.3**，从官方 CDN 的固定版本 tarball 安装，不使用 npm registry 上的 `xlsx@0.18.5`。浏览器用 `File.arrayBuffer()` 读取，再以 `XLSX.read` 解析；用 `workbook.SheetNames` 列出 Worksheet，并用 `XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: true, defval: null })` 建立统一的二维值模型。
- **Chart Composition 渲染：Chart.js 4.5.1**，直接使用核心 API，并只注册柱状图、折线图、饼图、散点图所需 controller、element、scale 和 plugin。不引入 Vue wrapper。
- **Chart Image 导出：同一 Chart.js Canvas 的离屏导出实例**。为导出创建固定 CSS 尺寸的 Canvas，设置 `responsive: false`、`animation: false` 和明确的 `devicePixelRatio`，渲染完成后调用 `canvas.toBlob(..., "image/png")`，再通过临时 object URL 下载。产品的“尺寸”定义为最终 PNG 的像素宽高；若以后增加倍率，倍率应作为另一个明确设置，而不是暗中采用屏幕 DPR。
- **执行边界：完全浏览器本地、静态资源自托管、无运行时 CDN/网络请求**。解析先在主线程实现，但接口须允许在超过阈值后迁到 Web Worker。

这套组合以 MVP 的四种基础图表为边界。与 ECharts 相比，Chart.js 的按需生产 bundle 在本次同条件测量中少约 **129 KiB gzip**；Chart.js 同样原生覆盖四种图表、TypeScript 类型、像素倍率和 Canvas 导出，因此 ECharts 的额外能力不足以抵消首屏成本。若原型发现中文标签布局、数据量或编辑交互明显达不到验收要求，再切换 ECharts，而不是同时携带两个引擎。

## 决策依据

### Data Source 解析

| 候选 | 能力和类型 | 许可证 | 本次 bundle 测量 | 判断 |
| --- | --- | --- | ---: | --- |
| SheetJS CE 0.20.3 | 浏览器 `ArrayBuffer` 解析 `.xlsx`/CSV；`SheetNames` 和 `Sheets` 覆盖多 Worksheet；包内含类型声明 | Apache-2.0 | 370,945 B min / 123,242 B gzip | **选择**。单库统一两种输入，解析面最贴合 MVP |
| ExcelJS 4.4.0 | 浏览器 bundle、XLSX/CSV、Worksheet API、包内类型声明 | MIT | 948,925 B min / 269,261 B gzip | 不选。偏向完整工作簿读写/样式能力，MVP 用不到，体积约为 SheetJS 的 2.2 倍 gzip |
| Papa Parse 5.6.0（仅 CSV） | CSV 解析、分块和 worker 能力；包本身没有 `types` 字段，需要额外类型包或本地声明 | MIT | 19,139 B min / 7,147 B gzip | 暂不加入。只有 CSV 大文件成为实际瓶颈时才值得引入第二套解析路径 |

SheetJS 官方浏览器示例明确使用 `arrayBuffer()` + `XLSX.read`，并用 `SheetNames` 选择 Worksheet；浏览器原生 `Blob.arrayBuffer()` 自 2021 年 4 月起属于 MDN Baseline，且可在 Web Worker 中使用。[SheetJS import 示例](https://docs.sheetjs.com/docs/getting-started/examples/import) [MDN Blob.arrayBuffer](https://developer.mozilla.org/en-US/docs/Web/API/Blob/arrayBuffer)

`sheet_to_json` 可用 `header: 1` 返回 `any[][]`，`raw` 控制原始值，`defval` 填充空值；但官方文档明确指出它**不做字段验证**。因此输出必须经过本项目自己的行列上限、表头规范化和可制图类型推断，不能把 SheetJS 的返回类型当成已验证领域对象。[SheetJS Arrays of Data](https://docs.sheetjs.com/docs/api/utilities/array/)

CSV 继续走 SheetJS 的明文解析器，以保持 Worksheet 模型一致。解析器会启发式识别 CSV/TSV/PSV，并支持 `FS` 强制分隔符；这意味着原型必须覆盖 UTF-8 BOM、中文、引号换行、逗号/分号/Tab、空列和重复表头，不能假设所有 `.csv` 都是逗号 UTF-8。[SheetJS parse options：Plaintext / DSV](https://docs.sheetjs.com/docs/api/parse-options/)

### 图表渲染

| 候选 | 四种图表 | 类型 / 按需加载 | PNG 与清晰度 | 许可证 | 本次 bundle 测量 | 判断 |
| --- | --- | --- | --- | --- | ---: | --- |
| Chart.js 4.5.1 | 原生支持 bar、line、pie、scatter | 包内类型；官方列出每种图所需注册项，可 tree-shake | Canvas；`toBase64Image`；`devicePixelRatio` 可覆盖屏幕默认值 | MIT | 187,406 B min / 64,750 B gzip | **选择**。MVP 能力完整且体积最低 |
| Apache ECharts 6.1.0 | 原生支持 bar、line、pie、scatter | 包内类型；`echarts/core` + 按需 `use` | Canvas/SVG；`getDataURL` 接受 PNG、`pixelRatio`、背景色；初始化接受宽高和 DPR | Apache-2.0 | 571,264 B min / 194,120 B gzip | 备选。中文生态和复杂可视化更强，但当前多约 129 KiB gzip |

Chart.js 官方集成文档确认其可 tree-shake，并逐项列出 bar/line/pie/scatter 所需的 controller、element 和 scale；官方 API 提供 `toBase64Image`，DPR 配置页说明非 1 值会按容器尺寸放大实际 Canvas。[Chart.js integration](https://www.chartjs.org/docs/latest/getting-started/integration.html) [Chart.js API](https://www.chartjs.org/docs/latest/developers/api.html) [Chart.js device pixel ratio](https://www.chartjs.org/docs/latest/configuration/device-pixel-ratio.html)

ECharts 是合格的替代方案。官方建议从 `echarts/core` 按需引入并明确注册 renderer；源码中的 `init` 选项包含 `width`、`height`、`devicePixelRatio`，`getDataURL` 接受 `type`、`pixelRatio`、`backgroundColor`。其官方 renderer 指南认为 Canvas 更适合大量元素，SVG 更省内存且缩放不模糊。[ECharts import](https://echarts.apache.org/handbook/en/basics/import/) [ECharts core source](https://github.com/apache/echarts/blob/6.1.0/src/core/echarts.ts) [Canvas vs SVG](https://echarts.apache.org/handbook/en/best-practices/canvas-vs-svg/)

本次不选 ECharts 的原因是需求没有地图、关系图、复杂坐标系或 SVG 导出。若产品范围扩展，必须重做评估，不能把当前结论外推到完整数据可视化平台。

### 体积测量方法

数字不是 npm tarball/unpacked size，而是从应用实际 import 入口生成的生产 bundle，便于横向比较：

1. 安装 `esbuild@0.25.9`、SheetJS 官方 `xlsx-0.20.3.tgz`、`echarts@6.1.0`、`chart.js@4.5.1`、`exceljs@4.4.0`、`papaparse@5.6.0`。
2. 使用 `esbuild --bundle --format=esm --platform=browser --minify`。
3. SheetJS import `read` 和 `utils`；Chart.js 注册四类图的最低组件及 Title/Tooltip/Legend；ECharts 注册四类图、Grid/Title/Tooltip/Legend/Dataset 与 CanvasRenderer；ExcelJS、Papa Parse 使用默认入口。
4. 用 `gzip -9 -c` 记录 gzip 字节数。

| 入口 | minified | gzip -9 |
| --- | ---: | ---: |
| SheetJS CE 0.20.3 | 370,945 B | 123,242 B |
| ExcelJS 4.4.0 | 948,925 B | 269,261 B |
| Papa Parse 5.6.0 | 19,139 B | 7,147 B |
| Chart.js 4.5.1（四图按需） | 187,406 B | 64,750 B |
| ECharts 6.1.0（四图按需） | 571,264 B | 194,120 B |

这些数字只代表依赖基线，不是最终应用 chunk；真实 Vite 构建仍须在原型中复测。发布包元数据和许可证来自各自包及源码：[SheetJS package 0.20.3](https://cdn.sheetjs.com/xlsx-0.20.3/package/package.json) [Chart.js package](https://github.com/chartjs/Chart.js/blob/v4.5.1/package.json) [ECharts package](https://github.com/apache/echarts/blob/6.1.0/package.json) [ExcelJS package](https://github.com/exceljs/exceljs/blob/v4.4.0/package.json) [Papa Parse package](https://github.com/mholt/PapaParse/blob/5.6.0/package.json)

## PNG 导出约定

导出不能直接截取工作台中响应式预览的 Canvas，否则屏幕 DPR、容器布局和动画时机会让像素尺寸不稳定。实现应：

1. 校验目标像素宽高和总像素数。
2. 创建不显示的专用 Canvas；将其逻辑宽高设为目标尺寸，`devicePixelRatio: 1`，关闭响应式和动画。
3. 用与预览相同的纯数据 Chart Composition 构建配置，等待字体就绪后渲染。
4. 优先 `canvas.toBlob(callback, "image/png")`，避免 `toDataURL` 为大图创建完整 base64 字符串；下载后立即回收 object URL 和 chart 实例。

浏览器必须支持 PNG Canvas 编码。MDN 同时指出 `toDataURL()` 会把整张图编码为内存字符串，大图有性能/URL 长度风险；Canvas 超过浏览器最大尺寸会返回 `"data:,"`，跨源像素会导致 `SecurityError`。[MDN HTMLCanvasElement.toDataURL](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL) [MDN HTMLCanvasElement.toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob)

因此 Chart Composition 中不得接受外部图片 URL；标题、字段名、颜色等都只能映射到受控 Chart.js 配置。若以后支持背景图，必须限定同源/本地 Blob，并新增 tainted-canvas 测试。

## 安全、CSP 与离线

### 依赖供应链

SheetJS 官方明确说明公共 npm registry 的 `xlsx` 已过期，最新只有 0.18.5，官方 CDN 才是权威来源；安装必须固定到 `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz` 并提交 lockfile，不能写 `xlsx@latest`。[SheetJS NodeJS installation](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/)

这不是单纯的新旧偏好：GitHub Advisory Database 记录 `xlsx < 0.19.3` 的高危 prototype pollution，以及 `< 0.20.2` 的高危 ReDoS；npm registry 的 0.18.5 落在两者范围内，而官方 0.20.3 越过修复边界。[GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6) [GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9)

SheetJS CE 0.20.3 和 ECharts 使用 Apache-2.0；Chart.js、ExcelJS、Papa Parse 使用 MIT。最终分发需保留依赖许可证/NOTICE 要求。[SheetJS LICENSE](https://git.sheetjs.com/SheetJS/sheetjs/src/tag/v0.20.3/LICENSE) [ECharts LICENSE](https://github.com/apache/echarts/blob/6.1.0/LICENSE) [Chart.js LICENSE](https://github.com/chartjs/Chart.js/blob/v4.5.1/LICENSE.md)

### 不可信 Data Source

- 将每个 Data Source 视为不可信二进制：上传前校验扩展名、MIME 仅作提示；解析捕获异常；设置文件字节、Worksheet、行、列、单元格和字符串长度上限；失败时清空旧状态。
- 不执行公式、宏或超链接。SheetJS `bookVBA` 默认是 `false`，即使开启也只是暴露原始 VBA blob，不解析执行；本项目保持关闭，并只读取计算缓存值/普通单元格值。[SheetJS parse options](https://docs.sheetjs.com/docs/api/parse-options/)
- 字段名和单元格字符串只以文本进入 Vue/Canvas。不得使用 `v-html`，不得从 Data Source 生成 formatter 函数、HTML、CSS、URL 或正则表达式。
- 即使未来改用 ECharts，也必须遵循其官方安全模型：ECharts 不自动清洗不可信输入，HTML tooltip、URL 和用户正则等 API 需要额外处理。[ECharts Security Guidelines](https://echarts.apache.org/handbook/en/best-practices/security/)

### CSP 与离线

两项依赖都应随应用打包并自托管，运行时不从 CDN 拉脚本、字体或资源。Chart.js 配置由应用代码构建，不解释用户代码；目标 CSP 可从 `default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; img-src 'self' blob: data:` 起步，再按 Vite 部署所需精化。MDN 说明 CSP 可禁用 inline script、inline handler 和 `eval()`；原型必须在不含 `'unsafe-eval'` / `'unsafe-inline'` 的生产构建下验证。[MDN CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)

本地处理的验收不只看“代码没有 fetch”：在 DevTools/Playwright 中清空网络缓存后离线重载，完成导入、Worksheet 切换、四图渲染和 PNG 下载；同时断言除应用自身静态资源外无请求。错误遥测若未来加入，不得包含文件名、表头、单元格或 Chart Composition 数据。

## 数据规模与浏览器兼容性

SheetJS 官方说明解析和写入会把整文件放入内存，浏览器又有严格内存限制；对于大文件，官方建议 Web Worker。[SheetJS Large Datasets](https://docs.sheetjs.com/docs/demos/bigdata/stream/) [SheetJS Web Workers](https://docs.sheetjs.com/docs/demos/bigdata/worker/)

所以 MVP 不应宣称支持 Excel 理论最大 Worksheet。先采用可测的保护策略，而不是伪造一个跨浏览器“安全上限”：

- 初始候选门槛：文件 20 MiB、每 Worksheet 100,000 行、200 列、可制图点 20,000；超过时拒绝或要求选择较小 Worksheet。**这些是待原型校准的产品阈值，不是库保证。**
- 用 `bookSheets: true` 先读元数据不能避免完整二次解析成本，但可用于早期 Worksheet 选择实验；`sheetRows` 可以限制读取行数，必须验证它对所需 Worksheet 和范围信息的影响。[SheetJS parse options](https://docs.sheetjs.com/docs/api/parse-options/)
- 解析耗时接近 100 ms 就会影响交互；原型需比较主线程与 Worker。`File` / `ArrayBuffer` 可传给 Worker，返回只需规范化二维值和诊断，不返回完整 SheetJS workbook。
- Chart.js 官方建议预先规范化数据、关闭动画，并对数万点折线做 decimation；也支持 OffscreenCanvas worker，但 DOM 插件/交互受限，MVP 暂不使用。[Chart.js performance](https://www.chartjs.org/docs/latest/general/performance.html)

支持范围定为当前稳定版 Chrome、Edge、Firefox、Safari 的桌面端；移动端仅查看。`Blob.arrayBuffer` 的 Baseline 足以支撑此范围，但具体最低版本应由项目的 Browserslist 和真实设备矩阵锁定。IE 不在范围内。Safari 的 Canvas 最大尺寸和内存行为需要单独测，不应从 Chromium 结果推断。

## 原型必须验证的风险

以下风险尚不能仅靠文档消除，后续原型应把结果写成可重复测试和明确阈值：

1. **SheetJS 安装与 Vite**：固定 CDN tarball 在干净安装、lockfile、类型检查、生产构建和依赖扫描中都可重复；确认无意外 Node polyfill 和 CSP 报错。
2. **解析正确性**：包含 Excel/LibreOffice/WPS 生成的多 Worksheet `.xlsx`，以及 UTF-8 BOM、中文、引号换行、分隔符差异、空行、重复/空表头、日期、百分比、公式缓存、错误值、隐藏 Worksheet 的 CSV/XLSX 样例矩阵。
3. **资源阈值**：在目标四浏览器测 1/5/10/20 MiB 与 1k/10k/100k 行的耗时、峰值内存、取消/失败恢复；据结果确认上限和 Worker 切换点。
4. **图表语义**：四图的字段映射、null/NaN、负值、长中文标签、重复分类、大数/小数、饼图零值，以及散点图 x/y 都为数值的错误提示。
5. **导出确定性**：至少覆盖 640x480、1200x675、1920x1080 和一个上限尺寸；在 DPR 1/2 屏幕上确认最终 PNG 像素完全一致、字体就绪、透明/背景色、无动画中间帧，并验证连续导出不会泄漏实例/object URL。
6. **Chart.js 与 ECharts 逃生门**：用同一高风险样例（20k 散点、10k 折线、长中文分类）比较帧时间、标签可读性和导出耗时。只有 Chart.js 不达验收门槛时才切换 ECharts。
7. **离线和安全**：生产 CSP 无 `unsafe-eval`/`unsafe-inline`；断网后全流程成功；恶意字段文本不能形成 HTML/URL/脚本；超大、损坏、加密或压缩异常的文件能快速失败并恢复 UI。

## 不在本决策内

- 不设计产品工作流、字段映射规则、自动推荐、清洗、聚合或持久化。
- 不实现服务端上传、远程字体/图片、JPEG/SVG/批量导出。
- 不承诺本节候选阈值；它们必须由原型测量后成为另一项明确决策。

