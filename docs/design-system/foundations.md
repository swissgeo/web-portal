# Foundations

## Token layers

The implementation uses three token layers.

| Layer     | Location                                                | Purpose                                                |
| --------- | ------------------------------------------------------- | ------------------------------------------------------ |
| Primitive | `packages/main/app/assets/css/main.css`                 | Brand scales and values that Tailwind does not provide |
| Semantic  | `packages/main/app/app.config.ts` and Nuxt UI variables | Meaning such as primary, neutral, success, and error   |
| Component | Nuxt UI component configuration                         | A Figma state that Nuxt UI does not produce by default |

Use a Tailwind default when its value equals the Figma value.

Do not duplicate a Tailwind default under a project-specific name.

## Verified Figma collections

The agency file was reviewed on 2026-08-12.

| Collection           | Modes                   | Variables |
| -------------------- | ----------------------- | --------: |
| `0 - Nuxt UI Colors` | Color                   |       285 |
| `1 - Primary`        | Green                   |        26 |
| `2 - Neutral`        | Neutral                 |        29 |
| `3 - Tokens`         | Light, Dark             |        85 |
| `4 - Font`           | Desktop, Mobile         |        39 |
| `5 - Secondary`      | Blue                    |        25 |
| `6 - Radius`         | 2 px, 4 px, 6 px, 8 px  |         6 |
| `Error`              | Red                     |        25 |
| `Info`               | Blue                    |        23 |
| `Rounded`            | Value                   |         9 |
| `Spacing`            | Mode 1                  |        38 |
| `Success`            | Green                   |        23 |
| `Warning`            | Yellow                  |        23 |
| `border`             | Mode 1                  |         3 |
| `responsive`         | Desktop, Mobile, Tablet |        26 |

The file contains 665 variables in total.

## Semantic colors

| Role                               | Implementation  | Status   |
| ---------------------------------- | --------------- | -------- |
| Primary brand and important action | Petrol          | Verified |
| Secondary accent and focus         | Salmon          | Verified |
| Neutral content and surfaces       | Slate           | Verified |
| Success                            | Tailwind Green  | Verified |
| Information                        | Tailwind Blue   | Verified |
| Warning                            | Tailwind Yellow | Verified |
| Error state                        | Tailwind Red    | Verified |

The Figma collection mode names `Green` and `Blue` do not describe the current
Petrol and Salmon values. Use the semantic role, not the mode name, in code.

Figma also contains individual secondary brand primitives. These values do not
define complete color scales or approved semantic roles. Keep them in the design
inventory until a component or semantic role requires them. Do not generate full
Tailwind scales from one Figma value.

The legacy black override remains while map and attribution consumers use literal
black utilities. Replace those utilities with an approved semantic role before
removing the override.

## Typography and effects

The agency file contains 103 text styles, 13 effect styles, and one grid style.

The approved typeface is Inter. Some Figma helper data still exposes obsolete
DM Sans bindings. Do not implement those bindings.

| Exact evidence                           | Bound family | Status   |
| ---------------------------------------- | ------------ | -------- |
| Title Text heading                       | Inter        | Verified |
| Header text                              | Inter        | Verified |
| Button label                             | Inter        | Verified |
| Tab label                                | Inter        | Verified |
| Blogposts section heading                | Inter        | Verified |
| Text inside the Blogposts card instances | Inter        | Verified |

### Heading Content roles

| Role | Family | Weight |  Size | Line height | Status   |
| ---- | ------ | -----: | ----: | ----------: | -------- |
| h1   | Inter  |    600 | 72 px |        120% | Verified |
| h2   | Inter  |    600 | 48 px |        120% | Verified |
| h3   | Inter  |    600 | 30 px |        120% | Verified |
| h4   | Inter  |    600 | 20 px |        120% | Verified |
| h5   | Inter  |    600 | 18 px |        150% | Verified |

The rendered Figma styles are the source of truth for these roles. The helper
labels for h1 to h4 contain old weight values. The h4 helper label also says
24 px, but the rendered style uses 20 px.

Apply these roles as global heading defaults. A local Tailwind utility can
override a role. Nuxt UI configuration owns exceptions rendered by a Nuxt UI
component.

### Editorial text roles

| Role            | Tailwind utility       | Family | Weight |  Size | Line height | Status   |
| --------------- | ---------------------- | ------ | -----: | ----: | ----------: | -------- |
| Lead            | `type-lead`            | Inter  |    400 | 24 px |        150% | Verified |
| Paragraph       | `type-paragraph`       | Inter  |    500 | 18 px |        150% | Verified |
| Paragraph Bold  | `type-paragraph-bold`  | Inter  |    600 | 18 px |        150% | Verified |
| Text Big        | `type-text-big`        | Inter  |    400 | 16 px |        150% | Verified |
| Text Small      | `type-text-small`      | Inter  |    400 | 14 px |        130% | Verified |
| Text Small Bold | `type-text-small-bold` | Inter  |    700 | 14 px |        130% | Verified |

Nuxt UI Prose maps paragraphs and list items to `type-paragraph`. Strong text
uses the Paragraph Bold weight. The Tailwind utilities own the remaining roles.
A local Tailwind utility overrides a semantic role when a component needs an exception.

The Figma helper row labeled `Lead` renders the named `Text Big` style. The
helper row labeled `Text Big` renders the named `Lead` style. Use the named
rendered styles as the source of truth.

Use `font-sans` for interface text. Use `font-editorial` for documented content
roles. Both semantic font families resolve to Inter.

Map a text style to a documented typography role before use. Do not select a font
size only because it looks close.

Map an effect style to an elevation or focus role before use. Do not copy a shadow
value into a component without that role.

## Manual palette evidence

The Setup page contains manual Teal, Coral, Salmon, and gray Neutral swatches. The
swatch frame does not expose variable bindings.

The verified semantic variables use Petrol, Salmon, Slate, and Tailwind status
families. Do not implement the manual swatches as tokens until Figma links them to
an approved semantic role.

## Dark and light evidence

Figma contains Light and Dark semantic-token modes. It also contains frames named
Hero dark and Hero light.

The product supports a manual light and dark mode switch. Nuxt UI owns the
runtime mode, persistence, and semantic component colors.

Figma does not define complete dark variants for the current application
components. The draft dark mode uses the Nuxt UI dark semantic defaults until
the agency supplies exact dark component evidence. Do not describe these dark
component values as verified Figma values.

Dark-named Keypage frames still resolve the page background to white. Do not use
these frame names as evidence for a dark application background.
