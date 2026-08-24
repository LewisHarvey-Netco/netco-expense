# 10: Add Navigation Link to Header

**What to build:** Extend the Header component to include an "All Expenses" navigation link that takes finance staff directly to the review page (/review). The link is visible only to finance-role users.

**Blocked by:** 04 - Build All Expenses Page (/review)

**Status:** ready-for-agent

- [ ] Update `src/components/Header.tsx` to add an "All Expenses" link
- [ ] Link navigates to `/review` and is visible only when `user.role === 'finance'`
- [ ] Link styling follows DESIGN-GUIDELINES (restrained, Netcompany palette)
- [ ] Link is placed in navigation area of Header (left/top, before or after app name)
- [ ] Link indicates active/current page if on `/review` or `/review/:id` (e.g., bold, highlight, or active class)
- [ ] Consultant users do not see this link (no changes needed to their home path `/expenses`)
- [ ] Write integration tests verifying:
  - Link appears for finance-role users
  - Link does not appear for consultant-role users
  - Clicking link navigates to `/review`
