<script lang="ts" setup>
const config = useRuntimeConfig()

const version = config.public.version
const buildTime = config.public.buildTime

onMounted(() => {
    printInfo()
})

function printInfo() {
    const log = (msg: string, style: string = 'color: #1f576b; font-size: 1.2rem;') =>
        // eslint-disable-next-line no-console
        console.log(`%c${msg}`, style)
    log('SWISSGEO', 'color: #1f576b;; font-weight: bold; font-size: 2rem;')
    log(`Version: ${version}`)
    log(`Build Time: ${buildTime}`)
}
</script>

<template>
    <NuxtLayout>
        <!-- this is needed so that the change of language doesn't rerender every component
        Otherwise we re-render all the components and all the layers are being reloaded where it's
        not necessary, resulting for instance in the loss of the current opacity
        -->
        <NuxtPage :page-key="(route) => route.path.replace(/^\/(de|fr|en|it|rm)/, '')" />
    </NuxtLayout>
</template>
