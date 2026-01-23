import type { MenuTree } from '@swissgeo/shared/api'
import type { Lang } from '@swissgeo/shared/language'

import { defineStore } from 'pinia'
import { ref } from 'vue'

export type MenuIds = {
    readonly About: number

    readonly Knowledge: number
}

export type MenuMetaData = {
    id: number
    translationKey: string
}

export const useMenuStore = defineStore('menuStore', () => {
    const menuData = ref<Record<string, MenuTree>>()
    // const menuIds = ref<MenuIds>()
    const menuMetaData = ref<MenuMetaData[]>()

    const currentMenuTree = ref<MenuMetaData>()

    // #region: actions
    function setMenuData(ids: number[], menus: MenuTree[]) {
        // zipping it
        menuData.value = Object.fromEntries(
            ids.map((left, idx) => [left, menus[idx]]).filter((entry) => entry[1] !== undefined)
        )
    }

    function setCurrentMenuTree(menuData: MenuMetaData) {
        currentMenuTree.value = menuData
    }

    function getMenuMetaDataById(menuId: number) {
        for (const menu of menuMetaData.value || []) {
            if (menu.id === menuId) {
                return menu
            }
        }
        return null
    }

    /**
     * Search for an entry of the document id in the menues and return the submenu if it has any
     *
     * @param documentId The document ID to search for
     * @returns The submenu on the level of this document id or null
     */
    function findSubMenuOfDocument(documentId: string) {
        // TODO this here is a hack, since we don't have a good central
        // definition of the languages yet
        const isLang = (index: string): index is Lang => ['de', 'fr'].includes(index)

        const traverse = (tree: MenuTree): MenuTree | null => {
            for (const menu of tree) {
                for (const index in menu) {
                    if (index === 'children') {
                        // recurse here?
                        const hit = traverse(menu[index] || [])
                        if (hit) {
                            // we found an entry in the children
                            // return here
                            return hit
                        }
                    } else if (isLang(index) && menu[index]) {
                        if (menu[index].documentId === documentId) {
                            // OK this is the document we're looking for
                            // now we return the children of this entry
                            if ('children' in menu && menu['children']) {
                                return menu['children']
                            }
                        }
                    }
                }
            }

            // no submenu found
            return null
        }

        if (menuData.value === undefined) {
            return null
        }

        for (const menuTreeId in menuData.value) {
            const tree = traverse(
                menuData.value[menuTreeId] || []
                /* even if the key exists, it may still be undefined, hence || [].. */
            )

            if (tree) {
                return tree
            }
        }

        return null
    }

    function _initMenuIds() {
        const runtimeConfig = useRuntimeConfig()

        if (!menuMetaData.value) {
            menuMetaData.value = [
                runtimeConfig.public.aboutMenu,
                runtimeConfig.public.knowledgeMenu,
            ]
        }

        // if (!menuIds.value) {
        //     menuIds.value = {
        //         About: runtimeConfig.public.aboutMenu.id,
        //         Knowledge: runtimeConfig.public.knowledgeMenu.id,
        //     }
        // }
    }
    // #endregion

    // initialize the data here
    _initMenuIds()

    return {
        currentMenuTree,
        menuData,
        setMenuData,
        setCurrentMenuTree,
        getMenuMetaDataById,
        findSubMenuOfDocument,
    }
})
