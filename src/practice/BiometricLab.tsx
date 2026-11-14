import { useState } from 'react'
import { ArrowRight, ExternalLink } from 'lucide-react'
import { Button, Notice, Textarea } from '../components/ui'
import { useI18n } from '../i18n'
import { useLeaveWarning } from '../useLeaveWarning'
import type { RuntimeProps } from './types'
import { labFrameUrl, type LabConfig } from './labConfig'

/** Экран студента: виртуальная лаборатория «Биометрия» во встроенном окне, затем общая самопроверка по критериям. */
export function BiometricLab({ state, busy, draft, onDraftChange, onBackToTask, onReview, onSubmit }: RuntimeProps) {
  const { t, locale } = useI18n()
  const submitted = !!state.submission && state.submission.status !== 'IN_PROGRESS'
  const [local, setLocal] = useState<Record<string, unknown>>(state.submission?.submission_data ?? {})
  const [dirty, setDirty] = useState(false)
  const value = submitted ? state.submission!.submission_data : draft ?? local
  const note = String(value.note ?? '')
  const src = labFrameUrl((state.version?.config ?? {}) as Partial<LabConfig>, locale)
  const change = (next: Record<string, unknown>) => { setDirty(true); setLocal(next); onDraftChange?.(next) }
  useLeaveWarning(dirty && !submitted)
  const review = () => {
    if (busy || !src) return
    const data = { lab_opened: true, note: note.trim() }
    if (onReview) onReview(data, { title: t('Работа в лаборатории выполнена') })
    else void onSubmit(data)
  }
  return <section className="biometric-lab-execution">
    <h2>{t('Виртуальная лаборатория «Биометрия»')}</h2>
    <p className="muted">{t('Выполните задание в лаборатории. Затем перейдите к самопроверке.')}</p>
    {src ? <>
      <iframe className="biometric-lab-frame" title={t('Виртуальная лаборатория «Биометрия»')} src={src}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals" allow="microphone"
        referrerPolicy="no-referrer" loading="lazy"/>
      <a className="practice-source-link" href={src} target="_blank" rel="noreferrer"><ExternalLink size={15}/>{t('Открыть лабораторию в новой вкладке')}</a>
    </> : <Notice kind="error" text={t('Адрес лаборатории не задан или небезопасен. Сообщите преподавателю.')}/>}
    <label>{t('Заметка о результатах (необязательно)')}<Textarea rows={4} maxLength={2000} disabled={busy || submitted} value={note}
      onChange={event => change({ ...value, note: event.target.value })}
      placeholder={t('Какие образцы и методы Вы сравнили, какой получился результат?')}/></label>
    <div className="practice-flow-actions">
      {onBackToTask && <Button type="button" variant="secondary" onClick={onBackToTask}>{t('К заданию')}</Button>}
      <Button type="button" disabled={busy || !src} onClick={review}>{t('Перейти к самопроверке')}<ArrowRight size={16}/></Button>
    </div>
  </section>
}
