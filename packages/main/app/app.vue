<script lang="ts" setup>
import log, { LogLevel } from '@swissgeo/log'

log.wantedLevels = [LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error]
</script>

<template>
    <!-- this is needed so that the change of language doesn't rerender every component
    Otherwise we re-render all the components and all the layers are being reloaded where it's
    not necessary, resulting for instance in the loss of the current opacity
    -->
    <NuxtPage :page-key="(route) => route.path.replace(/^\/(de|fr|en|it|rm)/, '')" />
</template>
