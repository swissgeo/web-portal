<!-- This page is the app entry point. It forwards to the localized map route,
     which resolves to '/map' for the default locale and '/<lang>/map' for others. -->
<script lang="ts" setup>
const localePath = useLocalePath()
await navigateTo(localePath('/map'), { replace: true })
</script>
