# 05: Update `FilterPanel` to Support Hidden Submitter Filter

**What to build:** Add an optional `showSubmitterFilter?: boolean` prop to `FilterPanel` (defaults to `true` for backward compatibility). When `showSubmitterFilter === false`, hide the submitter filter UI. This allows consultants to use the same filter component without seeing a meaningless submitter filter on single-user views. Finance users continue to see the submitter filter unchanged.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Add `showSubmitterFilter?: boolean` prop to `FilterPanel` component (defaults `true`)
- [ ] Conditionally render submitter filter field based on `showSubmitterFilter` prop
- [ ] Preserve all other filter behavior (status, type, date range unaffected)
- [ ] Add tests in `FilterPanel.test.tsx` verifying: submitter filter is hidden when prop is false, visible when true, other filters unaffected
