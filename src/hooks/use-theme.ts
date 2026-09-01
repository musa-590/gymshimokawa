import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'shimokawa-theme'

export type Theme = 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'light' || saved === 'dark' ? saved : 'dark'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const toggle = useCallback(() => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    const doc = document as Document & { startViewTransition?: (cb: () => void) => void }
    if (doc.startViewTransition) {
      const root = document.documentElement
      root.classList.add(next === 'dark' ? 'theme-to-dark' : 'theme-to-light')
      const t = doc.startViewTransition(() => setTheme(next))
      t.finished.finally(() => root.classList.remove('theme-to-dark', 'theme-to-light'))
    } else {
      setTheme(next)
    }
  }, [theme])

  return { theme, toggle }
}