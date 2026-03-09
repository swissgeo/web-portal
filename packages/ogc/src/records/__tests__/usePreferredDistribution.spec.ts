import { describe, expect, it } from 'vitest'
import { ref } from 'vue'

import type { Dataset } from '@/types'

import { usePreferredDistribution } from '../usePreferredDistribution'
import ChBafuSchutzgebieteLuftfahrt from './fixtures/dataset_ch.bafu.schutzgebiete-luftfahrt.json'

describe('usePreferredDistribution extracting the preferredDistribution information from the dataset', () => {
    it('gets the preferred distribution entry', () => {
        const { preferredDistributionId } = usePreferredDistribution(
            ref(ChBafuSchutzgebieteLuftfahrt as Dataset)
        )

        expect(preferredDistributionId.value).toEqual('ch.bafu.schutzgebiete-luftfahrt:wmts')
    })

    it('handles missing preferred distribution', () => {
        const { preferredDistributionId } = usePreferredDistribution(
            ref({
                properties: {
                    title: 'Schutzgebiete MIL',
                    description:
                        'Die Schutzgebiete der militärischen Luftfahrthinderniskarte beinhalten den Nationalpark, Hochmoore, ausgewählte Auengebiete und Flachmoore, Wasser- und Zugvogelreservate und Eidgenössische Jagdbanngebiete. Bei den Wasser- und Zugvogelreservaten wurden bei einigen Objekten mit bestehender Nutzung die Perimeter angepasst. Bei den Mooren und Auen an Seen und Flussufern wurden zudem die Perimeter mit einem Puffer von 100m versehen.',
                    type: 'Dataset',
                },
            })
        )

        expect(preferredDistributionId.value).toEqual(null)
    })

    it('gets the preferred distribution entry if the dataset becomes available delayed', () => {
        const dataset = ref<Dataset | null>(null)

        const { preferredDistributionId } = usePreferredDistribution(dataset)
        expect(preferredDistributionId.value).toBe(null)

        dataset.value = ChBafuSchutzgebieteLuftfahrt as Dataset

        expect(preferredDistributionId.value).toEqual('ch.bafu.schutzgebiete-luftfahrt:wmts')
    })
})
