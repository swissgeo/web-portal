<script setup lang="ts">
const { title, description, note, confirmLabel, cancelLabel } = defineProps<{
  title: string;
  description: string;
  note?: string;
  confirmLabel: string;
  cancelLabel: string;
}>();

const emit = defineEmits<{ confirm: []; cancel: [] }>();

const open = defineModel<boolean>("open", { default: false });
function onOpenChange(value: boolean) {
  open.value = value;
  if (!value) {
    emit("cancel");
  }
}
</script>
<template>
  <UModal
    :open="open"
    :title="title"
    :description="description"
    @update:open="onOpenChange"
    :ui="{ footer: 'justify-end' }"
  >
    <template v-if="note" #body>
      <div class="text-sm text-muted" data-testid="confirm-dialog-note">
        {{ note }}
      </div>
    </template>

    <template #footer>
      <UButton
        :label="cancelLabel"
        color="neutral"
        variant="subtle"
        data-testid="confirm-dialog-cancel"
        @click="emit('cancel')"
      />
      <UButton
        :label="confirmLabel"
        color="error"
        variant="solid"
        data-testid="confirm-dialog-confirm"
        @click="emit('confirm')"
      />
    </template>
  </UModal>
</template>
