<script lang="ts" setup>
import { useClipboard } from '@vueuse/core'

const { copy, copied } = useClipboard()

const { exportState } = useStateConfig()
import { SaveAppState, postAppStateApiStatePost } from '@swissgeo/statesharing'

const stateId = ref<string>()
const stateIdRevealed = ref(false)
const state = ref<SaveAppState>()

const shareLink = computed(() => {
    if (!stateId.value) {
        return ''
    }
    const baseUrl = new URL(document.location.href)
    // baseUrl.pathname = ''
    const params = baseUrl.searchParams
    params.set('state', stateId.value)

    return baseUrl.toString()
})

watch(
    exportState,
    (newState) => {
        state.value = newState
        stateIdRevealed.value = false
    },
    { immediate: true }
)

async function generateLink() {
    if (state.value) {
        const response = await postAppStateApiStatePost(state.value)
        if ('id' in response.data) {
            stateId.value = response.data.id
            stateIdRevealed.value = true
        }
    }
}
</script>

<template>
    <div class="flex h-32 w-150 flex-col gap-3 px-2 py-5">
        <div>Share Link:</div>
        <UButton
            @click="generateLink"
            v-if="!stateIdRevealed"
            >{{ $t('debug.generateShareLink') }}</UButton
        >
        <UInput
            v-else
            class="w-full"
            v-model="shareLink"
        >
            <template
                v-if="shareLink?.length"
                #trailing
            >
                <UButton
                    :color="copied ? 'success' : 'primary'"
                    variant="solid"
                    size="sm"
                    :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
                    aria-label="Copy to clipboard"
                    @click="copy(shareLink)"
                />
            </template>
        </UInput>
    </div>
</template>
