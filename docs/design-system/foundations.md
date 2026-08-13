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

## Typography and effects

The agency file contains 103 text styles, 13 effect styles, and one grid style.

Figma uses Inter and DM Sans. Map each text style separately.

| Exact evidence                           | Bound family      | Status   |
| ---------------------------------------- | ----------------- | -------- |
| Title Text heading                       | Inter             | Verified |
| Header text                              | DM Sans           | Verified |
| Button label                             | DM Sans           | Verified |
| Tab label                                | DM Sans           | Verified |
| Blogposts section heading                | Inter             | Verified |
| Text inside the Blogposts card instances | Inter and DM Sans | Verified |

A component can contain both families. Do not assign one family to a component
area from an aggregate variable response. Read the exact text style or text node.

Use `font-sans` for DM Sans interface text. Use `font-editorial` only when an exact
Figma text style binds Inter.

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
