export function resolveWebUrl(
  href: string | null,
  base?: string,
): string | null {
  if (!href || !URL.canParse(href, base)) {
    return null;
  }

  const url = new URL(href, base);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return null;
  }

  return url.href;
}
