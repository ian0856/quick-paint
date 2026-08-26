# ECharts migration bundle impact

Issue #24 established the Chart.js workbench production chunk as `579.22 kB` minified and `192.55 kB` gzip. After replacing Chart.js and chartjs-plugin-datalabels with selectively registered ECharts 6.1.0 Bar, Line, title, legend, tooltip, grid, label-layout, and Canvas modules, the same chunk is `914.77 kB` minified and `305.42 kB` gzip.

The migration adds `335.55 kB` minified and `112.87 kB` gzip to the workbench chunk. The implementation imports from `echarts/core`, `echarts/charts`, `echarts/components`, `echarts/features`, and `echarts/renderers`; it does not import the preassembled `echarts` bundle.
