<script lang="ts" setup>
const { allYears, yearsJoint, yearsSeparate, sliderWidth } = defineProps<{
    allYears: number[]
    yearsJoint: number[]
    yearsSeparate: number[]
    sliderWidth: number
}>()

const emit = defineEmits(['select'])

function stepClasses(year: number) {
    const classes: string[] = ['test']
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
        <span
            v-for="year in allYears"
            :key="year"
            class="flex-1 h-3"
            :data-cy="`time-slider-bar-${year}`"
            :class="stepClasses(year)"
            @click="emit('select', year)"
        />
    </div>
</template>

<style>
/* TODO make scoped work */
.test {
    position: relative;
    overflow: visible;
}

.test::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 5px;
    background-color: #9ca3af;
}

.test.big-tick::after {
    height: 9px;
}
</style>
