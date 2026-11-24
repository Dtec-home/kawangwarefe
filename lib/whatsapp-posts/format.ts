/**
 * WhatsApp's own text styling for the preview bubble (WA-3): `*bold*` and
 * `_italic_`, on one line, with something other than a space inside.
 */

export interface Segment {
  text: string;
  bold: boolean;
  italic: boolean;
}

const STYLE = /\*([^*\n\s](?:[^*\n]*[^*\n\s])?)\*|_([^_\n\s](?:[^_\n]*[^_\n\s])?)_/g;

export function whatsappSegments(line: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const match of line.matchAll(STYLE)) {
    const at = match.index ?? 0;
    if (at > last) out.push({ text: line.slice(last, at), bold: false, italic: false });
    out.push({ text: match[1] ?? match[2], bold: match[1] !== undefined, italic: match[2] !== undefined });
    last = at + match[0].length;
  }
  if (last < line.length || out.length === 0) out.push({ text: line.slice(last), bold: false, italic: false });
  return out;
}
