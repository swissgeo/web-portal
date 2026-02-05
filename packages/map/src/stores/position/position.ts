import { defineStore } from 'pinia'
import proj4 from 'proj4'
import { ref } from 'vue'

const center = ref([0, 0])

const WGS84 = { epsg: 'EPSG:4326' } // WGS84 projection
const WEBMERCATOR = { epsg: 'EPSG:3857' } // Web Mercator projection

export const usePositionStore = defineStore('positionStore', () => {
  const zoomLevel = ref(0)
  const rotation = ref(0)
  const resolution = ref(0)
  const latitude = ref(0)

  const setZoom = (level: number, dispatcher) => {
    if (level < 0) {
      throw new Error('Zoom level cannot be negative')
    }
    zoomLevel.value = parseFloat(level.toFixed(3))

    console.log('Zoom level:', zoomLevel.value)
    console.log('Latitude value in setZoom:', latitude.value)
    console.log('Cosine of latitude:', Math.cos((latitude.value * Math.PI) / 180))
    console.log('Intermediate resolution (before division):', 78271.51696 * Math.cos((latitude.value * Math.PI) / 180))

    // Update resolution based on zoom level and latitude state
    resolution.value = (78271.51696 * Math.cos((latitude.value * Math.PI) / 180)) / Math.pow(2, zoomLevel.value)

    if (dispatcher) {
      dispatcher({ zoom: zoomLevel.value, resolution: resolution.value })
    }
  }

  const setRotation = (angle, dispatcher) => {
    rotation.value = ((angle + Math.PI) % (2 * Math.PI)) - Math.PI
  }

  const setProjection = (projection, dispatcher) => {
    // Placeholder for projection logic
  }

  const setCenter = (coordinates, dispatcher) => {
    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new Error('Invalid coordinates. Expected an array with two numbers.')
    }

    if (!proj4.defs(WGS84.epsg) || !proj4.defs(WEBMERCATOR.epsg)) {
      throw new Error('Invalid projection definitions for WGS84 or Web Mercator.')
    }

    console.log('WGS84 EPSG:', WGS84.epsg)
    console.log('WEBMERCATOR EPSG:', WEBMERCATOR.epsg)

    const [x, y] = coordinates
    if (!isFinite(x) || !isFinite(y)) {
      throw new Error('Input coordinates must be finite numbers.')
    }

    console.log('Input coordinates:', coordinates)

    // Assuming WGS84 and Web Mercator projections are defined elsewhere
    const transformedCoordinates = proj4(WGS84.epsg, WEBMERCATOR.epsg, [x, y])

    if (!isFinite(transformedCoordinates[0]) || !isFinite(transformedCoordinates[1])) {
      throw new Error('Transformed coordinates must be finite numbers.')
    }

    center.value = transformedCoordinates

    console.log('Transformed coordinates:', transformedCoordinates)

    // Transform the y coordinate back to WGS84 to get the latitude in degrees
    const [transformedLon, transformedLat] = proj4(WEBMERCATOR.epsg, WGS84.epsg, transformedCoordinates)

    if (!isFinite(transformedLat)) {
      throw new Error('Transformed latitude must be a finite number.')
    }

    latitude.value = transformedLat

    if (dispatcher) {
      dispatcher(transformedCoordinates)
    }
  }

  return {
    zoomLevel,
    resolution,
    latitude,
    setZoom,
    rotation,
    setRotation,
    setProjection,
    center,
    setCenter,
  }
})