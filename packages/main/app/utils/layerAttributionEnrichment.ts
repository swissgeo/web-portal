import type { LayerAttribution } from '@swissgeo/shared'

import log, { LogPreDefinedColor } from '@swissgeo/log'

type SupportedLanguage = 'de' | 'fr' | 'en'

type AttributionMetadata = {
    attribution?: string
    attributionUrl?: string
}

type LayersConfig = Record<string, AttributionMetadata>

export type AttributionEnrichment = {
    title?: string
    url?: string
}

const FALLBACK_LANGUAGE: SupportedLanguage = 'de'
const languageCache = new Map<SupportedLanguage, Promise<LayersConfig>>()

function normalizeLanguage(language: string): SupportedLanguage {
    if (language === 'de' || language === 'fr' || language === 'en') {
        return language
    }

    return FALLBACK_LANGUAGE
}

function normalizeString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmed = value.trim()

    return trimmed.length > 0 ? trimmed : undefined
}

function parseLayersConfig(value: unknown): LayersConfig {
    if (!value || typeof value !== 'object') {
        return {}
    }

    const parsedConfig: LayersConfig = {}

    for (const [layerId, layerConfig] of Object.entries(value as Record<string, unknown>)) {
        if (!layerConfig || typeof layerConfig !== 'object') {
            continue
        }

        const normalizedAttribution = normalizeString(
            (layerConfig as Record<string, unknown>).attribution
        )
        const normalizedAttributionUrl = normalizeString(
            (layerConfig as Record<string, unknown>).attributionUrl
        )

        if (!normalizedAttribution && !normalizedAttributionUrl) {
            continue
        }

        parsedConfig[layerId] = {
            attribution: normalizedAttribution,
            attributionUrl: normalizedAttributionUrl,
        }
    }

    return parsedConfig
}

function addLanguageToEndpoint(endpoint: string, language: SupportedLanguage): string {
    if (endpoint.includes('{lang}')) {
        return endpoint.replaceAll('{lang}', language)
    }

    if (/[?&]lang=/.test(endpoint)) {
        return endpoint.replace(/([?&]lang=)[^&]*/u, `$1${language}`)
    }

    const separator = endpoint.includes('?') ? '&' : '?'

    return `${endpoint}${separator}lang=${language}`
}

async function fetchLayersConfig(
    language: SupportedLanguage,
    endpoint: string | undefined
): Promise<LayersConfig> {
    if (!endpoint) {
        return {}
    }

    if (!languageCache.has(language)) {
        const requestUrl = addLanguageToEndpoint(endpoint, language)

        languageCache.set(
            language,
            $fetch<unknown>(requestUrl)
                .then((response) => parseLayersConfig(response))
                .catch((error) => {
                    log.warn({
                        title: 'layerAttributionEnrichment/fetchLayersConfig',
                        titleColor: LogPreDefinedColor.Orange,
                        messages: [`Failed to fetch layersConfig for language ${language}`, error],
                    })

                    return {}
                })
        )
    }

    return (await languageCache.get(language)) ?? {}
}

/**
 * Enrichment is applied at layer add-time only.
 * Existing layers are not rewritten when locale changes later.
 */
export async function getAttributionForLayer(
    layerId: string,
    language: string,
    endpoint: string | undefined
): Promise<AttributionEnrichment | null> {
    const normalizedLanguage = normalizeLanguage(language)
    const layersConfig = await fetchLayersConfig(normalizedLanguage, endpoint)
    const metadata = layersConfig[layerId]

    if (!metadata) {
        return null
    }

    return {
        title: metadata.attribution,
        url: metadata.attributionUrl,
    }
}

export function mergeLayerAttribution(
    existingAttribution: LayerAttribution | undefined,
    enrichment: AttributionEnrichment | null
): LayerAttribution | undefined {
    if (!enrichment) {
        return existingAttribution
    }

    const mergedTitle = enrichment.title ?? existingAttribution?.title

    if (!mergedTitle) {
        return undefined
    }

    const mergedUrl = enrichment.url ?? existingAttribution?.url

    return {
        title: mergedTitle,
        ...(mergedUrl ? { url: mergedUrl } : {}),
    }
}

export function clearLayerAttributionCacheForTests() {
    languageCache.clear()
}
