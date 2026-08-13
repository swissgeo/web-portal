# Asset handoff

Figma stores design references and source assets. The repository stores only
approved production assets.

## Verified agency-file state

The Figma asset endpoint reached its 20-image cap on each main page.

| Area       | Raw images returned | Result    | SVG assets |
| ---------- | ------------------: | --------- | ---------: |
| Key pages  |                  20 | Truncated |          0 |
| Setup      |                  20 | Truncated |          0 |
| Elements   |                  20 | Truncated |          0 |
| Components |                  20 | Truncated |          0 |

The logo frame returns 20 PNG source images and no SVG asset. The frame contains
ten named artwork groups and three component variants:

- Vertical.
- Horizontal.
- Horizontal negative.

## Handoff rule

Do not copy temporary Figma export URLs into the repository.

Do not use a screenshot as a production logo or icon.

Request approved SVG logo and icon sources from the design agency. Record the
source, variant, accessible name, and intended background before implementation.
