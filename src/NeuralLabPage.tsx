import { useMemo } from 'react'
import { ExternalLink } from 'lucide-react'
import { useI18n, type Locale } from './i18n'
import './neural-lab.css'

// 3D-лаборатория нейросетей — отдельный статический сайт (public/nn-3d-viz-lab/), встроенный в платформу как есть.
// Ссылаемся на index.html явно: так страница открывается одинаково и в Vite, и в production-сервере.
export const NEURAL_LAB_URL = `${import.meta.env.BASE_URL}nn-3d-viz-lab/index.html`
const LAB_LANGUAGE_KEY = 'nnlab-lang'
const LAB_SCALE_KEY = 'nnlab-scale'
// У лаборатории по умолчанию масштаб ×2 (рассчитан на целое окно); в рамке платформы удобнее ×1. Выбор пользователя (+ / − в лаборатории) не трогаем.
const LAB_DEFAULT_SCALE = '1'

/** Язык лаборатории (RU | EN) по языку платформы: казахского у лаборатории нет, показываем русский. */
export const labLanguage = (locale: Locale) => (locale === 'en' ? 'en' : 'ru')

export function NeuralLabPage() {
  const { t, locale } = useI18n()
  const language = labLanguage(locale)
  // Лаборатория и платформа живут на одном адресе, поэтому язык передаём через её же настройку: она действует и на каталог, и на все страницы моделей.
  useMemo(() => {
    try {
      localStorage.setItem(LAB_LANGUAGE_KEY, language)
      if (localStorage.getItem(LAB_SCALE_KEY) === null) localStorage.setItem(LAB_SCALE_KEY, LAB_DEFAULT_SCALE)
    } catch { /* настройки браузера запрещают хранилище — лаборатория выберет язык и масштаб сама */ }
  }, [language])
  return <section className="neural-lab">
    <div className="page-head">
      <div>
        <span className="eyebrow">{t('Интерактивная практика')}</span>
        <h1>{t('3D-лаборатория нейросетей')}</h1>
        <p>{t('Интерактивные 3D-модели нейросетей: смотрите, как они устроены, запускайте вычисления и меняйте параметры.')}</p>
      </div>
      <a className="neural-lab-external" href={NEURAL_LAB_URL} target="_blank" rel="noreferrer"><ExternalLink size={16}/>{t('Открыть в новой вкладке')}</a>
    </div>
    <iframe key={language} className="neural-lab-frame" title={t('3D-лаборатория нейросетей')} src={NEURAL_LAB_URL} allow="fullscreen"/>
  </section>
}
