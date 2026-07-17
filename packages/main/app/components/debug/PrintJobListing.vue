<script setup lang="ts">
import type { PrintJobStatusResponse } from "~/stores/printRequest";

import { usePrintRequests } from "~/composables/usePrintRequests";

const { t } = useI18n();

const {
  ongoingRequests,
  finishedRequests,
  errorRequests,
  requestCollectionNewerToOlder,
  clearRequestCollection,
} = usePrintRequests();

const open = ref(false);

const totalCount = computed(() => requestCollectionNewerToOlder.value.length);
const requestStatusSummary = computed(
  () =>
    `${ongoingRequests.value.length} ${t("print.statusProcessing")}, ${finishedRequests.value.length} ${t("print.statusReady")}, ${errorRequests.value.length} ${t("print.statusFailed")}`,
);

function statusLabel(status: PrintJobStatusResponse["status"] | null): string {
  switch (status) {
    case "open":
      return t("print.statusQueued");
    case "started":
      return t("print.statusProcessing");
    case "finished":
      return t("print.statusReady");
    default:
      return t("print.statusError");
  }
}

function statusColor(
  status: PrintJobStatusResponse["status"] | null,
): "info" | "success" | "error" {
  switch (status) {
    case "open":
    case "started":
      return "info";
    case "finished":
      return "success";
    default:
      return "error";
  }
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
    <!-- Trigger button showing a compact summary of all print job statuses -->
    <UButton :label="t('print.openPrintJobs')" icon="i-lucide-printer">
      <template v-if="totalCount > 0" #trailing>
        <UBadge
          color="neutral"
          size="sm"
          variant="subtle"
          class="h-5 gap-1.5 px-1.5"
          :aria-label="requestStatusSummary"
          :title="requestStatusSummary"
        >
          <span
            v-if="ongoingRequests.length > 0"
            class="inline-flex items-center gap-0.5 text-info"
          >
            <UIcon
              name="i-lucide-loader-circle"
              class="size-3.5"
              :class="{ 'animate-spin': ongoingRequests.length > 0 }"
              aria-hidden="true"
            />
            <span class="text-xs tabular-nums">{{
              ongoingRequests.length
            }}</span>
          </span>
          <span
            v-if="finishedRequests.length > 0"
            class="inline-flex items-center gap-0.5 text-success"
          >
            <UIcon
              name="i-lucide-circle-check"
              class="size-3.5"
              aria-hidden="true"
            />
            <span class="text-xs tabular-nums">{{
              finishedRequests.length
            }}</span>
          </span>
          <span
            v-if="errorRequests.length > 0"
            class="inline-flex items-center gap-0.5 text-error"
          >
            <UIcon
              name="i-lucide-circle-x"
              class="size-3.5"
              aria-hidden="true"
            />
            <span class="text-xs tabular-nums">{{ errorRequests.length }}</span>
          </span>
        </UBadge>
      </template>
    </UButton>

    <template #header>
      <div class="flex w-full items-start justify-between gap-4">
        <div class="w-full">
          <h2 class="text-base font-semibold">
            {{ t("print.printJobsWindowTitle") }}
          </h2>
          <div class="mt-1 flex w-full items-center gap-4">
            <p class="text-sm text-muted">
              {{ ongoingRequests.length }} {{ t("print.statusProcessing") }} ·
              {{ finishedRequests.length }} {{ t("print.statusReady") }} ·
              {{ errorRequests.length }} {{ t("print.statusFailed") }}
            </p>

            <UButton
              v-if="totalCount > 0"
              class="ml-auto"
              :label="t('print.clearAll')"
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
        {{ t("print.noPrintJobsYet") }}
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
                :label="statusLabel(item.lastResponse?.status ?? null)"
                :color="statusColor(item.lastResponse?.status ?? null)"
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
              {{ t("print.created") }}:
              {{ new Date(item.timestamp).toLocaleString() }}
            </p>
          </div>

          <!-- Right: download button when ready -->
          <UButton
            v-if="
              item.lastResponse?.status === 'finished' &&
              item.lastResponse?.pdfUrl
            "
            :href="item.lastResponse.pdfUrl"
            target="_blank"
            rel="noopener"
            :label="t('print.download')"
            icon="i-lucide-download"
            color="success"
            variant="subtle"
            size="sm"
            external
          />
          <UIcon
            v-else-if="item.lastResponse?.status === 'open'"
            name="i-lucide-loader-circle"
            class="size-5 animate-spin text-info"
          />
          <UIcon
            v-else-if="
              item.networkError || item.lastResponse?.status === 'error'
            "
            name="i-lucide-circle-x"
            class="size-5 text-error"
          />
        </li>
      </ul>
    </template>
  </UModal>
</template>
