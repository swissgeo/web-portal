<script lang="ts" setup>
import type { NuxtError } from '#app'

const props = defineProps<{
    error: NuxtError
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const message = computed(() =>
    props.error.status === 404 ? t('error.notFound') : t('error.generic')
)

function handleError() {
    void clearError({ redirect: localePath('/map') })
}
</script>

<template>
    <div class="flex h-screen flex-col items-center justify-center gap-6 p-8 text-center">
        <p class="text-6xl font-bold text-muted">
            {{ error.status }}
        </p>
        <p class="text-lg">
            {{ message }}
        </p>
        <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="subtle"
            @click="handleError"
        >
            {{ $t('error.backToMap') }}
        </UButton>
    </div>
</template>
