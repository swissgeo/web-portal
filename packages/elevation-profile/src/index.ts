import { registerProj4 } from '@swissgeo/coordinates'
import {
    CategoryScale,
    Chart as ChartJS,
    Filler,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js'
import zoomPlugin from 'chartjs-plugin-zoom'
import proj4 from 'proj4'

import dataModelPlugin from '@/chartjs-plugins/datamodel.plugin'
import noDataPlugin from '@/chartjs-plugins/nodata.plugin'
import SwissGeoElevationProfile from '@/SwissGeoElevationProfile.vue'
import SwissGeoElevationProfileOpenLayersBridge from '@/SwissGeoElevationProfileOpenLayersBridge.vue'
import '@/style.css'

registerProj4(proj4)

ChartJS.register(CategoryScale, Filler, Legend, LinearScale, LineElement, PointElement, Tooltip)
ChartJS.register(zoomPlugin, noDataPlugin, dataModelPlugin)

export { SwissGeoElevationProfileOpenLayersBridge }

export default SwissGeoElevationProfile
