import { Input, Notice } from '../components/ui'
import { useI18n } from '../i18n'
import { AssignmentConfigEditor } from './AssignmentConfigEditor'
import { safeLabUrl } from './labConfig'
import type { ConfigEditorProps } from './types'

/** Настройки практики: адрес лаборатории и язык, затем общая инструкция и критерии самопроверки. */
export function BiometricLabConfigEditor(props: ConfigEditorProps) {
  const { t } = useI18n()
  const { config, disabled, onChange } = props
  const url = typeof config.lab_url === 'string' ? config.lab_url : ''
  const language = typeof config.lab_language === 'string' ? config.lab_language : ''
  const setLanguage = (next: string) => {
    const { lab_language: _drop, ...rest } = config
    onChange(next ? { ...rest, lab_language: next } : rest)
  }
  return <>
    <fieldset disabled={disabled} className="practice-config"><legend>{t('Виртуальная лаборатория')}</legend>
      <label>{t('Адрес лаборатории')}<Input type="url" maxLength={2000} placeholder="https://lab.example.org/" value={url}
        onChange={event => onChange({ ...config, lab_url: event.target.value.trim() })}/></label>
      {url && !safeLabUrl(url) && <Notice kind="error" text={t('Нужен HTTPS-адрес без логина и пароля (для разработки допустим http://localhost).')}/>}
      <label>{t('Язык лаборатории')}<select value={language} onChange={event => setLanguage(event.target.value)}>
        <option value="">{t('Как в платформе')}</option>
        <option value="ru">Русский</option><option value="kk">Қазақша</option><option value="en">English</option>
      </select></label>
    </fieldset>
    <AssignmentConfigEditor {...props}/>
  </>
}
