---
name: Framer Motion variants type fix
description: TypeScript strict mode issue with animation type strings in variants objects
---

## Rule
When `type: 'spring'` (or other animation types) appears inside a `variants` constant or inline `variants={{ }}` prop on a motion component, TypeScript widens it to `string` which is incompatible with `AnimationGeneratorType`.

**Fix:** Use `type: 'spring' as const` inside variants objects.

**When NOT needed:** Direct `transition={{ type: 'spring' }}` props on motion components are fine — TypeScript narrows those contextually.

**Why:** In Framer Motion with strict TypeScript, `variants` object values are typed as `Variants` which requires `AnimationGeneratorType` (a union of literals) not just `string`.
