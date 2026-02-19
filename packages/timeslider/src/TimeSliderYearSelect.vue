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
const searchText = ref('')

const wrapperRef = useTemplateRef<HTMLDivElement>('wrapper')
const inputRef = useTemplateRef<HTMLInputElement>('input')
const listRef = useTemplateRef<HTMLDivElement>('list')

const { bottom, left, width } = useElementBounding(wrapperRef)

const listStyle = computed(() => ({
    top: `${bottom.value + 4}px`,
    left: `${left.value}px`,
    width: `${width.value}px`,
}))

const filteredYears = computed(() =>
    searchText.value
        ? allYears.filter((year) => year.toString().includes(searchText.value))
        : allYears
)

// When closed show the selected year; when open show what the user is typing
const inputDisplayValue = computed(() =>
    isOpen.value ? searchText.value : (modelValue?.toString() ?? '')
)

// Placeholder shows the selected year as a hint while the user types
const inputPlaceholder = computed(() =>
    isOpen.value ? (modelValue?.toString() ?? '') : ''
)

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
    const year = parseInt(searchText.value)
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
</script>

<template>
    <div
        ref="wrapper"
        class="flex flex-1 items-center rounded border border-gray-200"
    >
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
            @click="isOpen ? closeList() : (openList(), focusInput())"
        >
            <LucideIcon
                name="ChevronDown"
                class="h-4 w-4 transition-transform"
                :class="{ 'rotate-180': isOpen }"
            />
        </button>
    </div>

    <Teleport to="body">
        <template v-if="isOpen">
            <!-- Backdrop to catch outside clicks -->
            <div
                class="fixed inset-0 z-[9998]"
                @click="closeList"
            />
            <!-- Filtered year list -->
            <div
                ref="list"
                class="fixed z-[9999] max-h-48 overflow-y-auto rounded border border-gray-200 bg-white shadow-lg"
                :style="listStyle"
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
                    @keydown.esc.prevent="closeList(); focusInput()"
                    @keydown.up.prevent="
                        ($event.currentTarget as HTMLElement).previousElementSibling
                            ? (($event.currentTarget as HTMLElement).previousElementSibling as HTMLElement).focus()
                            : focusInput()
                    "
                    @keydown.down.prevent="
                        (($event.currentTarget as HTMLElement).nextElementSibling as HTMLElement)?.focus()
                    "
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
        </template>
    </Teleport>
</template>
