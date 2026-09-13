'use client';

import { useEffect, useState } from 'react';
import { BlockNoteEditor, PartialBlock } from "@blocknote/core";
import { serializeToPlainText, chunkForTwitter } from '@/lib/serializers';
import { User, CheckCircle, Copy, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import './platform-previews.css';

interface PreviewRendererProps {
  platform: string;
  structuredContent: string;
  title: string;
  tags: string[];
}

export function PreviewRenderer({ platform, structuredContent, title, tags }: PreviewRendererProps) {
  const [html, setHtml] = useState<string>("");
  const [plainText, setPlainText] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function parse() {
      if (!structuredContent) return;
      
      let blocks: PartialBlock[] = [];
      try {
        // Check if it looks like JSON array (BlockNote AST)
        if (structuredContent.trim().startsWith('[')) {
          blocks = JSON.parse(structuredContent) as PartialBlock[];
        } else {
          // Fallback: it's raw Markdown (e.g. older posts)
          const tempEditor = BlockNoteEditor.create();
          blocks = await tempEditor.tryParseMarkdownToBlocks(structuredContent);
        }
      } catch (e) {
        console.error("Failed to parse structuredContent for preview", e);
        return;
      }

      try {
        // For plain text platforms
        if (platform === 'twitter' || platform === 'linkedin') {
          setPlainText(serializeToPlainText(blocks));
          return;
        }

        // For rich text platforms
        const tempEditor = BlockNoteEditor.create({ initialContent: blocks.length > 0 ? blocks : undefined });
        const htmlOutput = await tempEditor.blocksToHTMLLossy(blocks);
        setHtml(htmlOutput);
      } catch (e) {
        console.error("Failed to render blocks", e);
      }
    }
    parse();
  }, [structuredContent, platform]);

  const copyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (platform === 'twitter') {
    const chunks = chunkForTwitter(plainText);
    return (
      <div className="p-6 space-y-3 max-w-lg mx-auto">
        <p className="label-xs mb-3">Thread Preview — {chunks.length} tweets</p>
        {chunks.map((chunk, i) => (
          <div key={i} className="bg-[#141414] border border-[#252525] rounded-lg p-4 relative group">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <User size={14} className="text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[12px] font-semibold text-[#f2f2f2]">You</span>
                  <span className="text-[11px] text-[#52525b]">@yourhandle · now</span>
                </div>
                <p className="whitespace-pre-wrap text-[13px] text-[#d4d4d4] leading-relaxed">{chunk}</p>
              </div>
            </div>
            {i < (chunks.length - 1) && (
              <div className="absolute left-[27px] top-[52px] bottom-[-14px] w-px bg-[#252525]" />
            )}
            <button
              onClick={() => copyToClipboard(chunk, `tw-${i}`)}
              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              {copied === `tw-${i}` ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} className="text-[#52525b] hover:text-[#d4d4d4]" />}
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (platform === 'linkedin') {
    return (
      <div className="p-6">
        <div className="max-w-lg mx-auto bg-[#141414] border border-[#252525] rounded-lg overflow-hidden">
          <div className="flex gap-3 p-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <User size={16} className="text-blue-400" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#f2f2f2]">Your Name</p>
              <p className="text-[11px] text-[#52525b]">Content Creator · Just now · 🌐</p>
            </div>
          </div>
          <Separator />
          <div className="p-4">
            <p className="whitespace-pre-wrap text-[13px] text-[#d4d4d4] leading-relaxed">{plainText}</p>
          </div>
          <Separator />
          <div className="px-4 py-2 flex items-center gap-4">
            <span className="text-[11px] text-[#52525b]">👍 Like</span>
            <span className="text-[11px] text-[#52525b]">💬 Comment</span>
            <span className="text-[11px] text-[#52525b]">🔁 Repost</span>
          </div>
        </div>
      </div>
    );
  }

  // Dev.to, Hashnode, Medium rich HTML previews
  // We apply a specific wrapper class that drives the CSS sandboxing.
  const platformClass = `preview-${platform}`;

  return (
    <div className={`p-8 max-w-2xl mx-auto ${platformClass}`}>
      {/* Mock Author Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0">
            <User size={18} />
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#f2f2f2]">Author</p>
            <p className="text-[12px] text-[#a3a3a3]">
              {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-[#a3a3a3]">
          <Heart size={18} className="cursor-pointer hover:text-red-400 transition-colors" />
          <MessageCircle size={18} className="cursor-pointer hover:text-blue-400 transition-colors" />
        </div>
      </div>

      {title && (
        <h1 className="preview-title">{title}</h1>
      )}
      {tags && tags.length > 0 && (
        <div className="preview-tags">
          {tags.map(tag => (
            <Badge key={tag} variant="default" className="preview-tag-badge">#{tag}</Badge>
          ))}
        </div>
      )}
      <Separator className="my-6 preview-separator" />
      <div
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
