'use client';
import { useState } from 'react';
import { X, FileText, BookOpen, Megaphone, Lightbulb } from 'lucide-react';

const TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Post',
    description: 'Start with a clean slate.',
    icon: FileText,
    color: 'from-zinc-700 to-zinc-800',
    blocks: [],
  },
  {
    id: 'tutorial',
    name: 'Tutorial / How-To',
    description: 'Step-by-step guide with introduction, prerequisites, and numbered steps.',
    icon: BookOpen,
    color: 'from-emerald-900/60 to-emerald-950/60',
    blocks: [
      { type: 'heading', content: [{ type: 'text', text: 'Introduction', styles: {} }], props: { level: 2 } },
      { type: 'paragraph', content: [{ type: 'text', text: 'Briefly explain what this tutorial covers and who it is for.', styles: { italic: true } }] },
      { type: 'heading', content: [{ type: 'text', text: 'Prerequisites', styles: {} }], props: { level: 2 } },
      { type: 'bulletListItem', content: [{ type: 'text', text: 'Requirement one', styles: {} }] },
      { type: 'bulletListItem', content: [{ type: 'text', text: 'Requirement two', styles: {} }] },
      { type: 'heading', content: [{ type: 'text', text: 'Step 1: Getting Started', styles: {} }], props: { level: 2 } },
      { type: 'paragraph', content: [{ type: 'text', text: 'Describe the first step here.', styles: {} }] },
      { type: 'heading', content: [{ type: 'text', text: 'Step 2: ...', styles: {} }], props: { level: 2 } },
      { type: 'paragraph', content: [{ type: 'text', text: 'Continue your steps...', styles: {} }] },
      { type: 'heading', content: [{ type: 'text', text: 'Conclusion', styles: {} }], props: { level: 2 } },
      { type: 'paragraph', content: [{ type: 'text', text: 'Wrap up with a summary and next steps.', styles: {} }] },
    ],
  },
  {
    id: 'opinion',
    name: 'Opinion / Essay',
    description: 'Share your perspective with a strong thesis and supporting arguments.',
    icon: Lightbulb,
    color: 'from-violet-900/60 to-violet-950/60',
    blocks: [
      { type: 'heading', content: [{ type: 'text', text: 'My Take On...', styles: {} }], props: { level: 2 } },
      { type: 'paragraph', content: [{ type: 'text', text: 'State your main argument or thesis here.', styles: { italic: true } }] },
      { type: 'heading', content: [{ type: 'text', text: 'Background', styles: {} }], props: { level: 2 } },
      { type: 'paragraph', content: [{ type: 'text', text: 'Give context or background on the topic.', styles: {} }] },
      { type: 'heading', content: [{ type: 'text', text: 'The Case For...', styles: {} }], props: { level: 2 } },
      { type: 'paragraph', content: [{ type: 'text', text: 'Present your first supporting argument.', styles: {} }] },
      { type: 'heading', content: [{ type: 'text', text: 'Addressing the Counter-argument', styles: {} }], props: { level: 2 } },
      { type: 'paragraph', content: [{ type: 'text', text: 'Acknowledge the opposing view and explain why your position is stronger.', styles: {} }] },
      { type: 'heading', content: [{ type: 'text', text: 'Conclusion', styles: {} }], props: { level: 2 } },
      { type: 'paragraph', content: [{ type: 'text', text: 'Restate your thesis and call the reader to action.', styles: {} }] },
    ],
  },
  {
    id: 'announcement',
    name: 'Announcement',
    description: 'Announce a new product, feature, or project launch.',
    icon: Megaphone,
    color: 'from-sky-900/60 to-sky-950/60',
    blocks: [
      { type: 'paragraph', content: [{ type: 'text', text: "Today we're excited to announce...", styles: { bold: true } }] },
      { type: 'heading', content: [{ type: 'text', text: 'What Is It?', styles: {} }], props: { level: 2 } },
      { type: 'paragraph', content: [{ type: 'text', text: 'Describe the announcement in one or two sentences.', styles: {} }] },
      { type: 'heading', content: [{ type: 'text', text: 'Key Features', styles: {} }], props: { level: 2 } },
      { type: 'bulletListItem', content: [{ type: 'text', text: 'Feature one', styles: {} }] },
      { type: 'bulletListItem', content: [{ type: 'text', text: 'Feature two', styles: {} }] },
      { type: 'bulletListItem', content: [{ type: 'text', text: 'Feature three', styles: {} }] },
      { type: 'heading', content: [{ type: 'text', text: 'How to Get Started', styles: {} }], props: { level: 2 } },
      { type: 'paragraph', content: [{ type: 'text', text: 'Provide links or instructions for getting started.', styles: {} }] },
    ],
  },
];

interface TemplatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (templateBlocks: object[]) => void;
}

export function TemplatePickerModal({ isOpen, onClose, onSelect }: TemplatePickerModalProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl mx-4 bg-[#111111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <div>
            <h2 className="text-lg font-semibold text-white">Start a new post</h2>
            <p className="text-sm text-zinc-500 mt-0.5">Choose a template or start from scratch</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/8 text-zinc-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-6 grid grid-cols-2 gap-3">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            const isHovered = hovered === t.id;
            return (
              <button
                key={t.id}
                onMouseEnter={() => setHovered(t.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => { onSelect(t.blocks); onClose(); }}
                className={`relative group text-left p-4 rounded-xl border transition-all duration-200 ${
                  isHovered
                    ? 'border-emerald-500/40 bg-gradient-to-br ' + t.color + ' scale-[1.02] shadow-lg shadow-black/40'
                    : 'border-white/8 bg-white/3 hover:border-white/15'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-gradient-to-br ${t.color} border border-white/10`}>
                  <Icon size={18} className={isHovered ? 'text-white' : 'text-zinc-400'} />
                </div>
                <div className="font-medium text-sm text-white mb-1">{t.name}</div>
                <div className="text-xs text-zinc-500 leading-relaxed">{t.description}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { TEMPLATES };
