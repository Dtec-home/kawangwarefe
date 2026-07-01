'use client'

import { useTheme } from 'next-themes'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'

interface ThemeToggleProps {
  /**
   * Variant: "button" (icon button) or "menu" (dropdown menu)
   * Default: "button"
   */
  variant?: 'button' | 'menu'
  /**
   * Size options matching Button component sizes
   */
  size?: 'default' | 'xs' | 'sm' | 'lg' | 'mobile' | 'mobile-xs' | 'mobile-sm' | 'mobile-lg' | 'icon' | 'icon-xs' | 'icon-sm' | 'icon-lg' | 'icon-mobile' | 'icon-mobile-xs' | 'icon-mobile-sm' | 'icon-mobile-lg'
  /**
   * Show label text alongside icon
   * Default: false
   */
  showLabel?: boolean
}

/**
 * Theme Toggle Component
 * Allows users to switch between light, dark, and system themes
 *
 * Usage:
 * - <ThemeToggle variant="button" /> — Simple icon button (default)
 * - <ThemeToggle variant="menu" /> — Dropdown menu with all options
 * - <ThemeToggle showLabel /> — Icon button with label
 */
export function ThemeToggle({
  variant = 'button',
  size = 'icon',
  showLabel = false,
}: ThemeToggleProps) {
  const { theme, setTheme, themes } = useTheme()

  // Note: next-themes handles hydration internally
  // If theme is undefined, we're still hydrating; return null to avoid mismatch

  if (!theme) {
    return null
  }

  if (variant === 'menu') {
    return (
      <DropdownMenu>
        <Button
          variant="ghost"
          size={size}
          className="relative"
          title="Theme menu"
        >
          {theme === 'dark' ? (
            <Moon className="h-5 w-5" />
          ) : theme === 'light' ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Monitor className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Theme</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {themes.map((t) => (
            <DropdownMenuCheckboxItem
              key={t}
              checked={theme === t}
              onCheckedChange={() => setTheme(t)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {t === 'dark' && <Moon className="h-4 w-4" />}
                {t === 'light' && <Sun className="h-4 w-4" />}
                {t === 'system' && <Monitor className="h-4 w-4" />}
                <span className="capitalize">{t}</span>
              </div>
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  // Default: button variant
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={() => {
        // Cycle through: light → dark → system → light
        const themeOrder = ['light', 'dark', 'system']
        const currentIndex = themeOrder.indexOf(theme || 'light')
        const nextTheme = themeOrder[(currentIndex + 1) % themeOrder.length]
        setTheme(nextTheme)
      }}
      className="relative"
      title={`Current theme: ${theme}. Click to cycle.`}
    >
      {theme === 'dark' ? (
        <Moon className="h-5 w-5" />
      ) : theme === 'light' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Monitor className="h-5 w-5" />
      )}
      {showLabel && (
        <span className="ml-2 text-sm capitalize hidden sm:inline">{theme}</span>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
