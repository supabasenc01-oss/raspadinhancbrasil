# Plan: Premium Platform Refresh & Legal Pages

Create a more dynamic, "2026-style" premium homepage inspired by the reference image and implement standard legal/support pages.

## Design Changes

### Homepage Refresh (`src/routes/index.tsx`)
- **Rotary Banner**: Replace the static hero with a modern, high-contrast carousel.
  - Features high-impact copy ("R$ 1,00 pode virar R$ 2.500 em prêmios").
  - Premium glow effects and 3D-style depth.
- **Winners Ticker**: Add a horizontally scrolling "Latest Winners" section.
  - Displays user avatar (initials), anonymized name, prize value, and relative time.
  - Real-time data sync from the `winners` table.
- **Categorized Grid**: Enhance the scratch card listing.
  - Prominent category filters (All, Cash, Products, etc.).
  - "Premium 2026" tile style: high-gloss finish, clear hierarchy (Title > Price > Play Button).
- **Sticky Banner (Top)**: Add an optional "Download our App" call-to-action bar as seen in the reference.

### Global Components
- **SiteFooter**: Update with links to the new legal/support pages.
- **SiteHeader**: Ensure "Register" and "Login" stand out with premium styling.

## New Pages
Create clean, SEO-friendly content pages under `src/routes/`:
- `faq.tsx` (Perguntas Frequentes)
- `como-jogar.tsx` (Como Jogar)
- `suporte.tsx` (Suporte Técnico)
- `termos.tsx` (Termos de Uso)
- `privacidade.tsx` (Política de Privacidade)
- `jogo-responsavel.tsx` (Jogo Responsável)

## Technical Details
- Use **Framer Motion** for the banner carousel and winners ticker animations.
- Implement a `useWinners` hook to poll or subscribe to the `winners` table.
- Use **Lucide React** for consistent, modern iconography.
- Ensure full mobile responsiveness for all new layouts.
- Populate new pages with standard, professional placeholder content in Portuguese.
