<script setup lang="ts">
import VueQrcode from "@chenfengyuan/vue-qrcode";
import { useI18n } from "vue-i18n";

const { link } = defineProps<{
  link: string;
  copied: boolean;
}>();

const emit = defineEmits<{
  (_e: "copy"): void;
}>();

const { t } = useI18n();

const shareText = computed(() => t("toolbox.share.link.shareText"));

function shareViaEmail() {
  const subject = encodeURIComponent(shareText.value);
  const body = encodeURIComponent(`${shareText.value}\n\n${link}`);
  const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
  window.location.href = mailtoLink;
}

function shareOnFacebook() {
  const facebookIntentURL = "https://www.facebook.com/sharer/sharer.php";
  const contentQuery = `?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(shareText.value)}`;
  const shareURL = facebookIntentURL + contentQuery;
  window.open(shareURL, "_blank");
}
function shareOnLinkedIn() {
  const linkedInIntentURL = "https://www.linkedin.com/shareArticle";
  const contentQuery = `?mini=true&url=${encodeURIComponent(link)}&title=${encodeURIComponent(shareText.value)}&summary=${encodeURIComponent(shareText.value)}`;
  const shareURL = linkedInIntentURL + contentQuery;
  window.open(shareURL, "_blank");
}

function shareOnWhatsApp() {
  const url =
    "https://wa.me/?text=" + encodeURIComponent(shareText.value + "\n" + link);
  window.open(url, "_blank");
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-4 pt-space-xs">
      <p class="text-sm font-semibold text-highlighted">
        {{ t("toolbox.share.link.title") }}
      </p>
      <p class="text-sm font-medium">
        {{ t("toolbox.share.link.description") }}
      </p>
    </div>
    <UCheckbox :label="t('toolbox.share.link.drawingEditableLabel')" />
    <UFormField
      :label="t('toolbox.share.link.urlLabel')"
      size="lg"
      class="w-full"
    >
      <UInput
        icon="i-lucide-link"
        size="lg"
        color="neutral"
        variant="outline"
        :model-value="link"
        readonly
        :ui="{
          trailing: 'pe-2',
        }"
      >
        <template #trailing>
          <UButton
            :color="copied ? 'success' : 'primary'"
            variant="solid"
            :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
            :label="t('toolbox.share.link.copyButton')"
            :aria-label="t('toolbox.share.link.ariaLabel.copyToClipboard')"
            data-testid="share-link-copy"
            @click="emit('copy')"
          />
        </template>
      </UInput>
    </UFormField>
    <div class="flex flex-col gap-4 pt-space-xs">
      <p class="text-sm font-medium">
        {{ t("toolbox.share.link.socialMediaLabel") }}
      </p>
      <div class="flex flex-row gap-2">
        <UButton
          color="primary"
          size="xl"
          variant="solid"
          icon="i-lucide-mail"
          :aria-label="t('toolbox.share.link.ariaLabel.email')"
          @click="shareViaEmail()"
        />
        <UButton
          color="primary"
          size="xl"
          variant="solid"
          icon="simple-icons:facebook"
          :aria-label="t('toolbox.share.link.ariaLabel.facebook')"
          @click="shareOnFacebook()"
        />
        <UButton
          color="primary"
          size="xl"
          variant="solid"
          icon="simple-icons:linkedin"
          :aria-label="t('toolbox.share.link.ariaLabel.linkedin')"
          @click="shareOnLinkedIn()"
        />
        <UButton
          color="primary"
          size="xl"
          variant="solid"
          icon="simple-icons:whatsapp"
          :aria-label="t('toolbox.share.link.ariaLabel.whatsapp')"
          @click="shareOnWhatsApp()"
        />
      </div>
      <p class="text-sm font-medium">
        {{ t("toolbox.share.link.qrCodeLabel") }}
      </p>
      <VueQrcode
        v-if="link"
        :value="link"
        :size="116"
        :level="'H'"
        class="qr-code -translate-x-[15px]"
        :options="{ color: { dark: '#000000', light: '#00000000' } }"
      />
    </div>
  </div>
</template>

<style scoped>
html.dark .qr-code {
  filter: invert(1);
}
</style>
