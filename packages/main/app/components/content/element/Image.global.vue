<script lang="ts" setup>
import type { ContentItem } from '~~/shared/types/livingdocs/Publication'

const { data } = defineProps<{ data: ContentItem }>()

const image = computed(() => {
    return data.content?.image || ''
})

const caption = computed(() => {
    return data.content?.caption || ''
})
</script>

<template>
    <figure>
        <picture>
            <img
                :src="image.url"
                class="max-w-[756px]"
            />
        </picture>
        <figcaption>{{ caption }}</figcaption>
    </figure>
</template>
