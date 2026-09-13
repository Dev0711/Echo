'use client';

import { useState } from 'react';
import type { PreviewResponse } from '@/types';
import { Twitter, Linkedin, Globe, FileText, CheckCircle, Copy, User, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface PreviewPanelProps {
  previews: PreviewResponse['previews'];
}

const PLATFORM_META: Record<string, { name: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
  devto:    { name: 'Dev.to',      icon: Globe as any },
  hashnode: { name: 'Hashnode',    icon: FileText as any },
  medium:   { name: 'Medium',      icon: BookOpen as any },
  twitter:  { name: 'X (Twitter)', icon: Twitter as any },
  linkedin: { name: 'LinkedIn',    icon: Linkedin as any },
};

export function PreviewPanel({ previews }: PreviewPanelProps) {
  const tabs = Object.keys(previews);
  const [activeTab, setActiveTab] = useState<string>(tabs[0] ?? 'devto');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (tabs.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <Globe size={24} className="text-[#3a3a3a] mb-3" />
        <p className="text-[13px] text-[#52525b]">No preview available.</p>
      </div>
    );
  }

  const activePreview = previews[activeTab];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center px-4 shrink-0 overflow-x-auto hide-scrollbar" style={{ borderBottom: '1px solid #1f1f1f' }}>
        {tabs.map(platform => {
          const meta = PLATFORM_META[platform] ?? { name: platform, icon: Globe as any };
          const Icon = meta.icon;
          const isActive = activeTab === platform;
          return (
            <button
              key={platform}
              onClick={() => setActiveTab(platform)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-[12px] font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? 'border-indigo-500 text-[#f2f2f2]'
                  : 'border-transparent text-[#71717a] hover:text-[#d4d4d4]'
              }`}
            >
              <Icon size={12} className={isActive ? 'text-indigo-400' : ''} />
              {meta.name}
            </button>
          );
        })}
      </div>

      {/* Preview content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {!activePreview ? (
            <p className="text-[12px] text-[#52525b]">Preview not available for this platform.</p>
          ) : (
            <>
              {/* TWITTER — thread preview */}
              {activeTab === 'twitter' && activePreview.type === 'CHUNKED' && (
                <div className="space-y-3 max-w-lg mx-auto">
                  <p className="label-xs mb-3">Thread Preview — {activePreview.chunks?.length} tweets</p>
                  {activePreview.chunks?.map((chunk, i) => (
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
                      {i < (activePreview.chunks!.length - 1) && (
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
              )}

              {/* LINKEDIN — post preview */}
              {activeTab === 'linkedin' && activePreview.type === 'SINGLE_BODY' && (
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
                    <p className="whitespace-pre-wrap text-[13px] text-[#d4d4d4] leading-relaxed">{activePreview.body}</p>
                  </div>
                  <Separator />
                  <div className="px-4 py-2 flex items-center gap-4">
                    <span className="text-[11px] text-[#52525b]">👍 Like</span>
                    <span className="text-[11px] text-[#52525b]">💬 Comment</span>
                    <span className="text-[11px] text-[#52525b]">🔁 Repost</span>
                  </div>
                </div>
              )}

              {/* DEV.TO / HASHNODE / MEDIUM — article preview */}
              {['devto', 'hashnode', 'medium'].includes(activeTab) && activePreview.type === 'SINGLE_BODY' && (
                <div className="max-w-2xl mx-auto">
                  {activePreview.title && (
                    <h1 className="text-[22px] font-bold text-[#f2f2f2] leading-tight mb-4">{activePreview.title}</h1>
                  )}
                  {activePreview.tags && activePreview.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {activePreview.tags.map(tag => (
                        <Badge key={tag} variant="default">#{tag}</Badge>
                      ))}
                    </div>
                  )}
                  <Separator className="mb-5" />
                  <div
                    className="prose prose-sm prose-invert max-w-none text-[13px] leading-relaxed text-[#d4d4d4]"
                    dangerouslySetInnerHTML={{ __html: activePreview.body || '' }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      {/* Footer copy button */}
      {activePreview?.type === 'SINGLE_BODY' && activePreview.body && (
        <>
          <Separator />
          <div className="px-4 py-3 flex justify-end shrink-0">
            <Button
              variant="outline" size="sm"
              onClick={() => copyToClipboard(activePreview.body!, activeTab)}
            >
              {copied === activeTab ? <CheckCircle size={12} className="text-emerald-400" /> : <Copy size={12} />}
              {copied === activeTab ? 'Copied!' : 'Copy Content'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}