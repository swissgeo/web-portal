<script setup lang="ts">
import type { List, ListItem } from "@content/types";

import { computed } from "vue";

const { data } = defineProps<{ data: List }>();

type ListRow = {
  item: ListItem;
  nestedLists: List[];
};

const rows = computed<ListRow[]>(() => {
  const result: ListRow[] = [];
  for (const item of data.containers?.list ?? []) {
    if (item.component === "list-item") {
      result.push({ item, nestedLists: [] });
    } else {
      result.at(-1)?.nestedLists.push(item);
    }
  }
  return result;
});
</script>

<template>
  <ProseUl v-if="rows.length">
    <ContentElementListItem
      v-for="row in rows"
      :key="row.item.id"
      :data="row.item"
    >
      <ContentElementList
        v-for="nestedList in row.nestedLists"
        :key="nestedList.id"
        :data="nestedList"
      />
    </ContentElementListItem>
  </ProseUl>
</template>
