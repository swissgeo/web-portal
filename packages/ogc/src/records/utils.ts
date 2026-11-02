import type { Link, TemplateLink } from "@/types/Records";

export const getLinksByRel = (links: Link[], rel: string): Link[] => {
  return links.filter(
    (link: Link) => link.rel?.toLowerCase() === rel.toLowerCase(),
  );
};

export const replaceTemplateVarsWithDefaults = (
  linkTemplate: TemplateLink,
): string => {
  const variables = linkTemplate.variables;
  let url = linkTemplate.uriTemplate;

  for (const [key, data] of Object.entries(variables)) {
    let _default = data.default;
    if (!_default) {
      const _enum = data.enum;
      _default = _enum?.[0];
      if (!_default) {
        throw new Error("Unable to deal with linkTemplate");
      }
    }

    url = url.replace(`{${key}}`, _default.toString());
  }

  return url;
};
