// DEV.to requires a linked image in Markdown. Postmill also stores the image as
// media, so remove the Markdown token only from its own text previews.
export const previewTextWithoutLinkedImages = (content: string) =>
  content.replace(/\[!\[[^\]]*\]\([^\r\n)]*\)\]\([^\r\n)]*\)[ \t]*(?:\r?\n)?/g, '');
