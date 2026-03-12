<!-- This page exists so that nuxt-i18n's prefix strategy has an index route to
     redirect to when browser language detection fires on '/'. It immediately
     forwards the user to the map, making /<lang>/map the true entry point. -->
<script lang="ts" setup>
const localePath = useLocalePath()
await navigateTo(localePath('/map'), { replace: true })
</script>
