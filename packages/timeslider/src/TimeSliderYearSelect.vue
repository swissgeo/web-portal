<script setup lang="ts">
import { LucideIcon } from '@swissgeo/skeleton'
import { onClickOutside } from '@vueuse/core'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

const { allYears, modelValue } = defineProps<{
    allYears: number[]
    modelValue: number | undefined
}>()

const emit = defineEmits<{
    'update:modelValue': [value: number]
}>()

const isOpen = ref(false)
const searchText = ref('')

const wrapperRef = useTemplateRef<HTMLDivElement>('wrapper')
const inputRef = useTemplateRef<HTMLInputElement>('input')
const listRef = useTemplateRef<HTMLDivElement>('list')

onClickOutside(wrapperRef, closeList)

const filteredYears = computed(() =>
    searchText.value
        ? allYears.filter((year) => year.toString().includes(searchText.value))
        : allYears
)

const inputDisplayValue = computed(() =>
    isOpen.value ? searchText.value : (modelValue?.toString() ?? '')
)

const inputPlaceholder = computed(() => (isOpen.value ? (modelValue?.toString() ?? '') : ''))

watch(isOpen, async (newValue) => {
    if (newValue) {
        await nextTick()
        listRef.value?.querySelector('[data-selected]')?.scrollIntoView({ block: 'center' })
    } else {
        searchText.value = ''
    }
})

function openList() {
    isOpen.value = true
}

function closeList() {
    isOpen.value = false
}

function selectYear(year: number) {
    emit('update:modelValue', year)
    closeList()
    inputRef.value?.blur()
}

function onInput(e: Event) {
    searchText.value = (e.target as HTMLInputElement).value
}

function onEnter() {
    const year = parseInt(searchText.value, 10)
    if (allYears.includes(year)) {
        selectYear(year)
    }
}

function onArrowDown() {
    const firstItem = listRef.value?.querySelector('button') as HTMLElement | null
    firstItem?.focus()
}

function focusInput() {
    inputRef.value?.focus()
}

function onItemEsc() {
    closeList()
    focusInput()
}

function onItemArrowUp(event: KeyboardEvent) {
    const current = event.currentTarget as HTMLElement
    const prev = current.previousElementSibling as HTMLElement | null
    if (prev) {
        prev.focus()
    } else {
        focusInput()
    }
}

function onItemArrowDown(event: KeyboardEvent) {
    const current = event.currentTarget as HTMLElement
    const next = current.nextElementSibling as HTMLElement | null
    next?.focus()
}
</script>

<template>
    <div
        ref="wrapper"
        class="relative w-28"
    >
        <!-- Trigger row: input + chevron -->
        <div class="flex items-center rounded border border-gray-200">
            <input
                ref="input"
                :value="inputDisplayValue"
                :placeholder="inputPlaceholder"
                type="text"
                class="min-w-0 flex-1 bg-transparent px-2 py-1.5 text-sm outline-none"
                @input="onInput"
                @focusin="openList"
                @keydown.enter.prevent="onEnter"
                @keydown.esc.prevent="closeList"
                @keydown.down.prevent="onArrowDown"
            />
            <button
                type="button"
                tabindex="-1"
                class="px-1.5 py-1.5 text-gray-500"
                :aria-label="isOpen ? 'Close year list' : 'Open year list'"
                :title="isOpen ? 'Close year list' : 'Open year list'"
                @click="isOpen ? closeList() : (openList(), focusInput())"
            >
                <LucideIcon
                    name="ChevronDown"
                    class="h-4 w-4 transition-transform"
                    :class="{ 'rotate-180': isOpen }"
                />
            </button>
        </div>

        <!-- Dropdown list — absolute so it doesn't affect container layout -->
        <div
            v-if="isOpen"
            ref="list"
            class="absolute top-full left-0 z-50 mt-1 max-h-40 w-full overflow-y-auto rounded border border-gray-200 bg-white shadow-md"
        >
            <button
                v-for="year in filteredYears"
                :key="year"
                type="button"
                :data-selected="year === modelValue || undefined"
                class="block w-full px-3 py-1 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                :class="{ 'bg-primary-50 font-medium': year === modelValue }"
                @click="selectYear(year)"
                @keydown.enter.prevent="selectYear(year)"
                @keydown.esc.prevent="onItemEsc"
                @keydown.up.prevent="onItemArrowUp"
                @keydown.down.prevent="onItemArrowDown"
            >
                {{ year }}
            </button>
            <div
                v-if="filteredYears.length === 0"
                class="px-3 py-2 text-sm text-gray-400"
            >
                —
            </div>
        </div>
    </div>
</template>
