# Component matrix

This matrix records the combinations that exist in Figma.

Do not create a new combination only because Nuxt UI supports it.

| Component       | Figma dimensions                                                                                                                                                                    | Status   |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- |
| `ButtonPrimary` | variant: primary, outline; size: xs, md, xl; state: default, disabled, focus, hover                                                                                                 | Verified |
| `ButtonNeutral` | size: xs, md, xl; state: default, disabled, focus, hover                                                                                                                            | Verified |
| `Badge`         | color: neutral, primary, secondary, success, info, warning, error; variant: solid, soft, subtle, outline; size: xs, sm, md, lg, xl; rounded: false, true                            | Verified |
| `Alert`         | color: neutral, primary, secondary, success, info, warning, error; variant: solid, outline, soft, subtle; leading slot: avatar, icon; action: false, true; description: false, true | Verified |
| `Slider`        | color: error, neutral, primary; size: xs, sm, md, lg, xl; orientation: horizontal, vertical; state: default, disabled; indicator: 0, 25, 50, 75, 100                                | Verified |
| `Toast`         | color: primary, neutral, secondary, success, info, warning, error; leading slot: avatar, icon, none; progress: 0, 100; actions: false, true; description: false, true               | Verified |
| `Carousel`      | variant: default, fade, single; dots: top, bottom; previous and next: top, center, bottom                                                                                           | Verified |
| `Tab`           | size: xs, md, xl; state: default, hover, focus, selected, disabled                                                                                                                  | Verified |
| `Header`        | screen: desktop, mobile                                                                                                                                                             | Verified |
| `Blogposts`     | screen: desktop, mobile                                                                                                                                                             | Verified |
| `BlogPost`      | author: multiple, one; variant: outline, soft; state: default, hover                                                                                                                | Verified |
| `Logo`          | orientation: vertical, horizontal, horizontal negative                                                                                                                              | Verified |
| `PageCard`      | component examples exist; the property matrix is not exposed                                                                                                                        | Open     |
| `Card`          | one reusable component exists; the property matrix is not exposed                                                                                                                   | Open     |
| `Accordion`     | one usage example exists; the component-definition frame is incomplete                                                                                                              | Open     |
| `Drawer`        | one 1440 x 800 example exists; desktop, tablet, and mobile documentation grids are placeholders                                                                                     | Open     |
| `Table`         | desktop, tablet, and mobile documentation grids are placeholders; no reusable component is defined                                                                                  | Open     |
| `Prose`         | property examples exist; the code mapping is open                                                                                                                                   | Open     |

## Referenced patterns without a local matrix

Key pages use these patterns without a complete local property matrix:

- InputMenu.
- NavigationMenu.
- NavigationMenuItem.
- Breadcrumb.
- Title Text.
- Collapsible panel.
- Layout template.
- Carousel indicators.
- Link, download, share, arrow, and chevron icons.

Treat each code mapping as open until a Figma component or documented pattern
defines its properties and states.

The agency file does not contain complete Input, Select, Search, Textarea,
Checkbox, Radio, Switch, or Form atom sets. Header contains an InputMenu instance.
This instance does not define a complete input-state matrix.

## Mapping rule

Map Figma component properties to Nuxt UI properties when their meaning matches.

Use Nuxt UI slot configuration for Figma properties that are visual composition
choices.

Add application code only for product behavior that Figma cannot represent.

Record every unsupported or ambiguous combination before implementation.
