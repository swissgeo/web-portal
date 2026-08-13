# Component token readiness

A Figma component can use a semantic property name and still bind that property to
an obsolete value. Verify both the property name and its resolved value.

## Verified readiness

| Component area         | Primary binding                 | Secondary binding | Readiness         |
| ---------------------- | ------------------------------- | ----------------- | ----------------- |
| Button                 | Petrol                          | Salmon focus      | Brand-adapted     |
| Tab                    | Petrol                          | Salmon focus      | Brand-adapted     |
| Slider                 | Petrol                          | Not used          | Brand-adapted     |
| Header                 | Petrol                          | Not verified      | Brand-adapted     |
| BlogPost and Blogposts | Petrol                          | Salmon            | Brand-adapted     |
| Prose                  | Petrol                          | Not used          | Brand-adapted     |
| Badge                  | Tailwind Green                  | Tailwind Blue     | Not brand-adapted |
| Alert                  | Tailwind Green                  | Tailwind Blue     | Not brand-adapted |
| Toast                  | Tailwind Green                  | Tailwind Blue     | Not brand-adapted |
| Card                   | Tailwind Green                  | Not exposed       | Not brand-adapted |
| PageCard               | Mixed Green and Petrol bindings | Not exposed       | Inconsistent      |

## Status-color conflicts

Badge, Alert, and Toast repeat these values:

- Primary and Success both use Tailwind Green.
- Secondary and Info both use Tailwind Blue.

Alert also contains two warning values:

- The semantic warning alias resolves to `#FCC800`.
- Warning 500 resolves to `#EFB100`.

Toast uses `#EFB100` for its warning alias.

## Implementation rule

Do not copy a component matrix directly into Nuxt UI configuration.

First map the Figma semantic property to the approved SWISSGEO semantic role.

Then confirm that its resolved value matches the approved Petrol, Salmon, Slate, or
status palette.

Record any mismatch as an open design-system migration item.
