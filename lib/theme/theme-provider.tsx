'use client'

import React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

interface ThemeProviderProps {
  children: React.ReactNode
}

/**
 * Theme Provider Wrapper
 * Wraps the app with next-themes ThemeProvider
 * - Default theme: light
 * - Supports: light, dark, system
 * - Attribute: class (applies .dark to html element)
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      storageKey="church-theme"
      themes={['light', 'dark', 'system']}
    >
      {children}
    </NextThemesProvider>
  )
}
