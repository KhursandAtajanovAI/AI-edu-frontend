import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nProvider } from './i18n'
import { MainLayout } from './layouts/MainLayout'
import { NEURAL_LAB_URL, NeuralLabPage, labLanguage } from './NeuralLabPage'
import type { User } from './api'

const student: User = { id: 1, email: 'student@example.com', first_name: 'Студент', last_name: '', role: 'STUDENT', learning_track: null }

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<I18nProvider><QueryClientProvider client={client}><MemoryRouter initialEntries={['/lab']}>
    <MainLayout user={student}><NeuralLabPage/></MainLayout>
  </MemoryRouter></QueryClientProvider></I18nProvider>)
}

describe('NeuralLabPage', () => {
  beforeEach(() => localStorage.clear())
  afterEach(cleanup)

  it('embeds the static lab from /nn-3d-viz-lab/ in a titled frame', () => {
    renderPage()
    const frame = screen.getByTitle('3D-лаборатория нейросетей') as HTMLIFrameElement
    expect(frame.tagName).toBe('IFRAME')
    expect(frame.getAttribute('src')).toBe(NEURAL_LAB_URL)
    expect(NEURAL_LAB_URL).toMatch(/nn-3d-viz-lab\/index\.html$/)
  })

  it('offers the lab in a new tab and a menu item in the main navigation', () => {
    renderPage()
    expect(screen.getByRole('link', { name: /Открыть в новой вкладке/ }).getAttribute('target')).toBe('_blank')
    const navLink = screen.getAllByRole('link', { name: /3D-лаборатория/ }).find(link => link.classList.contains('main-nav-link'))
    expect(navLink?.getAttribute('href')).toBe('/lab')
  })

  it('passes the platform language to the lab through its own setting', () => {
    renderPage()
    expect(localStorage.getItem('nnlab-lang')).toBe('ru')
    expect(labLanguage('en')).toBe('en')
    expect(labLanguage('kz')).toBe('kk')
  })

  it('sets a comfortable default scale but keeps the one chosen by the user', () => {
    renderPage()
    expect(localStorage.getItem('nnlab-scale')).toBe('1')
    cleanup()
    localStorage.setItem('nnlab-scale', '2')
    renderPage()
    expect(localStorage.getItem('nnlab-scale')).toBe('2')
  })
})
