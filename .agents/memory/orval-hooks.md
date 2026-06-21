---
name: Orval generated hooks with Tanstack Query v5
description: queryKey is required in UseQueryOptions in TQ v5; use getXxxQueryKey() helpers
---

## Rule
Tanstack Query v5 requires `queryKey` when passing `query` options to Orval-generated hooks. Always use the generated `getXxxQueryKey()` helper function.

**Bad:**
```ts
useGetMe({ query: { retry: false } }) // TS error: queryKey missing
```

**Good:**
```ts
useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false } })
```

For conditional queries, instead of `{ query: { enabled: false } }`, prefer skipping the option and checking the returned data instead.

**Why:** TQ v5 changed UseQueryOptions to require queryKey, breaking the TQ v4 pattern of partial options.
