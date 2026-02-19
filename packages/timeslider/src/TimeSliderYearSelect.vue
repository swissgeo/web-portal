<script setup lang="ts">
import { LucideIcon } from '@swissgeo/skeleton'
import { useElementBounding } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

const { allYears, modelValue } = defineProps<{
    allYears: number[]
    modelValue: number | undefined
}>()

const emit = defineEmits<{
    'update:modelValue': [value: number]
}>()

const isOpen = ref(false)
const triggerRef = useTemplateRef<HTMLButtonElement>('trigger')
const listRef = useTemplateRef<HTMLDivElement>('list')

const { bottom, left, width } = useElementBounding(triggerRef)

const listStyle = computed(() => ({
    top: `${bottom.value + 4}px`,
    left: `${left.value}px`,
    width: `${width.value}px`,
}))

watch(isOpen, async (newValue) => {
    if (newValue) {
        await nextTick()
        listRef.value?.querySelector('[data-selected]')?.scrollIntoView({ block: 'center' })
    }
})

function selectYear(year: number) {
    emit('update:modelValue', year)
    isOpen.value = false
}
</script>

<template>
    <button
        ref="trigger"
        type="button"
        class="flex flex-1 items-center justify-between rounded border border-gray-200 px-2 py-1.5 text-left text-sm"
        @click="isOpen = !isOpen"
    >
        <span>{{ modelValue ?? '—' }}</span>
        <LucideIcon
            name="ChevronDown"
            class="h-4 w-4 text-gray-500 transition-transform"
            :class="{ 'rotate-180': isOpen }"
        />
    </button>

    <Teleport to="body">
        <template v-if="isOpen">
            <!-- Backdrop to catch outside clicks -->
            <div
                class="fixed inset-0 z-[9998]"
                @click="isOpen = false"
            />
            <!-- Year list -->
            <div
                ref="list"
                class="fixed z-[9999] max-h-48 overflow-y-auto rounded border border-gray-200 bg-white shadow-lg"
                :style="listStyle"
            >
                <button
                    v-for="year in allYears"
                    :key="year"
                    type="button"
                    :data-selected="year === modelValue || undefined"
                    class="block w-full px-3 py-1 text-left text-sm hover:bg-gray-100"
                    :class="{ 'bg-primary-50 font-medium': year === modelValue }"
                    @click="selectYear(year)"
                >
                    {{ year }}
                </button>
            </div>
        </template>
    </Teleport>
</template>
