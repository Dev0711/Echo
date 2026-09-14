'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, Link, Image as ImageIcon } from 'lucide-react';

interface SeoPanelProps {
  metaDescription: string;
  canonicalUrl: string;
  seoImageUrl: string;
  onChange: (field: 'metaDescription' | 'canonicalUrl' | 'seoImageUrl', value: string) => void;
}

export function SeoPanel({ metaDescription, canonicalUrl, seoImageUrl, onChange }: SeoPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const metaLength = metaDescription.length;
  const metaColor = metaLength === 0 ? 'text-zinc-600' : metaLength < 120 ? 'text-amber-400' : metaLength <= 160 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="border-t border-white/5 mx-8">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-3 text-left group"
      >
        <div className="flex items-center gap-2">
          <Search size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
          <span className="text-xs font-medium text-zinc-600 group-hover:text-zinc-400 transition-colors">SEO & Metadata</span>
        </div>
        {isOpen ? (
          <ChevronUp size={14} className="text-zinc-600" />
        ) : (
          <ChevronDown size={14} className="text-zinc-600" />
        )}
      </button>

      {isOpen && (
        <div className="pb-4 space-y-4">
          {/* Meta Description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-zinc-500">Meta Description</label>
              <span className={`text-xs ${metaColor}`}>{metaLength}/160</span>
            </div>
            <textarea
              value={metaDescription}
              onChange={(e) => onChange('metaDescription', e.target.value)}
              placeholder="A brief summary for search engines (120–160 chars recommended)..."
              rows={3}
              className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-700 resize-none focus:outline-none focus:border-emerald-500/40 transition-colors"
            />
          </div>

          {/* Canonical URL */}
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5">
              <Link size={11} /> Canonical URL
            </label>
            <input
              type="url"
              value={canonicalUrl}
              onChange={(e) => onChange('canonicalUrl', e.target.value)}
              placeholder="https://yourblog.com/original-post"
              className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/40 transition-colors"
            />
          </div>

          {/* OG Image */}
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 flex items-center gap-1.5">
              <ImageIcon size={11} /> OG / Social Image URL
            </label>
            <input
              type="url"
              value={seoImageUrl}
              onChange={(e) => onChange('seoImageUrl', e.target.value)}
              placeholder="https://example.com/og-image.png"
              className="w-full bg-white/3 border border-white/8 rounded-lg px-3 py-2 text-xs text-zinc-300 placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/40 transition-colors"
            />
            <p className="text-xs text-zinc-700 mt-1">Used for Twitter Cards and Open Graph previews (1200×630 recommended)</p>
          </div>
        </div>
      )}
    </div>
  );
}
