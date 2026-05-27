<script setup lang="ts">
import { usePrintRequests } from "~/composables/usePrintRequests";

const { requestCollection, ongoingRequests, finishedRequests, errorRequests } =
  usePrintRequests();

const open = ref(false);

const totalCount = computed(() => requestCollection.value.length);

function statusLabel(status: "open" | "finished" | "error"): string {
  if (status === "open") {
    return "Processing…";
  }
  if (status === "finished") {
    return "Ready";
  }
  return "Error";
}

function statusColor(
  status: "open" | "finished" | "error",
): "info" | "success" | "error" {
  if (status === "open") {
    return "info";
  }
  if (status === "finished") {
    return "success";
  }
  return "error";
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Print Jobs"
    :description="`${ongoingRequests.length} processing · ${finishedRequests.length} ready · ${errorRequests.length} failed`"
    :ui="{ footer: 'justify-end' }"
  >
    <!-- Trigger button showing a badge when jobs are pending -->
    <UButton label="Open Print Jobs" icon="i-lucide-printer">
      <template v-if="ongoingRequests.length > 0" #trailing>
        <UBadge
          :label="String(ongoingRequests.length)"
          color="info"
          size="sm"
        />
      </template>
    </UButton>

    <template #body>
      <div v-if="totalCount === 0" class="py-8 text-center text-sm text-muted">
        No print jobs yet.
      </div>

      <ul v-else class="divide-y divide-default">
        <li
          v-for="(item, index) in requestCollection"
          :key="index"
          class="flex items-center justify-between gap-4 py-3"
        >
          <!-- Left: job info -->
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <UBadge
                :label="statusLabel(item.lastResponse.status)"
                :color="statusColor(item.lastResponse.status)"
                size="sm"
                variant="subtle"
              />
              <span class="text-sm font-medium">
                {{ item.requestBody.print_format.toUpperCase() }}
                {{ item.requestBody.print_orientation }}
                · {{ item.requestBody.print_resolution }} dpi
              </span>
            </div>
            <p class="mt-0.5 truncate text-xs text-muted">
              Created:
              {{ new Date(item.lastResponse.created).toLocaleString() }}
            </p>
          </div>

          <!-- Right: download button when ready -->
          <UButton
            v-if="
              item.lastResponse.status === 'finished' &&
              item.lastResponse.pdfUrl
            "
            :href="item.lastResponse.pdfUrl"
            target="_blank"
            rel="noopener"
            label="Download"
            icon="i-lucide-download"
            color="success"
            variant="subtle"
            size="sm"
            external
          />
          <UIcon
            v-else-if="item.lastResponse.status === 'open'"
            name="i-lucide-loader-circle"
            class="size-5 animate-spin text-info"
          />
          <UIcon
            v-else-if="item.lastResponse.status === 'error'"
            name="i-lucide-circle-x"
            class="size-5 text-error"
          />
        </li>
      </ul>
    </template>
  </UModal>
</template>
