/// <reference lib="webworker" />

import type { ParseFailure } from './model'
import { DataSourceParseError, parseDataSource } from './workbookParser'

type ParseRequest = { data: ArrayBuffer; fileName: string; fileSize: number }

self.addEventListener('message', (event: MessageEvent<ParseRequest>) => {
  try {
    const result = parseDataSource(event.data.data, event.data.fileName, event.data.fileSize)
    self.postMessage({ ok: true, result })
  }
  catch (error) {
    const failure: ParseFailure = error instanceof DataSourceParseError
      ? error.failure
      : {
          code: 'corrupt-file',
          message: '文件损坏或无法识别。',
          recovery: '请检查文件后重新导入。',
        }
    self.postMessage({ ok: false, failure })
  }
})

export {}
