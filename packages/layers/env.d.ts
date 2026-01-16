declare global {
    interface Window {
        map: OlMap
    }
}

const map = window.map || {}
