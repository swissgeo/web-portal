<script setup lang="ts">
import { computed, ref } from "vue";

// Recursive JSON viewer for the debug style modal. Objects and arrays render a
// ▾/▸ toggle so any bracket can be folded; primitives render inline. Self-refers
// by filename (`JsonTree`) for the recursion.
const props = withDefaults(
  defineProps<{
    value: unknown;
    // Key (object) or index (array) label; undefined for the root node.
    name?: string;
    // Whether this node is the last entry of its parent (controls trailing comma).
    last?: boolean;
  }>(),
  { last: true },
);

const isArray = computed(() => Array.isArray(props.value));
const isObject = computed(
  () =>
    typeof props.value === "object" &&
    props.value !== null &&
    !Array.isArray(props.value),
);
const isCollapsible = computed(() => isArray.value || isObject.value);

const entries = computed<[string, unknown][]>(() => {
  if (Array.isArray(props.value)) {
    return props.value.map((item, index) => [String(index), item]);
  }
  if (isObject.value) {
    return Object.entries(props.value as Record<string, unknown>);
  }
  return [];
});

const openBracket = computed(() => (isArray.value ? "[" : "{"));
const closeBracket = computed(() => (isArray.value ? "]" : "}"));

const collapsed = ref(false);

const valueClass = computed(() => {
  if (typeof props.value === "string") {
    return "text-green-700";
  }
  if (typeof props.value === "number") {
    return "text-purple-700";
  }
  if (typeof props.value === "boolean") {
    return "text-orange-700";
  }
  if (props.value === null) {
    return "text-gray-400";
  }
  return "";
});
</script>

<template>
  <div>
    <!-- Primitive: key + value on a single line. -->
    <template v-if="!isCollapsible">
      <span v-if="name !== undefined" class="text-sky-700">{{ name }}: </span>
      <span :class="valueClass">{{ JSON.stringify(value) }}</span
      ><span v-if="!last">,</span>
    </template>

    <!-- Object / array: foldable bracket. -->
    <template v-else>
      <span
        class="cursor-pointer select-none hover:bg-gray-200"
        @click="collapsed = !collapsed"
      >
        <span class="inline-block w-3 text-gray-400">{{
          collapsed ? "▸" : "▾"
        }}</span>
        <span v-if="name !== undefined" class="text-sky-700">{{ name }}: </span>
        <span>{{ openBracket }}</span>
        <template v-if="collapsed">
          <span class="text-gray-400"> … {{ entries.length }} </span
          ><span>{{ closeBracket }}</span
          ><span v-if="!last">,</span>
        </template>
      </span>
      <template v-if="!collapsed">
        <div class="border-l border-gray-200 pl-4">
          <JsonTree
            v-for="([key, child], index) in entries"
            :key="key"
            :value="child"
            :name="isArray ? undefined : key"
            :last="index === entries.length - 1"
          />
        </div>
        <span>{{ closeBracket }}</span
        ><span v-if="!last">,</span>
      </template>
    </template>
  </div>
</template>
