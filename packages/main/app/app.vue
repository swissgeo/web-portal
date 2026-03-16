<script lang="ts" setup>
import log, { LogLevel } from '@swissgeo/log'

log.wantedLevels = [LogLevel.Debug, LogLevel.Info, LogLevel.Warn, LogLevel.Error]
</script>

<template>
    <NuxtPage :page-key="(route) => route.path.replace(/^\/(de|fr|en)/, '')" />
</template>
