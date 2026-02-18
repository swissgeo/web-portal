<script lang="ts" setup>
import { pascalCase } from 'es-toolkit/string'

const { containers } = defineProps<{ containers: unknown[] }>()

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
        .map((value: unknown, index: number) => {
            if (!value || typeof value !== 'object') {
                return {
                    componentName: null,
                    _key: `content-${index}`,
                }
            }

            const contentItem = value as Record<string, unknown>

            if (typeof contentItem.component !== 'string') {
                return {
                    ...contentItem,
                    componentName: null,
                    _key: `content-${index}`,
                }
            }

            const name = pascalCase(contentItem.component)

            let componentName

            if (COMPONENT_EXCLUDES.includes(name)) {
                return {
                    ...contentItem,
                    componentName: null,
                    _key:
                        typeof contentItem.identifier === 'string'
                            ? contentItem.identifier
                            : `content-${index}`,
                }
            }

            try {
                componentName = resolveComponent(`ContentElement${name}`)
            } catch (_) {
                componentName = null
            }

            return {
                ...contentItem,
                componentName,
                _key:
                    typeof contentItem.identifier === 'string'
                        ? contentItem.identifier
                        : `content-${index}`,
            }
        })
        .filter((value) => value.componentName)
})
</script>

<template>
    <div>
        <div
            v-for="component in components"
            :key="component._key"
        >
            <component
                :is="component.componentName"
                :data="component"
            />
        </div>
    </div>
</template>
