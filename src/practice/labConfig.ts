import { defaultTaskConfig, type TaskConfig } from './commonTask'
import type { PracticeConfig } from './types'

export type LabConfig = TaskConfig & { lab_url: string; lab_language?: 'ru' | 'kk' | 'en' }
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

/** HTTPS-адрес лаборатории без логина и пароля; http допускается только для локальной разработки. Те же правила, что на сервере. */
export function safeLabUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value || value.length > 2000) return undefined
  try {
    const url = new URL(value)
    if (url.username || url.password || url.hash || !url.hostname) return undefined
    const local = LOCAL_HOSTS.has(url.hostname) || /^127(\.\d{1,3}){3}$/.test(url.hostname)
    return url.protocol === 'https:' || url.protocol === 'http:' && local ? url.href : undefined
  } catch { return undefined }
}

const labLocale = (locale: string) => (locale === 'kz' ? 'kk' : locale)

/** Адрес для встроенного окна: язык лаборатории берётся из настроек задания, иначе совпадает с языком платформы. */
export function labFrameUrl(config: Partial<LabConfig>, locale: string): string | undefined {
  const base = safeLabUrl(config.lab_url)
  if (!base) return undefined
  const url = new URL(base)
  url.searchParams.set('lang', config.lab_language ?? labLocale(locale))
  return url.href
}

export const initialLabConfig = (): PracticeConfig => ({ ...defaultTaskConfig(), lab_url: '' })
export function validateLabConfig(config: PracticeConfig): string | null {
  if (!safeLabUrl(config.lab_url)) return 'Укажите HTTPS-адрес лаборатории'
  const language = config.lab_language
  if (language !== undefined && language !== 'ru' && language !== 'kk' && language !== 'en') return 'Выберите язык лаборатории'
  return !Array.isArray(config.instructions) || !config.instructions.length || !Array.isArray(config.criteria) || !config.criteria.length
    || (config.criteria as { title?: unknown }[]).some(row => !row || typeof row.title !== 'string' || !row.title.trim())
    ? 'Добавьте инструкцию и критерии задания' : null
}
