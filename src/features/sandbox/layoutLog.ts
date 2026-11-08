export type LogBlock =
  { type: 'text'; text: string } | { type: 'fence'; lang: string; code: string; closed: boolean };

/** Split a streamed reply into prose and fenced code. An unclosed fence stays open. */
export function splitLogBlocks(source: string): LogBlock[] {
  const blocks: LogBlock[] = [];
  const lines = source.split('\n');
  let prose: string[] = [];
  let fence: { lang: string; lines: string[] } | null = null;

  const flushProse = () => {
    if (prose.length === 0) {
      return;
    }
    const text = prose.join('\n');
    if (text !== '') {
      blocks.push({ type: 'text', text });
    }
    prose = [];
  };

  for (const line of lines) {
    if (fence) {
      if (line.startsWith('```')) {
        blocks.push({
          type: 'fence',
          lang: fence.lang,
          code: fence.lines.join('\n'),
          closed: true,
        });
        fence = null;
      } else {
        fence.lines.push(line);
      }
      continue;
    }
    if (line.startsWith('```')) {
      flushProse();
      fence = { lang: line.slice(3).trim(), lines: [] };
      continue;
    }
    prose.push(line);
  }

  if (fence) {
    blocks.push({
      type: 'fence',
      lang: fence.lang,
      code: fence.lines.join('\n'),
      closed: false,
    });
    return blocks;
  }
  flushProse();
  return blocks;
}
