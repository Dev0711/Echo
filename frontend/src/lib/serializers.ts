import { PartialBlock } from "@blocknote/core";

export function serializeToPlainText(blocks: PartialBlock[]): string {
  let text = "";
  for (const block of blocks) {
    const content = (block as any).content;
    if (content && Array.isArray(content)) {
      let prefix = "";
      if (block.type === "bulletListItem") prefix = "• ";
      else if (block.type === "numberedListItem") prefix = "- ";
      else if (block.type === "checkListItem") {
        prefix = (block.props as any)?.checked ? "☑ " : "☐ ";
      }

      text += prefix;
      for (const inline of content) {
        if (inline.type === "text") {
          text += inline.text;
        } else if (inline.type === "link") {
          text += inline.content[0]?.text + " (" + inline.href + ")";
        }
      }
      text += "\n\n";
    }
    
    if (block.children && block.children.length > 0) {
      text += serializeToPlainText(block.children);
    }
  }
  return text.trim();
}

export function chunkForTwitter(text: string): string[] {
  // Very simplistic chunking: split by double newlines, then group up to 280 chars
  const paragraphs = text.split('\n\n').filter(p => p.trim() !== '');
  const chunks: string[] = [];
  let currentChunk = "";
  
  for (const p of paragraphs) {
    if ((currentChunk.length + p.length + 2) > 280) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = p;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + p;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}
