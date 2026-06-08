import type { Paragraph } from "./types/Paragraph";
import type {
  ContentItem,
  Image,
  LeadContentPageWithCheckbox,
} from "./types/Publication";
import type { TitleComponent } from "./types/Title";

export function isLeadContentPageWithCheckbox(
  item: ContentItem,
): item is LeadContentPageWithCheckbox {
  return (
    "component" in item && item.component === "lead-contentpage-with-checkbox"
  );
}

export function isParagraph(item: ContentItem): item is Paragraph {
  return "component" in item && item.component === "p";
}

export function isImage(item: ContentItem): item is Image {
  return "image" in item.content;
}

export function isTitle(item: ContentItem): item is TitleComponent {
  return "title" in item.content;
}
