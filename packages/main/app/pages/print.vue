<script lang="ts" setup>
import VueQrcode from '@chenfengyuan/vue-qrcode'
import { SwissGeoLogoRgbPrio } from '@swissgeo/skeleton'


// Margin in millimeters to add around the print (internal to the page)
const PRINT_MARGIN_MM = 4
// const viewStore = useMapViewStore()
const { link } = useCreateShareLinkForPrint()
const { getPrintConfigFromUrl } = useUrlParams()
const printConfig = getPrintConfigFromUrl()

const containerWidth = ref('100dw')
const containerHeight = ref('100dvh')
const containerMargin = ref('0')
const pixelPerMm = ref(0)

onMounted(() => {
    pixelPerMm.value = computeNumberOfPixelsForPrint(1, printConfig.resolution)
    // We want the padding to be internal to the page
    const margin = pixelPerMm.value * PRINT_MARGIN_MM
    const {width, height } = getPageSizeInPixels(printConfig.format, printConfig.orientation, printConfig.resolution)
    containerWidth.value = `${width - 2 * margin}px`
    containerHeight.value = `${height - 2 * margin}px`
    containerMargin.value = `${margin}px`
    console.log(">>>>>>>>>< link", link.value);
    
})

</script>

<template>
    <NuxtLayout name="print">
        <div
            class="print-container"
            :style="{ 
                width: containerWidth, 
                height: containerHeight,
                margin: containerMargin,
                fontSize: `${pixelPerMm * 2.5}px`,
            }"
        >
            <div class="map-container">
                <MapViewer :show-ui="false"/>
                <div
                    v-if="link"
                    class="qr-code-container">
                    <div
                        v-if="link"
                        class="link-container"
                    >
                        Visit this map at<a class="underline" :href="link">{{ link }}</a>
                    </div>
                    <vue-qrcode
                        :value="link"
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
                class="footer-container"
                :style="{ 
                    marginTop: `${pixelPerMm * 4}px`,
                    gap: `${pixelPerMm * 16}px`,
                }"
            >
                <!-- Footer left part: Swisstopo logo -->
                <div
                    class="confederation-info"
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
                            style='width: 100%;'
                        />
                    </div>
                   
                    <div>
                        <p>Schweizerische Eidgenossenschaft</p>
                        <p>Confédération suisse</p>
                        <p>Confederazione Svizzera</p>
                        <p>Confederaziun svizra</p>
                        <p>In collaboration with the cantons</p>
                    </div>
                </div>

                <!-- Footer right part: disclaimer -->
                <div class="disclaimer">
                    <p>www.geo.admin.ch is a portal provided by the Federal Authorities of the Swiss Confederation to gain insight on publicly accessible geographical information, data and services</p>
                    <p>Although every care has been taken by the Federal Authorities to ensure the accuracy of the information published, no warranty can be given in respect of the accuracy, reliability, up-to-dateness or completeness of this information. Copyright: Swiss federal authorities. https://www.admin.ch/gov/en/start/terms-and-conditions.html. If data from third parties are depicted, their availability is ensured by the third-party provider. Additionally, the conditions of the respective data owners apply.</p>
                    <p>© swisstopo</p>
                </div>
            </div>
        </div>
        
    </NuxtLayout>
</template>

<style scoped>
/* Some calculation below are directly borrowed from geoadmin  */
.print-container {
    display: flex;
    flex-direction: column;
    /* font-size: max(max(.8vw, .8vh), 8px); */
}

.map-container {
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.footer-container {
    padding: 0.25rem;
    display: flex;
    flex-direction: row;
}

.confederation-info {
    display: flex;
    flex-direction: row;
    /* width: 100%; */
    white-space: nowrap;
}

.confederation-info p:not(:last-child) {
    margin-bottom: 0.25em;
}

.coat-of-arms {
    height: fit-content;
}

.disclaimer {
    text-align: justify;
}

.disclaimer p:not(:last-child) {
    margin-bottom: 0.25em;
}

.qr-code-container {
    position: absolute;
    bottom: 0;
    right: 0;
    z-index: 2;
    display: flex;
    flex-direction: row;
}

.link-container,
.link-container a {
    background-color: #FFF;
    align-self: end;
    padding: 2px 10px;
    color: rgb(28, 107, 133);
}
</style>
