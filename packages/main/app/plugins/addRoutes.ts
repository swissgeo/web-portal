import type { MenuTree, MenuEntry, MenuEntryLangaugeItem } from '@swissgeo/shared/api'
import type { Lang } from '@swissgeo/shared/language'
import type { RouteRecordRaw } from 'vue-router'

import log, { LogPreDefinedColor } from '@swissgeo/log'
import { ALLOWED_LANGUAGES } from '@swissgeo/shared'
import page from '~/pages/page.vue'
import slugify from 'slugify'
import { joinURL } from 'ufo'

const getMenu = async (id: number) => {
    try {
        const { data } = await useFetch<MenuTree>(`/api/v1/content/menu/${id}`)

        if (!data.value?.length) {
            log.warn('No data received from menus')
            return []
        }

        return data.value
    } catch (exception) {
        log.error(exception)
        return []
    }
}

const isSupportedLang = (lang: string): lang is Lang => ALLOWED_LANGUAGES.includes(lang as Lang)

const makeRouteEntries = (
    menuEntry: MenuEntry,
    parentPath: string,
    isToplevel = false
): RouteRecordRaw[] => {
    const languages = Object.keys(menuEntry).filter((key) => key !== 'children')

    const records = []

    const getChildren = (lang: Lang, path: string) => {
        const children: RouteRecordRaw[] = []

        if (menuEntry.children) {
            for (const child of menuEntry.children) {
                if (child[lang]) {
                    // we only wanna get the children of the same language, so we only
                    // push that version to the sub-sequent call
                    children.push(...makeRouteEntries({ [lang]: child[lang] }, path))
                }
            }
        }
        return children
    }

    for (const lang of languages) {
        if (!isSupportedLang(lang)) {
            continue
        }

        const langEntry = menuEntry[lang] as MenuEntryLangaugeItem

        const slug = slugify(langEntry.slug)
        const path = joinURL(parentPath, slug)

        records.push({
            name: langEntry.slug,
            path,
            file: '~/pages/page.vue',
            component: page,
            meta: {
                documentId: langEntry.documentId,
                fromApi: true,
                lang,
                isToplevel,
                label: langEntry.label,
            },
            children: getChildren(lang, path),
        })
    }

    return records
}

export default defineNuxtPlugin({
    name: 'addRoutes',

    hooks: {
        // https://nuxt.com/docs/4.x/api/advanced/hooks#nuxt-hooks-build-time
        async 'app:created'() {
            // this is run when vueApp instance is created
            // this means this runs when a route/page is being rendered
            const nuxtApp = useNuxtApp()

            const runtimeConfig = useRuntimeConfig()
            const menuStore = useMenuStore()

            if (!runtimeConfig.public.aboutMenu.id || !runtimeConfig.public.knowledgeMenu.id) {
                // missing config, stop trying to fetch menus for now
                log.warn({
                    title: 'Add Routes',
                    titleColor: LogPreDefinedColor.Cyan,
                    messages: ['Menu id or Knowledge id are not set, quitting getting the routes'],
                })
                return
            }

            const menuIds = [
                runtimeConfig.public.aboutMenu.id,
                runtimeConfig.public.knowledgeMenu.id,
            ]

            const menus = menuIds.map((id) => getMenu(id))
            const entries: MenuTree[] = await Promise.all(menus)

            if (entries.length === 0) {
                log.warn('No menu entries found!')
            }

            // this will serve as a flat list of all the possible
            // routes to add them to the router further down
            const routes = []

            menuStore.setMenuData(menuIds, entries)

            for (const entry of entries) {
                for (const item of entry) {
                    const routeEntries = makeRouteEntries(item, '/content', true)
                    for (const routeEntry of routeEntries) {
                        routes.push(routeEntry)
                    }
                }
            }
            // for (const tree of entries) {
            //     const routes = makeRouteEntries(tree, '/content/', true)
            // }

            for (const entry of routes) {
                // we only add top level routes explicitly to the router, the rest will
                // be added as the children of those routes
                nuxtApp.$router.addRoute(entry)
            }
        },
    },
})
