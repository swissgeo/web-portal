// Redirect / to the locale-appropriate map page.
// Reads the i18n_redirected cookie to restore the user's last-selected language.
import { sendRedirect } from 'h3'

export default defineEventHandler((event) => {
    const locale = resolveLocale(event)
    return sendRedirect(event, `/${locale}/map`, 302)
})
