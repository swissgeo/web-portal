# Design system

Figma defines the target design for SWISSGEO.

The application is an implementation of that design. The current application does
not define the design when it differs from Figma.

## Sources

- Agency Figma file. The access-controlled source is recorded in the private inventory.
- [Foundations](foundations.md)
- [Responsive layout](responsive-layout.md)
- [Asset handoff](asset-handoff.md)
- [Interaction roles](interaction-roles.md)
- [Component token readiness](component-token-readiness.md)
- [Component matrix](component-matrix.md)
- [Maintenance process](maintenance.md)
- [Approved change log](CHANGELOG.md)

## Evidence status

Every rule uses one status.

- `Verified`: Figma defines the value or combination.
- `Inferred`: The implementation needs a rule, but Figma does not define it.
- `Open`: The design and implementation do not yet have an approved mapping.

Do not present an inferred rule as a Figma rule.

## Implementation order

Use the first applicable layer.

1. Use a Nuxt UI component.
2. Select a semantic Nuxt UI color and variant.
3. Use a Tailwind semantic utility.
4. Use a Tailwind primitive utility only for a documented exception.
5. Add a design token only when the previous layers cannot represent Figma.

Do not add a custom CSS class when a Tailwind utility or Nuxt UI variant can
represent the design.
