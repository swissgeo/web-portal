import LucideIcon from "@/components/LucideIcon.vue";
import SearchButton from "@/components/sidebar/SearchButton.vue";

import ContentButton from "./components/sidebar/ContentButton.vue";

import SideBar from "./components/sidebar/SideBar.vue";

// export default {
//     install(app: App) {
//         // TODO probably some namespacing would be good here
//         app.component('LucideIcon', LucideIcon)

//         app.component('SearchPanelButton', SearchButton)
//         app.component('SidebarContentButton', SidebarContentButton)
//     },
// }

export { SidebarType, useUiStore } from "@/stores/ui";

export { SideBar, SearchButton, LucideIcon, ContentButton };
