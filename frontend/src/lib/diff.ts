export type DiffToken = { text: string; type: 'same' | 'removed' | 'added' };

/** Word-level LCS diff. Inputs are capped so the O(m·n) table stays cheap. */
export function wordDiff(original: string, revised: string, maxWords = 1500): DiffToken[] {
  const a = original.split(/\s+/).filter(Boolean).slice(0, maxWords);
  const b = revised.split(/\s+/).filter(Boolean).slice(0, maxWords);
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  const tokens: DiffToken[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { tokens.push({ text: a[i - 1], type: 'same' }); i--; j--; }
    else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) { tokens.push({ text: b[j - 1], type: 'added' }); j--; }
    else { tokens.push({ text: a[i - 1], type: 'removed' }); i--; }
  }
  return tokens.reverse();
}

export function diffStats(tokens: DiffToken[]) {
  return {
    added: tokens.filter(t => t.type === 'added').length,
    removed: tokens.filter(t => t.type === 'removed').length,
  };
}

/**
 * Finds the introduction paragraph of a Markdown post: the first block that is plain prose
 * (not a heading, code fence, image, list, quote or table). Returns its text and character range.
 */
export function findIntro(markdown: string): { text: string; start: number; end: number } | null {
  const re = /\S[\s\S]*?(?=\n\s*\n|$)/g;
  let m: RegExpExecArray | null;
  let inFence = false;
  while ((m = re.exec(markdown)) !== null) {
    const block = m[0];
    if (/^```/.test(block.trim())) { inFence = !/```\s*$/.test(block.trim()) || block.trim() === '```'; continue; }
    if (inFence) { if (/```\s*$/.test(block)) inFence = false; continue; }
    if (/^(#{1,6}\s|>|[-*+]\s|\d+\.\s|!\[|\||---|<)/.test(block.trim())) continue;
    return { text: block, start: m.index, end: m.index + block.length };
  }
  return null;
}
