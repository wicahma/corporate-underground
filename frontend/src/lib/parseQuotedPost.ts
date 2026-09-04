export interface ParsedContent {
  mainText: string;
  quote?: {
    author: string;
    text: string;
  };
}

export function parseQuotedPost(content: string): ParsedContent {
  const quoteRegex = /(?:^|\n\n?)> Reposting @([^:\n]+):\n> "([\s\S]*?)"?\s*$/;
  const match = content.match(quoteRegex);
  if (match) {
    const mainText = content.replace(quoteRegex, '').trim();
    return {
      mainText,
      quote: {
        author: match[1].trim(),
        text: match[2].trim().replace(/^"|"$/g, ''),
      },
    };
  }
  return { mainText: content };
}