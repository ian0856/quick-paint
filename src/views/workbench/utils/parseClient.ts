import type { DataSourceInterpretation, ParseFailure } from './model'
import { LIMITS } from './model'

type WorkerResponse =
  | { ok: true; result: DataSourceInterpretation }
  | { ok: false; failure: ParseFailure }

export type ParseTask = {
  promise: Promise<DataSourceInterpretation>
  cancel: () => void
}

export function parseFile(file: File): ParseTask {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!['xlsx', 'csv'].includes(extension)) {
    return rejectedTask({
      code: 'unsupported-file',
      message: '仅支持 .xlsx 和 UTF-8 .csv 文件。',
      recovery: '请选择受支持的文件。',
    })
  }
  if (file.size > LIMITS.fileBytes) {
    return rejectedTask({
      code: 'file-too-large',
      message: '文件超过 20 MiB 上限。',
      recovery: '请选择更小的文件。',
    })
  }

  const worker = new Worker(new URL('./parser.worker.ts', import.meta.url), { type: 'module' })
  let settled = false
  let timeoutId = 0
  let rejectTask: ((reason: unknown) => void) | null = null
  const finish = () => {
    settled = true
    window.clearTimeout(timeoutId)
    worker.terminate()
  }
  const promise = new Promise<DataSourceInterpretation>((resolve, reject) => {
    rejectTask = reject
    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      if (settled) return
      finish()
      if (event.data.ok) resolve(event.data.result)
      else reject(event.data.failure)
    })
    worker.addEventListener('error', () => {
      if (settled) return
      finish()
      reject({ code: 'corrupt-file', message: '文件解析失败。', recovery: '请重新导入文件。' })
    })
    file.arrayBuffer().then((data) => {
      if (!settled) worker.postMessage({ data, fileName: file.name, fileSize: file.size }, [data])
    }).catch(() => {
      if (settled) return
      finish()
      reject({ code: 'corrupt-file', message: '无法读取本地文件。', recovery: '请重新选择文件。' })
    })
  })
  timeoutId = window.setTimeout(() => {
    if (settled) return
    finish()
    rejectTask?.({
      code: 'parse-timeout',
      message: '文件解析超过 10 秒，已停止。',
      recovery: '请导入更小的文件后重试。',
    })
  }, 10_000)

  return {
    promise,
    cancel: () => {
      if (settled) return
      finish()
      rejectTask?.(new DOMException('Import replaced', 'AbortError'))
    },
  }
}

function rejectedTask(failure: ParseFailure): ParseTask {
  return { promise: Promise.reject(failure), cancel: () => {} }
}
