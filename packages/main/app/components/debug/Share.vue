<script lang="ts" setup>
import { useClipboard } from '@vueuse/core'

const { copy, copied } = useClipboard()

const { exportState } = useStateConfig()
import { postAppStateApiStatePost } from '@swissgeo/statesharing'

const stateId = ref(null)

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

watch(exportState, async (newState) => {
    const response = await postAppStateApiStatePost(newState)
    stateId.value = response.data.id
})
</script>

<template>
    <div class="flex h-32 w-150 flex-col gap-3 px-2 py-5">
        <div>Share Link:</div>
        <UInput
            class="w-full"
            v-model="shareLink"
        >
            <template
                v-if="shareLink?.length"
                #trailing
            >
                <UButton
                    :color="copied ? 'success' : 'neutral'"
                    class="bg-white"
                    variant="link"
                    size="sm"
                    :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
                    aria-label="Copy to clipboard"
                    @click="copy(shareLink)"
                />
            </template>
        </UInput>
    </div>
</template>
