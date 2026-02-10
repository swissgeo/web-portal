<script lang="ts" setup>
// TODO
// @ts-expect-error The usei18n here is typed with vue-i18n but it's actually nuxt-i18n
const { locale, locales, setLocale } = useI18n()

function handleLocaleChange(newLocale: string) {
    setLocale(newLocale)
}
</script>

<template>
    <!-- compact flag-only control for the sidebar -->
    <div class="flex items-center justify-center p-2">
        <ULocaleSelect
            class="flex h-12 w-12 cursor-pointer items-center justify-center"
            :model-value="locale"
            :locales="locales"
            :highlight="true"
            :highlight-on-hover="true"
            :arrow="false"
            size="sm"
            variant="ghost"
            :leading="true"
            :trailing="false"
            :portal="'body'"
            :content="{ side: 'top', sideOffset: 8 }"
            aria-label="Language switcher"
            :ui="{
                /* hide the textual label in the collapsed state and show only the flag */
                value: 'w-0 overflow-hidden whitespace-nowrap',
                /* size of the leading avatar (the flag) */
                leadingAvatar: 'h-8 w-8',
                leadingAvatarSize: '8',
                /* ensure the popover appears above other content, is opaque and clickable */
                content:
                    'lang-switcher-popover z-[9999] pointer-events-auto bg-white opacity-100 shadow-2xl rounded-md mb-2',
                /* hide decorative arrows/trailing icons (hide via ui classes too) */
                arrow: 'hidden',
                trailingIcon: 'hidden',
                trailing: false,
                /* style the button itself */
                base: 'p-0 cursor-pointer hover:bg-neutral-50 rounded-md',
                /* style each option: padding, pointer cursor, hover highlight */
                item: 'px-4 py-2 cursor-pointer rounded-md hover:bg-neutral-100',
                viewport: 'p-1',
                /* optional key if UI supports it */
                itemSelected: 'bg-neutral-100 font-semibold',
            }"
            :trailing-icon="undefined"
            @update:model-value="handleLocaleChange"
        />
    </div>
</template>
