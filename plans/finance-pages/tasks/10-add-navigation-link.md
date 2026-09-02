# 10: Add Navigation Link to Header

**What to build:** Extend the Header component to include an "All Expenses" navigation link that takes finance staff directly to the review page (/review). The link is visible only to finance-role users.

**Blocked by:** 04 - Build All Expenses Page (/review)

**Status:** done

## Implementation Checklist

- [x] Update `src/components/Header.tsx` to add an "All Expenses" link
- [x] Link navigates to `/review` and is visible only when `user.role === 'finance'`
- [x] Link styling follows DESIGN-GUIDELINES (restrained, Netcompany palette)
- [x] Link is placed in navigation area of Header (left/top, before or after app name)
- [x] Link indicates active/current page if on `/review` or `/review/:id` (e.g., bold, highlight, or active class)
- [x] Consultant users do not see this link (no changes needed to their home path `/expenses`)
- [x] Write integration tests verifying:
    - Link appears for finance-role users
    - Link does not appear for consultant-role users
    - Clicking link navigates to `/review`

## Notes

- Implemented with react-router `NavLink` (no `end` prop), so the link is active on
  `/review` and all `/review/:id` subpages; active state is `font-semibold underline`
  plus the automatic `aria-current="page"` attribute. Inactive state is muted
  (`text-primary-foreground/70`) — palette-only, no new colours.
- Integration tests live in `src/components/Header.test.tsx` (7 tests, including active
  state on `/review`, `/review/:id`, and outside `/review`).
- `src/components/Header.stories.tsx` added (finance on /review, finance on /review/:id,
  consultant) per the "new components to Storybook" convention.
- Pre-existing tests that queried the page title text `All Expenses` became ambiguous
  once the header link existed; updated to target the heading instead:
  `src/pages/ReviewPage.test.tsx` and `e2e/review-page.spec.ts`, `e2e/login-finance.spec.ts`.

## Documentation Updates

- [x] No architecture docs updates needed (Header is already listed in the component
  structure; `NavLink` is standard routing with no new boundary or pattern). No ADR.
