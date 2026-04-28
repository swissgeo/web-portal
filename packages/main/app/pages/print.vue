<script lang="ts" setup>
import VueQrcode from '@chenfengyuan/vue-qrcode'
import { SwissGeoLogoRgbPrio } from '@swissgeo/skeleton'
import northArrowUrl from '~/assets/images/north_arrow.png'
import { onMounted } from 'vue'


// Margin in millimeters to add around the print (internal to the page)
const PRINT_MARGIN_MM = 4
// const viewStore = useMapViewStore()


const { shareLink } = useCreateShareLinkForPrint()


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
    const {width, height } = getPageSizeInPixels(printConfig.format, printConfig.orientation, printConfig.resolution)
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
        <div
            class="flex flex-col"
            :style="{ 
                width: containerWidth, 
                height: containerHeight,
                margin: containerMargin,
                fontSize: `${pixelPerMm * 2.5}px`,
            }"
        >
            <div class="relative top-0 left-0 w-full h-full">
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
                    <img class="w-full" :src="northArrowUrl" alt="north arrow"/>
                </div>
                <div
                    v-if="shareLink"
                    class="absolute bottom-0 right-0 z-[2] flex flex-row"
                >
                    <div
                        v-if="shareLink"
                        class="self-end bg-white px-[10px] py-[2px] text-[#1c6b85]"
                    >
                        Visit this map at <a class="underline text-[#1c6b85] bg-white" :href="shareLink" print-link>{{ shareLink }}</a>
                    </div>
                    <vue-qrcode
                        :value="shareLink"
                        :options="{
                            width: pixelPerMm * 20,
                            color: {
                                dark: '#1c6b85'
                            }
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
                        gap: `${pixelPerMm * 4}px`
                    }"
                >
                    <div
                        :style="{ 
                            width: `${pixelPerMm * 20}px`
                        }"
                    >
                        <img
                            :src="SwissGeoLogoRgbPrio"
                            alt="Swissgeo logo"
                            class="w-full"
                        />
                    </div>
                   
                    <div>
                        <p class="mb-[0.25em]">Schweizerische Eidgenossenschaft</p>
                        <p class="mb-[0.25em]">Confédération suisse</p>
                        <p class="mb-[0.25em]">Confederazione Svizzera</p>
                        <p class="mb-[0.25em]">Confederaziun svizra</p>
                        <p>In collaboration with the cantons</p>
                    </div>
                </div>

                <!-- Footer right part: disclaimer -->
                <div class="text-justify">
                    <p class="mb-[0.25em]">www.geo.admin.ch is a portal provided by the Federal Authorities of the Swiss Confederation to gain insight on publicly accessible geographical information, data and services</p>
                    <p class="mb-[0.25em]">Although every care has been taken by the Federal Authorities to ensure the accuracy of the information published, no warranty can be given in respect of the accuracy, reliability, up-to-dateness or completeness of this information. Copyright: Swiss federal authorities. https://www.admin.ch/gov/en/start/terms-and-conditions.html. If data from third parties are depicted, their availability is ensured by the third-party provider. Additionally, the conditions of the respective data owners apply.</p>
                    <p>© swisstopo</p>
                </div>
            </div>
        </div>
        
    </NuxtLayout>
</template>