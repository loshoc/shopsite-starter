import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = ["p", "br", "strong", "b", "em", "i", "ul", "ol", "li", "a", "h1", "h2", "h3", "h4", "blockquote"];

/**
 * Allowlist sanitizer for imported product copy. Script, style, event
 * handlers, and javascript: URLs are discarded. Render paths run this again
 * before dangerouslySetInnerHTML.
 */
export function sanitizeDescription(input: string): string {
  return sanitizeHtml(input, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "title"],
    },
    allowedSchemes: ["https", "mailto"],
    allowProtocolRelative: false,
    disallowedTagsMode: "discard",
    exclusiveFilter: (frame) => {
      const tag = frame.tag.toLowerCase();
      return (
        tag === "script" ||
        tag === "style" ||
        tag === "iframe" ||
        tag === "object" ||
        tag === "embed" ||
        tag === "link" ||
        tag === "meta" ||
        tag === "form" ||
        tag === "img" ||
        tag === "svg"
      );
    },
  }).trim();
}
