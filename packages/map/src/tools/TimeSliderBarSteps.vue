<script lang="ts" setup>
const { allYears, yearsJoint, yearsSeparate, width } = defineProps<{
    allYears: number[]
    yearsJoint: number[]
    yearsSeparate: number[]
    width: number
}>()

const emit = defineEmits(['select'])

const stepWidth = computed(() => `width: ${width}px`)

watch(stepWidth, () => {
    console.log(stepWidth.value)
})

function stepClasses(year: number) {
    const classes: string[] = ['test']
    if (year % 50 === 0) {
        // Big Tick
        classes.push('big-tick')
    } else if (year % 25 === 0) {
        // medium tick
        classes.push('medium-tick')
    } else if (year % 5 === 0) {
        // small tick
        classes.push('small-tick')
    }
    if (yearsJoint.includes(year)) {
        classes.push('bg-primary-300')
    } else if (yearsSeparate.includes(year)) {
        classes.push('bg-primary-50')
    } else {
        classes.push('bg-gray-300')
    }

    return classes
}
</script>

<template>
    <div class="mt-12 flex h-full bg-gray-300">
        <span
            v-for="year in allYears"
            :key="year"
            class="inline-block h-4"
            :style="stepWidth"
            :data-cy="`time-slider-bar-${year}`"
            :class="stepClasses(year)"
            @click="emit('select', year)"
        />
    </div>
</template>

<style>
/* TDOO make scoped work */
.step:before {
    background-color: var(--gray-600);
    display: block;
    content: ' ';
    width: 1px;
    height: 2px;
}

.big-tick:before {
    height: 15px;
    margin-left: -2px;
    width: 2px;
}

.medium-tick:before {
    height: 10px;
    margin-left: -1px;
}

.small-tick:before {
    margin-left: -0.5px;
}
</style>
