# Maintenance process

Use this process when the agency updates Figma.

## 1. Extract

Create a dated private extraction from the agency file.

Record these areas:

- Pages and top-level frames.
- Variable collections, modes, names, values, aliases, and scopes.
- Text, effect, grid, and paint styles.
- Component sets, properties, variants, and descriptions.
- Key-page desktop, tablet, and mobile frames.
- Assets and image references.

Do not commit raw agency frames, screenshots, visible page text, or unresolved
design discussions to this public repository.

## 2. Compare

Compare the new extraction with the previous dated extraction.

Classify each difference as:

- Added.
- Removed.
- Changed.
- Renamed.
- Moved without a design change.

## 3. Decide

Assign one status to each implementation rule.

- `Verified` for a direct Figma definition.
- `Inferred` for a temporary implementation rule.
- `Open` for an unresolved mapping.

Ask the designers only about absent or contradictory design data.

## 4. Implement

Apply changes in this order:

1. Tailwind defaults.
2. Tailwind theme primitives.
3. Nuxt UI semantic aliases.
4. Nuxt UI component configuration.
5. Component code.

## 5. Verify

Run formatting, lint, and type checks.

Review affected pages in the PR preview.

Compare the rendered state with the matching Figma frame.

## 6. Publish

Update this documentation only with reviewed rules.

Add one entry to `CHANGELOG.md` for each approved design-system change.

## Implementation plan after the foundation

Keep each item in a separate pull request unless one item requires another item.

1. Header.
   Reconcile the desktop and mobile variants, the responsive transition, and all
   interaction states with Figma. Use desktop node `7960:20950` and mobile node
   `7847:83047` as the current targets. Do not use frames marked `alt` as the
   target. Keep the product color-mode control as an intentional product
   extension. Reconcile its placement with the Header without removing it.
2. Map sidebar.
   Reconcile the rail, layer panel, layer rows, background selector, icons, and
   collapse handle with Figma.
3. Map toolbox.
   Reconcile both tool groups, tool buttons, separators, icons, labels, and
   selected states with Figma.
4. Typography.
   Complete the verified interface and editorial roles. Keep incomplete mobile
   and tablet roles open.
5. Content elements.
   Complete the verified Livingdocs renderers and key-page composition. Keep
   components without a complete Figma contract open.
6. Data-catalog interaction flow.
   Implement catalog opening, all-layer selection, topic selection, nested
   topics, suggested-layer states, and empty suggested-layer states after the
   application contract is available.

Do not include the data-catalog flow in a foundation or component pull request.
Its product behavior and destination are not available yet.

## Pre-review cleanup for the initial design-system branch

Complete this cleanup before the draft pull request enters team review.

### Tailwind foundation

- [x] Keep only implemented custom primitive scales that Tailwind does not
      provide.
- [x] Remove the unused Brown, Turquoise, Red Pastel, Zinc, Orange, Light
      Brown, Lime, Green Pastel, and Violet generated palette families. Keep
      exact secondary brand primitives in the inventory until their roles are
      approved.
- [x] Migrate the remaining custom Cyan and custom Neutral consumers.
- [x] Remove or rename the custom Neutral family so it cannot conflict with
      the Nuxt UI Slate neutral alias.
- [ ] Migrate literal black map and attribution consumers to an approved
      semantic role before removing the legacy black override.
- [x] Remove the duplicate Skeleton `@source` declaration.
- [x] Remove the duplicate `--font-sans` declaration.
- [x] Remove unused PrimeVue variables and panel rules.
- [ ] Scope editorial heading rules so application controls do not need
      important overrides.
- [x] Apply the approved Inter family at the application root.

### Nuxt UI component configuration

- [x] Keep the verified Primary solid Button states in `app.config.ts`.
- [x] Add the verified Primary outline Button states to `app.config.ts`.
- [x] Add the verified Salmon Tab focus state to `app.config.ts`.
- [x] Move the Slider thumb ring into Nuxt UI configuration if the value is
      valid for every Figma Slider size.
- [ ] Replace the rejected `neutral + soft` default in the shared
      `IconButton` adapter.
- [ ] Keep incomplete Input and Select rules local until Figma defines their
      complete state matrices.
- [ ] Use semantic `ring-offset-bg` for a mode-aware focus separation unless
      the designers require a white separation in every color mode.

### Reusable controls

- [ ] Keep `SidebarButton` as a narrow wrapper around `UButton`.
- [ ] Make `LayerCartIconButton` use `UButton` for focus, disabled, hover,
      and color behavior.
- [ ] Make `ToolBoxButton` use `UButton` while it keeps its stacked map-tool
      composition.
- [ ] Keep specialized image-thumbnail controls as native buttons.
- [ ] Do not create one generic wrapper for every `UButton` use.

### Current uncommitted panel slice

- [ ] Keep the 315 px panel, 32 px handle, background footer, layout wiring,
      and focused panel tests.
- [ ] Use the stable dataset identifier for background option values and keys.
- [ ] Add a locale-change test that recreates layers with different UUID
      values.
- [ ] Define loading and failure behavior for background records.
- [ ] Add the panel messages to all configured locales.
- [x] Keep the legacy desktop selector path unchanged so this pull request does
      not include an unrelated deletion.
- [x] Move the background translation helper to the new background composable
      without modifying the legacy selector files.
- [ ] Keep the mobile rounded selector and verify it after the cleanup.
- [ ] Run `pnpm run check`, the full unit suite, and a live map check before
      the next commit.
