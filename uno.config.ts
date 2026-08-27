import { defineConfig, presetWind3, transformerVariantGroup } from 'unocss'

export default defineConfig({
  theme: {
    colors: {
      primary: '#2f6fed',
      'primary-hover': '#245fd1',
      success: '#22a06b',
      warning: '#d78a12',
      danger: '#c83b3b',
      'text-strong': '#172033',
      text: '#344054',
      muted: '#778195',
      'border-strong': '#d3d8e2',
      border: '#e5e8ee',
      surface: '#ffffff',
      canvas: '#f6f7f9',
    },
  },
  shortcuts: [
    {
      'color-base': 'text-text',
      'bg-base': 'bg-surface',
      'bg-secondary': 'bg-canvas',
      'border-base': 'border-border',
      'control-label': 'mt-2 text-xs font-600 text-text',
      'text-caption': 'text-[11px] text-muted',
      'status-center': 'h-full w-full flex flex-col items-center justify-center gap-2 p-8 text-center text-muted',
      'table-cell': 'h-full min-w-0 flex flex-none items-center overflow-hidden border-r border-border px-3 text-xs text-text whitespace-nowrap text-ellipsis select-text',
      'z-alert': 'z-10',
      'focus-ring': 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/38 focus-visible:ring-offset-2',
      'workbench-sidebar-elevation': 'relative z-20 shadow-[6px_0_18px_-10px_rgba(23,32,51,0.22)]',
      'workbench-header-elevation': 'relative z-10 shadow-[0_6px_18px_-10px_rgba(23,32,51,0.22)]',
    },
  ],
  presets: [presetWind3()],
  transformers: [transformerVariantGroup()],
  preflights: [
    {
      getCSS: () => `
        :root {
          color: #344054;
          background: #f6f7f9;
          font-family: "Noto Sans SC Variable", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
          font-size: 16px;
          font-synthesis: none;
          line-height: 1.5;
          text-rendering: optimizeLegibility;
          letter-spacing: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          --el-color-primary: #2f6fed;
          --el-color-success: #22a06b;
          --el-color-warning: #d78a12;
          --el-border-radius-base: 5px;
          --el-font-size-base: 12px;
        }

        *, *::before, *::after { box-sizing: border-box; }
        html, body, #app { min-width: 0; min-height: 100%; margin: 0; }
        body { min-height: 100vh; overflow: hidden; font-size: 14px; }
        button, input, select, textarea { font: inherit; letter-spacing: 0; }
        button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible {
          outline: 2px solid rgb(47 111 237 / 38%);
          outline-offset: 2px;
        }
        .el-button, .el-tag, .el-input, .el-select, .el-radio-button, .el-checkbox, .el-segmented { letter-spacing: 0; }
      `,
    },
  ],
})
