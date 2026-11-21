import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PracticeFlow } from './PracticeFlow'
import { getPracticePlugin } from './registry'
import { labFrameUrl, safeLabUrl, validateLabConfig } from './labConfig'
import type { PracticeState } from './types'
import type { LearningItem } from '../api'

const instructions = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Сравните два отпечатка в лаборатории' }] }] })
const make = (config: Record<string, unknown> = {}): PracticeState => ({ version: { id: 1, practice_definition: 1, practice_type: 'biometric_lab', plugin_version: '1.0.0',
  version_number: 1, title: 'Лабораторная работа', description: '', status: 'PUBLISHED', published_at: null,
  config: { instructions: [instructions], lab_url: 'https://lab.example.org/', criteria: [{ title: 'Сравнены два образца', description: '', is_required: true }], ...config } },
  current_version_id: 1, submission: null, result: null, progress_percent: 0, is_completed: false })
const item = { short_id: 'biolab', type: 'PRACTICE' } as LearningItem
const clients: QueryClient[] = []
function mount(state = make(), submit = vi.fn(async () => true)) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } }); clients.push(client)
  return render(<QueryClientProvider client={client}><PracticeFlow state={state} plugin={getPracticePlugin('biometric_lab', '1.0.0')!}
    item={item} busy={false} start={vi.fn(async () => true)} submit={submit}/></QueryClientProvider>)
}
beforeEach(() => { sessionStorage.clear(); localStorage.clear() })
afterEach(() => { cleanup(); clients.splice(0).forEach(client => client.clear()) })

describe('biometric lab address rules', () => {
  it('accepts https and local http only, without credentials', () => {
    for (const good of ['https://lab.example.org/', 'http://localhost:8000/', 'http://127.0.0.1:8000/']) expect(safeLabUrl(good)).toBeTruthy()
    for (const bad of ['', 'http://lab.example.org/', 'javascript:alert(1)', 'https://user:pw@lab.example.org/', 'https://lab.example.org/#x', 'localhost:8000', 5])
      expect(safeLabUrl(bad)).toBeUndefined()
  })
  it('puts the language into the frame address', () => {
    expect(labFrameUrl({ lab_url: 'https://lab.example.org/' }, 'ru')).toBe('https://lab.example.org/?lang=ru')
    expect(labFrameUrl({ lab_url: 'https://lab.example.org/' }, 'kz')).toBe('https://lab.example.org/?lang=kk')
    expect(labFrameUrl({ lab_url: 'https://lab.example.org/', lab_language: 'en' }, 'kz')).toBe('https://lab.example.org/?lang=en')
    expect(labFrameUrl({ lab_url: 'http://lab.example.org/' }, 'ru')).toBeUndefined()
  })
  it('validates the editor config', () => {
    const ok = make().version!.config
    expect(validateLabConfig(ok)).toBeNull()
    expect(validateLabConfig({ ...ok, lab_url: '' })).toBeTruthy()
    expect(validateLabConfig({ ...ok, lab_language: 'de' })).toBeTruthy()
    expect(validateLabConfig({ ...ok, criteria: [] })).toBeTruthy()
  })
})

describe('biometric lab practice flow', () => {
  it('shows the task first and the lab only after the work is started', () => {
    mount()
    expect(screen.getByText('Сравните два отпечатка в лаборатории')).toBeTruthy()
    expect(screen.queryByTitle('Виртуальная лаборатория «Биометрия»')).toBeNull()
  })
  it('opens the lab in a frame with the platform language', async () => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: 'Начать выполнение' }))
    const frame = await screen.findByTitle('Виртуальная лаборатория «Биометрия»') as HTMLIFrameElement
    expect(frame.getAttribute('src')).toBe('https://lab.example.org/?lang=ru')
    expect(frame.getAttribute('sandbox')).toContain('allow-scripts')
  })
  it('submits the note and self-check only after a separate review step', async () => {
    const submit = vi.fn(async () => true)
    mount(make(), submit)
    fireEvent.click(screen.getByRole('button', { name: 'Начать выполнение' }))
    await screen.findByTitle('Виртуальная лаборатория «Биометрия»')
    fireEvent.change(screen.getByLabelText(/Заметка о результатах/), { target: { value: 'EER проверен' } })
    fireEvent.click(screen.getByRole('button', { name: 'Перейти к самопроверке' }))
    expect(submit).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: 'Завершить работу' }))
    await waitFor(() => expect(submit).toHaveBeenCalledWith({ lab_opened: true, note: 'EER проверен', checks: [true] }))
  })
  it('refuses to open an unsafe lab address', async () => {
    mount(make({ lab_url: 'http://lab.example.org/' }))
    fireEvent.click(screen.getByRole('button', { name: 'Начать выполнение' }))
    expect(await screen.findByText(/Адрес лаборатории не задан или небезопасен/)).toBeTruthy()
    expect(screen.queryByTitle('Виртуальная лаборатория «Биометрия»')).toBeNull()
    expect((screen.getByRole('button', { name: 'Перейти к самопроверке' }) as HTMLButtonElement).disabled).toBe(true)
  })
})
