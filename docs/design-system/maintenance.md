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
