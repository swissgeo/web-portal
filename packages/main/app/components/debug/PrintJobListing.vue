<script setup lang="ts">
import type { PrintJobStatusResponse } from "~/composables/usePrintRequests";

import { usePrintRequests } from "~/composables/usePrintRequests";

const { ongoingRequests, finishedRequests, errorRequests, requestCollectionNewerToOlder, clearRequestCollection } =
  usePrintRequests();

const open = ref(false);

const totalCount = computed(() => requestCollectionNewerToOlder.value.length);

function statusLabel(status: PrintJobStatusResponse["status"]): string {
  if (status === "open") {
    return "Queued";
  }
  if (status === "started") {
    return "Processing…";
  }
  if (status === "finished") {
    return "Ready";
  }
  return "Error";
}

function statusColor(
  status: PrintJobStatusResponse["status"],
): "info" | "success" | "error" {
  if (status === "open" || status === "started") {
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
    :ui="{
      body: 'max-h-[50vh] overflow-y-auto',
      footer: 'justify-end',
    }"
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

    <template #header>
      <div class="flex w-full items-start justify-between gap-4">
        <div class="w-full">
          <h2 class="text-base font-semibold">Print Jobs</h2>
          <div class="mt-1 flex w-full items-center gap-4">
            <p class="text-sm text-muted">
              {{ ongoingRequests.length }} processing · {{ finishedRequests.length }} ready ·
              {{ errorRequests.length }} failed
            </p>

            <UButton
            v-if="totalCount > 0"
              class="ml-auto"
              label="Clear all"
              color="error"
              variant="outline"
              size="sm"
              :disabled="totalCount === 0"
              @click="clearRequestCollection"
            />
          </div>
        </div>
      </div>
    </template>

    <template #body>
      <div v-if="totalCount === 0" class="py-8 text-center text-sm text-muted">
        No print jobs yet.
      </div>

      <ul v-else class="divide-y divide-default">
        <li
          v-for="(item, index) in requestCollectionNewerToOlder"
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
