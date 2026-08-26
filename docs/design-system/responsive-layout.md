# Responsive layout

Figma defines responsive ranges that do not match the Tailwind defaults.

## Verified ranges

| Range   | Figma width        | Columns | Verified applied values                        |
| ------- | ------------------ | ------: | ---------------------------------------------- |
| Mobile  | 320 px to 719 px   |       4 | 375 px viewport, 15 px padding, 15 px gutter   |
| Tablet  | 720 px to 1023 px  |       6 | Padding and gutter remain open                 |
| Desktop | 1024 px to 1920 px |      12 | 1920 px viewport, 150 px padding, 30 px gutter |

## Verified responsive spacing

| Role      | Mobile | Desktop |
| --------- | -----: | ------: |
| space/l   |  36 px |   48 px |
| space/2xl |  64 px |   96 px |
| space/3xl |  96 px |  144 px |

The generic Setup spacing specimen also resolves space/3xl to 150 px. This conflicts
with the applied desktop key page. Use the applied key-page value only after the
team confirms which source has priority.

## Tailwind comparison

The installed Tailwind 4.3.1 defaults are 640 px, 768 px, 1024 px, 1280 px, and
1536 px.

The Figma boundaries are 720 px and 1025 px. The implementation normalizes the
desktop boundary to the Tailwind 64 rem value, which is 1024 px at the default
root font size. Do not treat Tailwind sm, md, or lg as
equivalent design names.

Custom breakpoints, spacing values, viewport padding, gutters, and column counts
belong in the Tailwind theme layer. They do not belong in Nuxt UI component
configuration.

The approved Tailwind breakpoint names are `tablet` at 720 px and `desktop` at
1024 px. Tablet padding and gutter values remain open.

The Header has verified mobile and 1920 px desktop frames. Figma does not define
the intermediate Header transition. Keep its current component-specific
transition until the Header pull request resolves this gap.
