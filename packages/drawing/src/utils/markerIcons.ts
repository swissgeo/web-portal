/**
 * Marker icons for point drawings
 * Using SVG data URLs for easy embedding in KMZ files
 */

export interface MarkerIcon {
    id: string
    name: string
    dataUrl: string // Data URL of the icon image
    width: number
    height: number
    anchor: [number, number] // Anchor point [x, y] in fraction (0-1), e.g., [0.5, 1] = bottom center
}

// SVG marker icons as data URLs
export const MARKER_ICONS: MarkerIcon[] = [
    {
        id: 'red-pin',
        name: 'Red Pin',
        dataUrl:
            'data:image/svg+xml;base64,' +
            btoa(`
<svg width="32" height="48" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 32 16 32s16-23.2 16-32C32 7.2 24.8 0 16 0z" fill="#ff0000"/>
  <circle cx="16" cy="16" r="6" fill="#ffffff"/>
</svg>`),
        width: 32,
        height: 48,
        anchor: [0.5, 1], // Bottom center
    },
    {
        id: 'blue-pin',
        name: 'Blue Pin',
        dataUrl:
            'data:image/svg+xml;base64,' +
            btoa(`
<svg width="32" height="48" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 32 16 32s16-23.2 16-32C32 7.2 24.8 0 16 0z" fill="#0000ff"/>
  <circle cx="16" cy="16" r="6" fill="#ffffff"/>
</svg>`),
        width: 32,
        height: 48,
        anchor: [0.5, 1], // Bottom center
    },
    {
        id: 'green-pin',
        name: 'Green Pin',
        dataUrl:
            'data:image/svg+xml;base64,' +
            btoa(`
<svg width="32" height="48" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 0C7.2 0 0 7.2 0 16c0 8.8 16 32 16 32s16-23.2 16-32C32 7.2 24.8 0 16 0z" fill="#00ff00"/>
  <circle cx="16" cy="16" r="6" fill="#ffffff"/>
</svg>`),
        width: 32,
        height: 48,
        anchor: [0.5, 1], // Bottom center
    },
    {
        id: 'yellow-star',
        name: 'Yellow Star',
        dataUrl:
            'data:image/svg+xml;base64,' +
            btoa(`
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 2 l4 12 h13 l-10 8 l4 12 l-11-8 l-11 8 l4-12 l-10-8 h13 z" fill="#ffff00" stroke="#ff8800" stroke-width="2"/>
</svg>`),
        width: 32,
        height: 32,
        anchor: [0.5, 0.5], // Center
    },
    {
        id: 'orange-circle',
        name: 'Orange Circle',
        dataUrl:
            'data:image/svg+xml;base64,' +
            btoa(`
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <circle cx="16" cy="16" r="14" fill="#ff8800" stroke="#ffffff" stroke-width="2"/>
</svg>`),
        width: 32,
        height: 32,
        anchor: [0.5, 0.5], // Center
    },
    {
        id: 'purple-square',
        name: 'Purple Square',
        dataUrl:
            'data:image/svg+xml;base64,' +
            btoa(`
<svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
  <rect x="4" y="4" width="24" height="24" fill="#8800ff" stroke="#ffffff" stroke-width="2" rx="2"/>
</svg>`),
        width: 32,
        height: 32,
        anchor: [0.5, 0.5], // Center
    },
]

// Default icon
export const DEFAULT_MARKER_ICON = MARKER_ICONS[0]

/**
 * Get icon by ID
 */
export function getMarkerIconById(id: string): MarkerIcon | undefined {
    return MARKER_ICONS.find((icon) => icon.id === id)
}

/**
 * Convert data URL to blob for KMZ embedding
 */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
    const response = await fetch(dataUrl)
    return response.blob()
}

/**
 * Convert data URL to Uint8Array for fflate
 */
export async function dataUrlToUint8Array(dataUrl: string): Promise<Uint8Array> {
    const blob = await dataUrlToBlob(dataUrl)
    const arrayBuffer = await blob.arrayBuffer()
    return new Uint8Array(arrayBuffer)
}

/**
 * Get icon filename for KMZ embedding
 */
export function getIconFilename(iconId: string): string {
    return `icons/${iconId}.svg`
}
