// Redirect /map to the locale-appropriate map page.
// Behaves identically to / — reads the i18n_redirected cookie to restore
// the user's last-selected language, falling back to 'de'.
import { defineEventHandler, sendRedirect } from 'h3'

export default defineEventHandler((event) => {
    const locale = resolveLocale(event)
    return sendRedirect(event, `/${locale}/map`, 302)
})
