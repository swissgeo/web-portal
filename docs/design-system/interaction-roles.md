# Interaction roles

Color defines meaning. Variant defines emphasis.

## Application mapping

| Interaction role              | Nuxt UI mapping                     | Status                                 |
| ----------------------------- | ----------------------------------- | -------------------------------------- |
| Important action              | `color="primary" variant="solid"`   | Verified                               |
| Primary outlined action       | `color="primary" variant="outline"` | Verified                               |
| Unfilled text-and-icon action | Nuxt UI mapping is open             | Verified Figma form, open code mapping |
| Selected navigation or tool   | Nuxt UI mapping is open             | Open                                   |
| Ordinary contained action     | Nuxt UI mapping is open             | Open                                   |
| Inline or close action        | Nuxt UI mapping is open             | Open                                   |
| Destructive action            | Nuxt UI mapping is open             | Open                                   |
| Cancel destructive workflow   | Nuxt UI mapping is open             | Open                                   |
| Focus accent                  | Secondary focus ring                | Verified                               |

## Rules

- A Figma property label does not guarantee one color value. Several Nuxt UI
  component examples still map primary to Green and secondary to Blue.
- Apply the verified Petrol and Salmon brand mapping before a component property
  becomes an application rule.
- Use primary for the important action in a local context.
- Use an error color only for a destructive action or an error state.
- Do not use secondary as a generic filled-action color.
- Do not use raw Petrol, Salmon, Slate, or status shades when a semantic Nuxt UI
  color can express the role.
- Do not use `neutral + solid` for an ordinary control. Nuxt UI renders this
  combination as a high-emphasis inverted control.

## Figma button sets

`ButtonPrimary` defines these dimensions:

- Variant: `primary`, `outline`.
- Size: `xs`, `md`, `xl`.
- State: `default`, `disabled`, `focus`, `hover`.

`ButtonNeutral` defines these dimensions:

- Size: `xs`, `md`, `xl`.
- State: `default`, `disabled`, `focus`, `hover`.

Figma does not define an active button state. Keep the Nuxt UI active behavior
until Figma defines that state.

`ButtonNeutral` is transparent in its default, disabled, focus, and hover states.
It displays a text label and an optional icon. It uses the secondary focus outline.
Do not map this component to `neutral + soft`.

The exact Nuxt UI mapping for `ButtonNeutral` remains open because its Figma name
does not define a Nuxt UI color or variant.

## Verified button-state evidence

| Form and state   | Bound value or effect                            |
| ---------------- | ------------------------------------------------ |
| Primary default  | Petrol `#1C6B85`                                 |
| Primary hover    | Petrol `#18576C`                                 |
| Primary disabled | Petrol `#1C6B85` at 75 percent opacity           |
| Primary focus    | Salmon outer ring with a white separation ring   |
| Outline default  | Petrol `#1C6B85`                                 |
| Outline disabled | Petrol `#64A6BB` at 75 percent opacity           |
| Outline hover    | Petrol `#18576C`                                 |
| Neutral default  | Transparent with Petrol text and icon            |
| Neutral disabled | Light Petrol text and icon at 75 percent opacity |
| Neutral focus    | Salmon ring                                      |
| Neutral hover    | Transparent with dark Petrol text and icon       |

Nuxt UI already applies 75 percent opacity to disabled buttons. Keep this default.
Do not replace the Primary disabled state with Petrol 300 at full opacity.
