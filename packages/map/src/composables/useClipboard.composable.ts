import { ref } from 'vue'

const RESET_DELAY_MS = 2000

/**
 * Composable for copying text to the clipboard.
 * `copied` is briefly `true` after a successful copy, which can be used to
 * show a confirmation icon or tooltip.
 */
export function useClipboard() {
    const copied = ref(false)
    let resetTimer: ReturnType<typeof setTimeout> | null = null

    async function copy(text: string): Promise<void> {
        await navigator.clipboard.writeText(text)
        copied.value = true
        if (resetTimer) clearTimeout(resetTimer)
        resetTimer = setTimeout(() => {
            copied.value = false
        }, RESET_DELAY_MS)
    }

    return { copy, copied }
}
