<script lang="ts" setup>
import log, { LogPreDefinedColor } from '@swissgeo/log'
import { computed, onMounted, ref, watch } from 'vue'

const { locale, locales, setLocale } = useI18n()

const localeItems = computed(() =>
    locales.value.map((item) => ({
        code: item.code,
        name: item.name ?? item.code,
        dir: (item.dir ?? 'ltr') as 'ltr' | 'rtl',
        messages: {},
    }))
)

const selectedLocale = ref<string>(locale.value)
const isClient = ref(false)

onMounted(() => {
    isClient.value = true
})

watch(locale, (value) => {
    selectedLocale.value = value
})

watch(selectedLocale, (value) => {
    if (value && value !== locale.value) {
        setLocale(value as typeof locale.value).catch((err) => {
            log.error({
                title: 'SidebarLanguageSwitcherButton',
                titleColor: LogPreDefinedColor.Rose,
                messages: [
                    `Error while switching the language from ${locale.value} to ${value}`,
                    err,
                ],
            })
        })
    }
})
</script>

<template>
    <div v-if="isClient">
        <ULocaleSelect
            v-model="selectedLocale"
            :locales="localeItems"
            :highlight="true"
            :highlight-on-hover="true"
            :arrow="false"
            size="md"
            variant="ghost"
            :trailing="false"
            aria-label="Language switcher"
            :ui="{
                content: '!w-auto min-w-[150px] !max-w-none',
                base: 'p-5 !shadow-none !ring-0',
                value: 'hidden',
                leadingAvatarSize: '8',
                trailingIcon: 'hidden',
            }"
        />
    </div>
</template>
