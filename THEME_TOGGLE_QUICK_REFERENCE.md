# Theme Toggle - Quick Reference Guide

## Quick Start

### For Users
1. **Desktop:** Look for the 🔆/🌙/🖥️ button in the top navigation bar
2. **Mobile (Public):** Tap the theme icon next to the hamburger menu
3. **Mobile (Admin):** Tap the theme icon in the admin header
4. **More Menu:** On mobile bottom nav, tap "More" to access theme settings
5. **Click to cycle:** Light → Dark → System → Light (or use dropdown)

### For Developers

#### Using the Theme in Components
```tsx
import { useTheme } from 'next-themes'

export function MyComponent() {
  const { theme, setTheme } = useTheme()

  return (
    <>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme('dark')}>Set Dark</button>
    </>
  )
}
```

#### Adding Theme Toggle to Other Components
```tsx
import { ThemeToggle } from '@/components/theme/theme-toggle'

export function MyHeader() {
  return (
    <header>
      <nav>
        {/* ... navigation items ... */}
        <ThemeToggle variant="button" size="icon" />
      </nav>
    </header>
  )
}
```

#### Using the Dropdown Menu Variant
```tsx
<ThemeToggle variant="menu" size="icon" />
```

### Theme Variants

| Variant | Use Case | Example |
|---------|----------|---------|
| `button` | Simple cycling | Navigation bars |
| `menu` | Explicit selection | Settings pages |

### Size Options
- `icon` - Standard button size (40×40px)
- `icon-mobile` - Mobile optimized
- `sm`, `lg` - Custom sizes
- [Full list](components/theme/theme-toggle.tsx#L10)

## Key Files

| File | Purpose |
|------|---------|
| [lib/theme/theme-provider.tsx](lib/theme/theme-provider.tsx) | Theme provider wrapper |
| [components/theme/theme-toggle.tsx](components/theme/theme-toggle.tsx) | Theme toggle button |
| [app/layout.tsx](app/layout.tsx) | Root layout with ThemeProvider |
| [components/landing/navigation.tsx](components/landing/navigation.tsx) | Landing nav with toggle |
| [components/layouts/bottom-nav.tsx](components/layouts/bottom-nav.tsx) | Mobile bottom nav with toggle |
| [components/layouts/admin-layout.tsx](components/layouts/admin-layout.tsx) | Admin layout with toggle |

## Theme CSS Variables

All colors automatically switch based on theme:

```css
:root {
  /* Light theme (default) */
  --background: oklch(1 0 0);      /* White */
  --foreground: oklch(...);         /* Dark text */
  /* ... */
}

.dark {
  /* Dark theme */
  --background: oklch(...);         /* Dark background */
  --foreground: oklch(...);         /* Light text */
  /* ... */
}
```

## Storage

- **Key:** `church-theme`
- **Values:** `"light"`, `"dark"`, `"system"`
- **Persistence:** Browser localStorage
- **Sync:** Across tabs (via `storage` event)

## Default Behavior

| Scenario | Theme |
|----------|-------|
| First visit | Light (system setting available) |
| Stored preference | Retrieved from localStorage |
| Browser dark mode | Respected when "system" selected |
| Offline | Last saved preference |

## Troubleshooting

### Theme not persisting
- Check browser allows localStorage
- Clear `church-theme` localStorage key and retry

### Hydration mismatch errors
- Theme component handles this automatically
- Won't render until theme is determined

### Dark mode not applying
- Ensure Tailwind CSS `dark:` classes are used
- Check `.dark` class is on `<html>` element

### Icons not showing
- Verify lucide-react is installed
- Check for import errors in browser console

## Testing

```bash
# Run tests
npm run test

# Test specific file
npm run test -- theme-toggle.test.tsx

# E2E testing
npm run test:e2e
```

## Performance Notes

- ✅ No layout shift on theme change
- ✅ Fast localStorage read (< 1ms)
- ✅ CSS variables update is instant
- ✅ No unnecessary re-renders

## Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ | Full support |
| Firefox | ✅ | Full support |
| Safari | ✅ | Full support |
| Edge | ✅ | Full support |
| IE 11 | ❌ | Not supported |

## Future Enhancements

- [ ] Custom theme creation UI
- [ ] Theme scheduling (auto-switch at night)
- [ ] Multiple theme styles (colors)
- [ ] Per-page theme override
- [ ] Theme animations/transitions
- [ ] Analytics on theme preferences

---

**Last Updated:** 2026-04-16
**Status:** ✅ Production Ready
