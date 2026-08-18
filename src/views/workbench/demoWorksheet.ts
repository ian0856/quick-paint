import type { WorksheetInterpretation } from './chartComposition'

export const demoWorksheet: WorksheetInterpretation = {
  name: '区域销售',
  recordCount: 6,
  fields: [
    {
      id: 0,
      sourceColumn: 'A',
      name: '月份',
      kind: 'text',
      profile: { summary: '6 个文本 · 无缺失', missingCount: 0, numericRoleEligible: false },
      values: ['一月', '二月', '三月', '四月', '五月', '六月'],
    },
    {
      id: 1,
      sourceColumn: 'B',
      name: '华东',
      kind: 'number',
      profile: { summary: '6 个数字 · 无缺失', missingCount: 0, numericRoleEligible: true },
      values: [86, 104, 98, 126, 142, 158],
    },
    {
      id: 2,
      sourceColumn: 'C',
      name: '华南',
      kind: 'number',
      profile: { summary: '6 个数字 · 无缺失', missingCount: 0, numericRoleEligible: true },
      values: [62, 75, 81, 90, 96, 112],
    },
    {
      id: 3,
      sourceColumn: 'D',
      name: '华西',
      kind: 'number',
      profile: { summary: '5 个数字 · 1 个缺失', missingCount: 1, numericRoleEligible: true },
      values: [58, 66, null, 84, 91, 103],
    },
    {
      id: 4,
      sourceColumn: 'E',
      name: '华北',
      kind: 'number',
      profile: { summary: '6 个数字 · 无缺失', missingCount: 0, numericRoleEligible: true },
      values: [71, 78, 88, 95, 108, 119],
    },
    {
      id: 5,
      sourceColumn: 'F',
      name: '填报日期',
      kind: 'date',
      profile: { summary: '日期 · 不能用于数值角色', missingCount: 0, numericRoleEligible: false },
      values: ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30', '2026-05-31', '2026-06-30'],
    },
    {
      id: 6,
      sourceColumn: 'G',
      name: '备注',
      kind: 'mixed',
      profile: { summary: '含文本 · 不能用于数值角色', missingCount: 0, numericRoleEligible: false },
      values: ['已确认', '已确认', '待确认', '已确认', '已确认', '已确认'],
    },
  ],
}
