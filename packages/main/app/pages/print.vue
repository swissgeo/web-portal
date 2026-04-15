<script lang="ts" setup>

</script>


<template>
    <NuxtLayout name="print">
        <div class="print-container">
            <div class="map-container">
                <MapViewer :show-ui="false"/>
            </div>
            
            <!-- This is the footer of the printed document -->
            <div class="footer-container">
                <!-- Footer left part: Swisstopo logo -->
                <div class="confederation-info">
                    <svg xmlns='http://www.w3.org/2000/svg' class="coat-of-arms" viewBox="0 0 604 669"><g><path fill='#D52B1E' d='M302,2 C 402,2 502,19 602,52 C 602,286 604,534 302,667 C 0,534 2,286 2,52 C 102,19 202,2 302,2 z'/><path fill='#fff' d='M102,242 h140 v-140 h120 v140 h140 v120 h-140 v140 h-120 v-140 h-140 z'/></g></svg>
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
    width: 100%;
    height: 100%;
    font-size: max(max(.8vw, .8vh), 8px);
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
    gap: 1rem;
}

.confederation-info {
    display: flex;
    flex-direction: row;
    margin: calc(1.32 * max(max(.8vw, .8vh), 8px));
    gap: calc(1.32 * max(max(.8vw, .8vh), 8px));
    width: 100%;
    white-space: nowrap;
}

.confederation-info p:not(:last-child) {
    margin-bottom: 0.25em;
}

.coat-of-arms {
    width: calc(5 * .66 * max(max(.8vw, .8vh), 8px));
    height: fit-content;
}

.disclaimer {
    margin: calc(1.32 * max(max(.8vw, .8vh), 8px));
    text-align: justify;
}

.disclaimer p:not(:last-child) {
    margin-bottom: 0.25em;
}
</style>
