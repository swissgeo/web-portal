import type { Map } from "ol";
import type { Ref } from "vue";

import { useDrawing } from "@swissgeo/drawing";
import log, { LogPreDefinedColor } from "@swissgeo/log";
import {
  createDrawingFeatureStyleFunction,
  createTextFeatureStyle,
  DRAWING_KML_LAYER_ID,
  EPSG_4326_WGS84,
  isDrawingFeature,
  parseBoolean,
  resolveColoredSvgDataUrl,
  resolveStyleProps,
} from "@swissgeo/shared";
import KML from "ol/format/KML";
import VectorLayer from "ol/layer/Vector";
import { register } from "ol/proj/proj4";
import VectorSource from "ol/source/Vector";
import { Icon, Style } from "ol/style";
import proj4 from "proj4";
import { computed, ref, watch } from "vue";

import type { KMLLayer } from "@/types";

import useAddLayerToMap from "@/composables/useAddLayerToMap.composable";
import usePositionStore from "@/stores/position";

export default function useOlKMLLayer(
  layer: Ref<KMLLayer>,
  olMap: Ref<Map | undefined> | undefined,
) {
  const { drawingVectorLayer, DRAWING_LAYER_UUID } = useDrawing();
  const layerId = computed(() => layer.value.layerId);
  const zIndex = computed(() => layer.value.zIndex);
  const isVisible = computed(() => layer.value.isVisible);
  const opacity = computed(() => layer.value.opacity);
  const kmlData = computed(() => layer.value.data);
  const isDrawingLayer = computed(
    () => DRAWING_LAYER_UUID === layer.value.uuid,
  );

  watch(opacity, (newOpacity) => {
    if (!olLayer.value) {
      return;
    }

    olLayer.value.setOpacity(newOpacity);
  });

  const positionStore = usePositionStore();

  const olLayer = ref<VectorLayer>();

  watch(
    () => kmlData.value,
    () => {
      // A KML layer could be used for drawing, in that case we want to keep the same OL layer
      if (isDrawingLayer.value) {
        olLayer.value = drawingVectorLayer;
      } else {
        olLayer.value = new VectorLayer({
          properties: {
            id: layerId,
            uuid: layer.value.uuid,
          },
          opacity: opacity.value,
        });
        initialize();
      }
    },
    { immediate: true },
  );

  function initialize(): void {
    log.debug({
      title: "useOlKMLLayer",
      titleColor: LogPreDefinedColor.Fuchsia,
      messages: [`Initializing KML layer ${layerId.value}`],
    });

    const format = new KML({
      extractStyles: true, // Extract styles from KML for non-text features
    });
    register(proj4);
    const features = format.readFeatures(kmlData.value, {
      featureProjection: positionStore.projection.epsg, // CH1903+ / LV95 / EPSG:2056
      dataProjection: EPSG_4326_WGS84, // WGS84
    });

    // Restore text properties for text features and normalize icon scale for drawing points.
    const isDrawingKmlLayer = layerId.value === DRAWING_KML_LAYER_ID;
    features.forEach((feature) => {
      if (isDrawingKmlLayer) {
        feature.unset("__isSelected", true);
      }

      const name = feature.get("name");
      const text = feature.get("text");
      const isTextFeature = parseBoolean(feature.get("isTextFeature"));
      const geometry = feature.getGeometry();
      const styleProps = resolveStyleProps(feature);

      // If marked as text feature or has text without iconId, treat as text
      if (isTextFeature) {
        const textContent = text || name;
        feature.set("text", textContent);
        feature.set("isTextFeature", true);
      } else if (geometry?.getType() === "Point") {
        feature.set("isTextFeature", false);
        if (
          !feature.get("title") &&
          typeof name === "string" &&
          name.trim().length > 0
        ) {
          feature.set("title", name);
        }
      }

      const existingFeatureStyle = feature.getStyle();
      let normalizedFeatureStyle = existingFeatureStyle;

      if (geometry?.getType() === "Point") {
        const rawIconSize =
          typeof styleProps.iconSize === "number" ||
          typeof styleProps.iconSize === "string"
            ? styleProps.iconSize
            : feature.get("iconSize");
        const iconColor =
          typeof styleProps.iconColor === "string" &&
          styleProps.iconColor.length > 0
            ? styleProps.iconColor
            : undefined;
        const iconSize =
          typeof rawIconSize === "number"
            ? rawIconSize
            : typeof rawIconSize === "string"
              ? Number(rawIconSize)
              : NaN;

        if (
          existingFeatureStyle &&
          typeof existingFeatureStyle !== "function"
        ) {
          const styleList = Array.isArray(existingFeatureStyle)
            ? existingFeatureStyle
            : [existingFeatureStyle];

          const normalizedStyles = styleList.map((styleEntry) => {
            const imageStyle = styleEntry.getImage();
            if (!(imageStyle instanceof Icon)) {
              return styleEntry;
            }

            const src = imageStyle.getSrc();
            const resolvedSrc =
              src && iconColor ? resolveColoredSvgDataUrl(src, iconColor) : src;

            const scale =
              Number.isFinite(iconSize) && iconSize > 0
                ? iconSize
                : typeof imageStyle.getScale() === "number" &&
                    Number.isFinite(imageStyle.getScale())
                  ? imageStyle.getScale()
                  : 1;

            return new Style({
              image: new Icon({
                src: resolvedSrc,
                scale,
                anchor: imageStyle.getAnchor(),
                rotation: imageStyle.getRotation(),
                rotateWithView: imageStyle.getRotateWithView(),
              }),
              text: styleEntry.getText() ?? undefined,
              stroke: styleEntry.getStroke() ?? undefined,
              fill: styleEntry.getFill() ?? undefined,
              zIndex: styleEntry.getZIndex(),
            });
          });

          normalizedFeatureStyle = Array.isArray(existingFeatureStyle)
            ? normalizedStyles
            : normalizedStyles[0];
        }
      }

      if (isDrawingKmlLayer || isDrawingFeature(feature)) {
        feature.setStyle(
          createDrawingFeatureStyleFunction(normalizedFeatureStyle),
        );
        feature.changed();
      } else if (feature.get("isTextFeature")) {
        feature.setStyle(
          createTextFeatureStyle(String(feature.get("text") ?? "")),
        );
      }
    });

    const source = new VectorSource({
      features,
    });

    if (olLayer.value) {
      olLayer.value.setSource(source);
    }
    log.debug({
      title: "useOlKmlLayer",
      titleColor: LogPreDefinedColor.Fuchsia,
      messages: [
        `KML layer ${layerId.value} initialized with ${features.length} features`,
      ],
    });
  }

  const { addLayerToMap } = useAddLayerToMap(
    olLayer,
    zIndex,
    isVisible,
    opacity,
    olMap,
  );

  watch(
    () => olLayer.value,
    () => {
      // if the kml layer is a drawing layer, it is already added to the map
      // from within the drawing module
      if (!isDrawingLayer.value) {
        addLayerToMap();
      }
    },
    { immediate: true },
  );

  return {};
}
