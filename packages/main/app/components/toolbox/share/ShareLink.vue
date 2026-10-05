<script setup lang="ts">
import VueQrcode from "@chenfengyuan/vue-qrcode";

const { link } = defineProps<{
  link: string;
  copied: boolean;
}>();

const emit = defineEmits<{
  (_e: "copy"): void;
}>();

const text = "Check out this web share tutorial";

function shareViaEmail() {
  const subject = encodeURIComponent(text);
  const body = encodeURIComponent(`${text}\n\n${link}`);
  const mailtoLink = `mailto:?subject=${subject}&body=${body}`;
  window.location.href = mailtoLink;
}

function shareOnFacebook() {
  const facebookIntentURL = "https://www.facebook.com/sharer/sharer.php";
  const contentQuery = `?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}`;
  const shareURL = facebookIntentURL + contentQuery;
  window.open(shareURL, "_blank");
}
function shareOnLinkedIn() {
  const linkedInIntentURL = "https://www.linkedin.com/shareArticle";
  const contentQuery = `?mini=true&url=${encodeURIComponent(link)}&title=${encodeURIComponent(text)}&summary=${encodeURIComponent(text)}`;
  const shareURL = linkedInIntentURL + contentQuery;
  window.open(shareURL, "_blank");
}

function shareOnWhatsApp() {
  const url = "https://wa.me/?text=" + encodeURIComponent(text + "\n" + link);
  window.open(url, "_blank");
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="flex flex-col gap-4 pt-space-xs">
      <p class="text-sm font-semibold text-highlighted">Link teilen</p>
      <p class="text-sm font-medium">
        Teilen Sie die aktuelle Kartenansicht mit anderen oder kopieren Sie die
        URL.
      </p>
    </div>
    <UCheckbox label="Zeichnung editierbar" />
    <UFormField label="URL" size="lg" class="w-full">
      <UInput
        icon="i-lucide-link"
        size="lg"
        color="neutral"
        variant="outline"
        :model-value="link"
        readonly
      >
        <template #trailing>
          <UButton
            :color="copied ? 'success' : 'primary'"
            variant="solid"
            :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
            label="Kopieren"
            aria-label="Copy to clipboard"
            @click="emit('copy')"
          />
        </template>
      </UInput>
    </UFormField>
    <div class="flex flex-col gap-4 pt-space-xs">
      <p class="text-sm font-medium">Via Social Media</p>
      <div class="flex flex-row gap-2">
        <UButton
          color="primary"
          size="xl"
          variant="solid"
          icon="i-lucide-mail"
          aria-label="Share via Email"
          @click="shareViaEmail()"
        />
        <UButton
          color="primary"
          size="xl"
          variant="solid"
          icon="simple-icons:facebook"
          aria-label="Share on Facebook"
          @click="shareOnFacebook()"
        />
        <UButton
          color="primary"
          size="xl"
          variant="solid"
          icon="simple-icons:linkedin"
          aria-label="Share on LinkedIn"
          @click="shareOnLinkedIn()"
        />
        <UButton
          color="primary"
          size="xl"
          variant="solid"
          icon="simple-icons:whatsapp"
          aria-label="Share on WhatsApp"
          @click="shareOnWhatsApp()"
        />
      </div>
      <p class="text-sm font-medium">Link als Qr-Code</p>
      <VueQrcode
        v-if="link"
        :value="link"
        :size="116"
        :level="'H'"
        :background="'#ffffff'"
        :foreground="'#000000'"
      />
    </div>
  </div>
</template>

<style scoped></style>
