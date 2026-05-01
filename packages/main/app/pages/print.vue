<script lang="ts" setup>
import VueQrcode from '@chenfengyuan/vue-qrcode'
import { SwissGeoLogoRgbPrio } from '@swissgeo/skeleton'
import northArrowUrl from '~/assets/images/north_arrow.png'
import { onMounted } from 'vue'

// Margin in millimeters to add around the print (internal to the page)
const PRINT_MARGIN_MM = 4

const { shareLink } = useCreateShareLinkForPrint()
const { setPageReady } = usePrintStatus()

const { getPrintConfigFromUrl } = useUrlParams()
const printConfig = getPrintConfigFromUrl()

const containerWidth = ref('100dw')
const containerHeight = ref('100dvh')
const containerMargin = ref('0')
const pixelPerMm = ref(0)

// Computes the size of font and margin based on the provided size of
// the document to be printed and the dpi
function adjustToPrintResolution() {
    pixelPerMm.value = computeNumberOfPixelsForPrint(1, printConfig.resolution)
    // We want the padding to be internal to the page
    const margin = pixelPerMm.value * PRINT_MARGIN_MM
    const { width, height } = getPageSizeInPixels(
        printConfig.format,
        printConfig.orientation,
        printConfig.resolution
    )
    containerWidth.value = `${width - 2 * margin}px`
    containerHeight.value = `${height - 2 * margin}px`
    containerMargin.value = `${margin}px`
}

onMounted(() => {
    adjustToPrintResolution()
})
</script>

<template>
    <NuxtLayout name="print">
        <Suspense @resolve="setPageReady">
            <div
                class="flex flex-col"
                :style="{
                    width: containerWidth,
                    height: containerHeight,
                    margin: containerMargin,
                    fontSize: `${pixelPerMm * 2.5}px`,
                }"
            >
                <div class="relative top-0 left-0 h-full w-full">
                    <MapViewer />

                    <div
                        class="absolute"
                        :style="{
                            width: `${pixelPerMm * 10}px`,
                            top: `${pixelPerMm * 10}px`,
                            right: `${pixelPerMm * 10}px`,
                            filter: `drop-shadow(0px 0px ${pixelPerMm * 2}px #000) contrast(2)`,
                        }"
                    >
                        <img
                            class="w-full"
                            :src="northArrowUrl"
                            alt="north arrow"
                        />
                    </div>
                    <div
                        v-if="shareLink"
                        class="absolute right-0 bottom-0 z-[2] flex flex-row"
                    >
                        <div
                            v-if="shareLink"
                            class="self-end bg-white px-[10px] py-[2px] text-[#1c6b85]"
                        >
                            Visit this map at
                            <a
                                class="bg-white text-[#1c6b85] underline"
                                :href="shareLink"
                                print-link
                                >{{ shareLink }}</a
                            >
                        </div>
                        <vue-qrcode
                            :value="shareLink"
                            :options="{
                                width: pixelPerMm * 20,
                                color: {
                                    dark: '#1c6b85',
                                },
                            }"
                        ></vue-qrcode>
                    </div>
                </div>

                <!-- This is the footer of the printed document -->
                <div
                    class="flex flex-row p-1"
                    :style="{
                        marginTop: `${pixelPerMm * 4}px`,
                        gap: `${pixelPerMm * 16}px`,
                    }"
                >
                    <!-- Footer left part: Swisstopo logo -->
                    <div
                        class="flex flex-row whitespace-nowrap"
                        :style="{
                            gap: `${pixelPerMm * 4}px`,
                        }"
                    >
                        <div
                            :style="{
                                width: `${pixelPerMm * 20}px`,
                            }"
                        >
                            <img
                                :src="SwissGeoLogoRgbPrio"
                                alt="Swissgeo logo"
                                class="w-full"
                            />
                        </div>

                        <!-- This section will possibly contain names of contributing organization, or possibly be removed -->
                        <!-- <div>
                            <p class="mb-[0.25em]">Lorem ipsum (DE)</p>
                            <p class="mb-[0.25em]">Lorem ipsum (FR)</p>
                            <p class="mb-[0.25em]">Lorem ipsum (IT)</p>
                            <p class="mb-[0.25em]">Lorem ipsum (RM)</p>
                            <p>Lorem ipsum</p>
                        </div> -->
                    </div>

                    <!-- Footer right part: disclaimer -->
                    <div class="text-justify">
                        <p class="mb-[0.25em]">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc nisl
                            tellus, placerat eget luctus pulvinar, vehicula nec velit. Integer eu
                            pharetra libero. Phasellus eu pretium orci. Nullam quis lacus mauris.
                            Morbi tellus dui, faucibus vel mi a, faucibus luctus ex. Aenean vel
                            ligula fermentum, dictum nunc et, sollicitudin eros. Aliquam erat
                            volutpat. Phasellus pharetra lacus sit amet arcu elementum vulputate.
                            Etiam lacus nunc, varius vel laoreet eu, commodo commodo nisi. Ut
                            efficitur aliquam volutpat. Fusce euismod consectetur fringilla. Nulla
                            ac ultricies ipsum.
                        </p>
                        <p class="mb-[0.25em]">
                            Nam vel auctor nunc. Maecenas malesuada velit non massa condimentum
                            tristique feugiat et ex. Proin commodo nibh mi, a auctor justo tincidunt
                            ac. Praesent et aliquam turpis. In elementum lorem vel felis venenatis,
                            quis ullamcorper velit accumsan. Curabitur sit amet magna non sapien
                            bibendum laoreet.
                        </p>
                        <p>© Lorem Ipsum</p>
                    </div>
                </div>
            </div>
        </Suspense>
    </NuxtLayout>
</template>
