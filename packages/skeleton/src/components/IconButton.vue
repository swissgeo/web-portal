<script lang="ts" setup>
import { computed } from "vue";

defineOptions({ inheritAttrs: false });

type ButtonColor =
  | "primary"
  | "secondary"
  | "success"
  | "info"
  | "warning"
  | "error"
  | "neutral";
type LegacySeverity = ButtonColor | "danger";

const legacySeverities = new Set<string>([
  "primary",
  "secondary",
  "success",
  "info",
  "warning",
  "danger",
  "neutral",
]);

type ButtonVariant = "solid" | "outline" | "soft" | "subtle" | "ghost" | "link";

const {
  color,
  icon: explicitIcon,
  iconName,
  severity,
  text = false,
  variant,
} = defineProps<{
  color?: ButtonColor;
  icon?: string;
  iconName?: string;
  severity?: LegacySeverity;
  text?: boolean;
  variant?: ButtonVariant;
}>();

const resolvedColor = computed<ButtonColor>(() => {
  if (color) {
    return color;
  }
  if (severity && !legacySeverities.has(severity)) {
    return "primary";
  }
  if (severity === "danger") {
    return "error";
  }
  if (severity && !["secondary", "neutral"].includes(severity)) {
    return severity;
  }
  return "primary";
});

const resolvedVariant = computed<ButtonVariant>(() => {
  if (variant) {
    return variant;
  }
  if (
    text ||
    !severity ||
    !legacySeverities.has(severity) ||
    ["secondary", "neutral"].includes(severity)
  ) {
    return "ghost";
  }
  return "solid";
});

const icon = computed(() =>
  iconName ? `i-lucide-${iconName.toLowerCase()}` : (explicitIcon ?? ""),
);
</script>

<template>
  <UButton
    :color="resolvedColor"
    :variant="resolvedVariant"
    :icon="icon"
    v-bind="$attrs"
  />
</template>
