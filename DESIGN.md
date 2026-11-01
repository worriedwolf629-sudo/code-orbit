# CodeOrbit Design Direction

## Identity

CodeOrbit is a personal code vault for students. It stores code snippets by subject with serial ordering and a graph view. It runs on phone and laptop.

## Personality

Quiet, functional, focused. The app stays out of the way and lets the code take center stage. It behaves like a tool you built for yourself, not something trying to impress you.

## Palette

| Token            | Value     | Use                                |
|------------------|-----------|------------------------------------|
| `--bg-base`      | `#111113` | Page background                    |
| `--bg-surface`   | `#1a1a1f` | Cards, modals, inputs              |
| `--bg-raised`    | `#222228` | Hover states, elevated surfaces    |
| `--border`       | `#2a2a30` | All borders, 1px solid             |
| `--border-focus` | `#3a3a42` | Focused input borders              |
| `--text-primary` | `#e8e8ec` | Headings, primary text             |
| `--text-body`    | `#a0a0ab` | Body text, descriptions            |
| `--text-dim`     | `#5a5a65` | Timestamps, metadata               |
| `--accent`       | `#2dd4bf` | One accent. Active tab, count dot. |
| `--accent-dim`   | `#1a8a7d` | Accent backgrounds, subtle states  |
| `--danger`       | `#e55353` | Delete actions                     |
| `--code-bg`      | `#0d0d0f` | Code blocks                        |

Reason for dark: this is a code tool. Code reads better on dark. The dark is not decorative.

## Typography

- **Display/headings**: Outfit, weight 600-700, letter-spacing -0.02em. Reason: compact, legible at small sizes on mobile.
- **Body**: Outfit, weight 400-500, 14px base. Clean and readable.
- **Code**: JetBrains Mono, weight 400-500, 12.5px. Reason: this is a code storage app. Monospace is functional, not decorative.
- **Labels/metadata**: Outfit, weight 500, 11-12px, uppercase only for language tags (functional distinction).

## Motion (MOTION 1)

Hover-state transitions only. No entrance animations, no floating, no pulse, no glow animations. The app is static and stable. Modals appear instantly with a subtle scale (0.98 to 1, 150ms). That is all.

## Rhythm (RHYTHM 1)

Uniform spacing. 16px gaps between cards. 12-16px padding inside cards. Consistent, predictable. The content varies, not the layout.

## Energy (ENERGY 1)

Low energy. Matte surfaces. No gradients, no glow, no blur, no shadows. 1px borders define surfaces. The accent appears at exactly two places: the active tab indicator, and count badges. Everywhere else is monochrome.

## Strict Bans

- No gradients on any surface or button
- No box-shadow glow (0 0 Xpx)
- No backdrop-filter / blur
- No radial background orbs
- No Sparkles icon or generic AI icons
- No pill-shaped cards or inputs (pills allowed only on small count badges)
- No decorative dots with glow
- No cosmic/space naming or theming
