export const fieldOptions = [
  { value: 'month', label: '月份', kind: '文本', detail: '6 个文本 · 无缺失', numeric: false },
  { value: 'east', label: '华东', kind: '数字', detail: '6 个数字 · 无缺失', numeric: true },
  { value: 'south', label: '华南', kind: '数字', detail: '6 个数字 · 无缺失', numeric: true },
  { value: 'west', label: '华西', kind: '数字', detail: '5 个数字 · 1 个缺失', numeric: true },
  { value: 'north', label: '华北', kind: '数字', detail: '6 个数字 · 无缺失', numeric: true },
  {
    value: 'reportedAt',
    label: '填报日期',
    kind: '日期',
    detail: '不能用于数值角色',
    numeric: false,
  },
  { value: 'note', label: '备注', kind: '混合', detail: '含文本 · 不能用于数值角色', numeric: false },
] as const

export const seriesPalette = ['#2f6fed', '#22a06b', '#f0a128', '#d64f64'] as const
