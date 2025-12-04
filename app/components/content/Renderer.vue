<script lang="ts" setup>
import type { ContentItem } from '~~/shared/types/livingdocs/Publication'

import { pascalCase } from 'es-toolkit/string'

const { containers } = defineProps<{ containers: ContentItem[] }>()

// const convertName = (name: string) => {
//     const parts = name.split('-')

//     const uppercasedParts = []
//     for (const part of parts) {
//         const uppercased = part.charAt(0).toUpperCase() + toValue.component.slice(1)
//         uppercasedParts.push(uppercased)
//     }

//     return
// }

const COMPONENT_EXCLUDES = ['TeaserContainer']

const components = computed(() => {
    if (!containers) {
        return []
    }

    // console.log(`CONTAINERS: ${JSON.stringify(containers)}`)

    // return Object.values(containers)
    return containers
        .map((value: ContentItem) => {
            const name = pascalCase(value.component)

            let componentName

            if (COMPONENT_EXCLUDES.includes(name)) {
                return { ...value, componentName: null }
            }

            try {
                componentName = resolveComponent(`ContentElement${name}`)
            } catch (_) {
                componentName = null
            }

            return {
                ...value,
                componentName,
            }
        })
        .filter((value) => value.componentName)
})
</script>

<template>
    <div>
        <div
            v-for="component in components"
            :key="component.identifier"
        >
            <component
                :is="component.componentName"
                :data="component"
            />
        </div>
    </div>
</template>
