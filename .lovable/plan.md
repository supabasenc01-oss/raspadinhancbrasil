# Plan: User Interface and Navigation Refinement

Refine the user interface after login to match the provided reference image, ensuring smooth navigation to profile, wallet, and history.

## User Interface & Navigation
- **Refactor SiteHeader:** 
    - Add a `UserDropdown` component for authenticated users.
    - Display user balance, a "Deposit" button, and the user's name with a dropdown arrow.
    - Dropdown options: Play (Jogar), Profile (Perfil), Refer and Earn (Indique e Ganhe), Deposit (Depósito), Withdraw (Saque), and Transactions (Transações).
- **Dashboard Enhancements:**
    - Update `DashboardPage` to include "Prizes Won" and "Participation History" sections (currently placeholders).
    - Add a "Refer and Earn" (Indique e Ganhe) section to the dashboard.

## Financial System Fixes
- **Verify Wallet Flows:** 
    - Ensure the "Deposit" button correctly routes to `/carteira/adicionar`.
    - Check why the user reported "deposit not working" (likely UI/routing issue or mock state).
    - Implement a "Withdrawal Request" (Solicitação de Saque) modal or route.
    - Ensure "Transactions" link points to the transaction history in `/carteira`.

## Visual Identity
- Apply the green theme accents observed in the reference image (matching Mercado Pago style if applicable, but staying true to "Stock Atacarejo" branding).
- Ensure mobile responsiveness for the new dropdown and header layout.

## Technical Details
- Use `shadcn/ui` Dropdown Menu for the user menu.
- Fetch real-time balance using the existing `getWalletBalance` server function.
- Integrate navigation using `@tanstack/react-router`.
