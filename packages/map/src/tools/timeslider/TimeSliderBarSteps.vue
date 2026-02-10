<script lang="ts" setup>
const { allYears, yearsJoint, yearsSeparate, sliderWidth } = defineProps<{
    allYears: number[]
    yearsJoint: number[]
    yearsSeparate: number[]
    sliderWidth: number
}>()

const emit = defineEmits(['select'])

function stepClasses(year: number) {
    const classes: string[] = ['time-step']
    if (year % 10 === 0) {
        classes.push('big-tick')
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
    <div class="mt-12 flex bg-gray-300" :style="{ width: sliderWidth + 'px' }">
        <button
            v-for="year in allYears"
            :key="year"
            type="button"
            class="flex-1 h-3 min-w-0 cursor-pointer border-0 p-0"
            :data-cy="`time-slider-bar-${year}`"
            :class="stepClasses(year)"
            @click="emit('select', year)"
        />
    </div>
</template>

<style scoped>
.time-step {
    position: relative;
    overflow: visible;
}

.time-step::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 5px;
    background-color: rgb(156 163 175); /* gray-400 */
}

.time-step.big-tick::after {
    height: 9px;
}
</style>
