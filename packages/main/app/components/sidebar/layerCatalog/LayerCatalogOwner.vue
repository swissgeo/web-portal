<script lang="ts" setup>
import type { Owner } from "@swissgeo/ogc";

const { owner } = defineProps<{
  owner: Owner;
}>();

// Most names end with the acronym ("Bundesamt für Statistik BFS"). The acronym
// is already shown in bold, so it is removed from the name.
const nameText = computed(() => {
  const suffix = ` ${owner.acronym}`;
  const name = owner.name.endsWith(suffix)
    ? owner.name.slice(0, -suffix.length)
    : owner.name;
  return name === owner.acronym ? "" : `(${name})`;
});
</script>

<template>
  <span>
    <strong>{{ owner.acronym }}</strong>
    {{ nameText }}
  </span>
</template>
