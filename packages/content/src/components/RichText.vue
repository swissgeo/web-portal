<script setup lang="ts">
import type { RichTextNode } from "@content/utils/richText";

defineProps<{ nodes: RichTextNode[] }>();
</script>

<template>
  <template v-for="(node, index) in nodes" :key="index">
    <template v-if="node.type === 'text'">{{ node.text }}</template>
    <br v-else-if="node.type === 'break'" />
    <ProseA
      v-else-if="node.tag === 'a' && node.href"
      :href="node.href"
      :target="node.target"
      :rel="node.target === '_blank' ? 'noopener noreferrer' : undefined"
    >
      <RichText :nodes="node.children" />
    </ProseA>
    <span v-else-if="node.tag === 'a'">
      <RichText :nodes="node.children" />
    </span>
    <strong v-else-if="node.tag === 'strong'">
      <RichText :nodes="node.children" />
    </strong>
    <em v-else-if="node.tag === 'em'">
      <RichText :nodes="node.children" />
    </em>
    <sup v-else>
      <RichText :nodes="node.children" />
    </sup>
  </template>
</template>
