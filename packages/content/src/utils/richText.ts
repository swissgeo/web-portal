export type RichTextNode =
  | { type: "break" }
  | {
      children: RichTextNode[];
      href?: string;
      tag: "a" | "em" | "strong" | "sup";
      target?: "_blank";
      type: "element";
    }
  | { text: string; type: "text" };

type RichTextElement = Extract<RichTextNode, { type: "element" }>;

const TAG = /<\/?([a-z][a-z0-9-]*)([^>]*)>/gi;
const ATTRIBUTE =
  /\b([a-z][a-z0-9-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>\u0060]+))/gi;

const decodeEntities = (value: string): string => {
  return value.replaceAll(
    /&(?:#(\d+)|#x([\da-f]+)|(amp|gt|lt|nbsp|quot|apos));/gi,
    (entity, decimal: string, hexadecimal: string, named: string) => {
      if (decimal) {
        return String.fromCodePoint(Number.parseInt(decimal, 10));
      }
      if (hexadecimal) {
        return String.fromCodePoint(Number.parseInt(hexadecimal, 16));
      }
      return (
        {
          amp: "&",
          apos: "'",
          gt: ">",
          lt: "<",
          nbsp: "\u00a0",
          quot: '"',
        }[named.toLowerCase()] ?? entity
      );
    },
  );
};

const attribute = (source: string, name: string): string | undefined => {
  for (const match of source.matchAll(ATTRIBUTE)) {
    const attributeName = match[1];
    if (attributeName?.toLowerCase() === name.toLowerCase()) {
      const value = match[2] ?? match[3] ?? match[4];
      return value ? decodeEntities(value) : undefined;
    }
  }
};

export const safeHref = (value: string | undefined): string | undefined => {
  const href = value?.trim();
  const hasControlCharacter = [...(href ?? "")].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0;
    return codePoint <= 31 || codePoint === 127;
  });
  if (!href || hasControlCharacter || href.startsWith("//")) {
    return;
  }

  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(href)?.[1]?.toLowerCase();
  if (scheme && !["http", "https", "mailto", "tel"].includes(scheme)) {
    return;
  }

  return href;
};

const normalizedTag = (value: string): RichTextElement["tag"] | undefined => {
  const tag = value.toLowerCase() === "b" ? "strong" : value.toLowerCase();
  return ["a", "em", "strong", "sup"].includes(tag)
    ? (tag as RichTextElement["tag"])
    : undefined;
};

export const parseRichText = (source: string): RichTextNode[] => {
  const root: RichTextNode[] = [];
  const stack: RichTextElement[] = [];
  const target = () => stack.at(-1)?.children ?? root;
  let offset = 0;

  for (const match of source.matchAll(TAG)) {
    const index = match.index ?? 0;
    if (index > offset) {
      target().push({
        text: decodeEntities(source.slice(offset, index)),
        type: "text",
      });
    }

    const rawTag = match[1]?.toLowerCase();
    if (!rawTag) {
      continue;
    }
    const attributeSource = match[2] ?? "";
    const isClosing = match[0].startsWith("</");
    if (rawTag === "br" && !isClosing) {
      target().push({ type: "break" });
      offset = index + match[0].length;
      continue;
    }

    const tag = normalizedTag(rawTag);
    if (tag && isClosing) {
      const openIndex = stack.findLastIndex((node) => node.tag === tag);
      if (openIndex >= 0) {
        stack.splice(openIndex);
      }
    } else if (tag) {
      const href =
        tag === "a" ? safeHref(attribute(attributeSource, "href")) : undefined;
      const node: RichTextElement = {
        children: [],
        href,
        tag,
        target:
          tag === "a" && attribute(attributeSource, "target") === "_blank"
            ? "_blank"
            : undefined,
        type: "element",
      };
      target().push(node);
      stack.push(node);
    }

    offset = index + match[0].length;
  }

  if (offset < source.length) {
    target().push({ text: decodeEntities(source.slice(offset)), type: "text" });
  }

  return root;
};
