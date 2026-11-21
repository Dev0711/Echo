import { Twitter, Linkedin, Globe, FileText, BookOpen } from 'lucide-react';

export type PlatformIcon = React.ComponentType<{ size?: number; className?: string }>;

export const PLATFORMS: { id: string; name: string; icon: PlatformIcon }[] = [
  { id: 'devto', name: 'Dev.to', icon: Globe as PlatformIcon },
  { id: 'hashnode', name: 'Hashnode', icon: FileText as PlatformIcon },
  { id: 'twitter', name: 'X (Twitter)', icon: Twitter as PlatformIcon },
  { id: 'linkedin', name: 'LinkedIn', icon: Linkedin as PlatformIcon },
  { id: 'medium', name: 'Medium', icon: BookOpen as PlatformIcon },
];

export const platformMeta = (id: string) =>
  PLATFORMS.find(p => p.id === id) ?? { id, name: id, icon: Globe as PlatformIcon };

/** Turns Markdown into a short plain-text excerpt for cards. */
export function excerptOf(markdown?: string, max = 140): string {
  if (!markdown) return '';
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > max ? plain.slice(0, max).trimEnd() + '…' : plain;
}

export const wordCountOf = (markdown?: string) => (markdown ? markdown.split(/\s+/).filter(Boolean).length : 0);
