<script lang="ts" setup>
import { useAttrs, computed } from "vue";

// Prevent automatic forwarding because this wrapper owns the mapped attributes.
defineOptions({ inheritAttrs: false });

const attrs = useAttrs();

const colors = [
  "primary",
  "secondary",
  "success",
  "info",
  "warning",
  "error",
  "neutral",
] as const;

type ButtonColor = (typeof colors)[number];

const variants = [
  "solid",
  "outline",
  "soft",
  "subtle",
  "ghost",
  "link",
] as const;

type ButtonVariant = (typeof variants)[number];

function isButtonColor(value: unknown): value is ButtonColor {
  return colors.some((color) => color === value);
}

function isButtonVariant(value: unknown): value is ButtonVariant {
  return variants.some((variant) => variant === value);
}

const color = computed(() => {
  if (attrs.severity === "danger") {
    return "error";
  }
  if (isButtonColor(attrs.severity)) {
    return attrs.severity;
  }
  return "neutral";
});

const variant = computed(() => {
  if (isButtonVariant(attrs.variant)) {
    return attrs.variant;
  }
  if (attrs.text) {
    return "ghost";
  }
  return color.value === "neutral" ? "soft" : "solid";
});

const icon = computed(() => {
  return attrs.iconName
    ? `i-lucide-${attrs.iconName as string}`.toLowerCase()
    : "";
});
const buttonAttrs = computed(() => {
  const rest = { ...attrs };
  delete rest.icon;
  delete rest.variant;
  delete rest.color;
  delete rest.severity;
  delete rest.text;
  delete rest.iconName;

  return rest;
});
</script>

<template>
  <UButton
    :class="{
      'cursor-pointer': true,
    }"
    :color="color"
    :variant="variant"
    :icon="icon"
    v-bind="buttonAttrs"
  />
</template>
