'use client';

import { useState } from 'react';
import type { PreviewResponse, FormattedContentResponse } from '@/types';
import { Twitter, Linkedin, Globe, FileText, CheckCircle, Copy, User } from 'lucide-react';

interface PreviewPanelProps {
  previews: PreviewResponse['previews'];
}

const platformIcons: Record<string, React.ComponentType<{ size?: number, className?: string }>> = {
  devto: Globe as React.ComponentType<{ size?: number, className?: string }>,
  hashnode: FileText as React.ComponentType<{ size?: number, className?: string }>,
  twitter: Twitter as React.ComponentType<{ size?: number, className?: string }>,
  linkedin: Linkedin as React.ComponentType<{ size?: number, className?: string }>,
};

const platformNames: Record<string, string> = {
  devto: 'Dev.to',
  hashnode: 'Hashnode',
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
};

export function PreviewPanel({ previews }: PreviewPanelProps) {
  const tabs = Object.keys(previews);
  const [activeTab, setActiveTab] = useState<string>(tabs.length > 0 ? tabs[0] : 'devto');
  const [copied, setCopied] = useState<string | null>(null);

  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full glass-panel rounded-2xl text-gray-500 dark:text-gray-400">
        <div className="flex flex-col items-center gap-4 opacity-50">
          <Globe size={48} />
          <p>Hit "Preview" to see how your post will look across platforms.</p>
        </div>
      </div>
    );
  }

  const copyToClipboard = (content: string, platform: string) => {
    navigator.clipboard.writeText(content);
    setCopied(platform);
    setTimeout(() => setCopied(null), 2000);
  };

  const activePreview = previews[activeTab];

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden shadow-2xl">
      {/* Premium Tab Bar */}
      <div className="flex px-2 pt-2 gap-1 border-b border-white/10 bg-black/20 overflow-x-auto scrollbar-hide">
        {tabs.map((platform) => {
          const Icon = platformIcons[platform] || Globe;
          const isActive = activeTab === platform;
          
          return (
            <button
              key={platform}
              onClick={() => setActiveTab(platform)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-t-xl transition-all ${
                isActive
                  ? 'bg-white/10 text-white shadow-sm border-t border-x border-white/10'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Icon size={16} className={isActive ? "text-indigo-400" : ""} />
              <span>{platformNames[platform] || platform}</span>
              {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-t-full shadow-[0_-2px_10px_rgba(99,102,241,0.5)]" />}
            </button>
          );
        })}
      </div>
      
      {/* Platform-Specific Preview Area */}
      <div className="flex-1 overflow-auto p-6 bg-black/40">
        {activePreview ? (
          <div className="mx-auto max-w-2xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* TWITTER PREVIEW */}
            {activeTab === 'twitter' && activePreview.type === 'CHUNKED' && (
              <div className="space-y-4">
                {activePreview.chunks?.map((chunk, index) => (
                  <div key={index} className="bg-white dark:bg-[#16181C] border border-gray-200 dark:border-[#2F3336] rounded-2xl p-4 shadow-sm relative group hover:bg-gray-50 dark:hover:bg-[#1C1F23] transition-colors">
                    <div className="flex gap-3">
                      <div className="w-12 h-12 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shrink-0">
                        <User className="text-white" size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="font-bold text-gray-900 dark:text-white truncate">You</span>
                          <span className="text-gray-500 dark:text-[#71767B]">@yourhandle</span>
                          <span className="text-gray-500 dark:text-[#71767B]">·</span>
                          <span className="text-gray-500 dark:text-[#71767B]">Just now</span>
                        </div>
                        <p className="whitespace-pre-wrap text-gray-900 dark:text-white text-[15px] leading-normal font-sans">
                          {chunk}
                        </p>
                      </div>
                    </div>
                    {/* Thread connector line */}
                    {index < (activePreview.chunks!.length - 1) && (
                      <div className="absolute left-[39px] top-[64px] bottom-[-20px] w-0.5 bg-gray-200 dark:bg-[#2F3336]" />
                    )}
                    <button
                      onClick={() => copyToClipboard(chunk, `twitter-${index}`)}
                      className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <Copy size={14} className="text-gray-600 dark:text-gray-300" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* LINKEDIN PREVIEW */}
            {activeTab === 'linkedin' && activePreview.type === 'SINGLE_BODY' && (
              <div className="bg-white dark:bg-[#1D2226] border border-gray-200 dark:border-gray-700/50 rounded-xl shadow-sm overflow-hidden group">
                <div className="flex gap-3 p-4">
                  <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shrink-0">
                    <User className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Your Name</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Content Creator • Software Engineer</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs flex items-center gap-1">Just now • 🌐</p>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <p className="whitespace-pre-wrap text-gray-900 dark:text-white text-sm font-sans leading-relaxed">
                    {activePreview.body}
                  </p>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700/50 px-4 py-2 bg-gray-50 dark:bg-[#1D2226]">
                   <span className="text-xs text-gray-500 font-medium">👍 1,234 • 💬 89 comments</span>
                </div>
              </div>
            )}

            {/* DEV.TO / HASHNODE PREVIEW */}
            {(activeTab === 'devto' || activeTab === 'hashnode') && activePreview.type === 'SINGLE_BODY' && (
              <div className="bg-white dark:bg-black border border-gray-200 dark:border-white/10 rounded-xl p-8 shadow-sm">
                {activePreview.title && (
                  <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-6 leading-tight">{activePreview.title}</h1>
                )}
                {activePreview.tags && activePreview.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-8">
                    {activePreview.tags.map((tag) => (
                      <span key={tag} className="px-2.5 py-1 text-sm font-medium bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div 
                  className="prose prose-lg dark:prose-invert max-w-none font-serif"
                  dangerouslySetInnerHTML={{ __html: activePreview.body || '' }}
                />
              </div>
            )}

          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Preview format not supported
          </div>
        )}
      </div>
      
      {/* Copy button footer */}
      {activePreview?.type === 'SINGLE_BODY' && activePreview.body && (
        <div className="flex justify-end p-4 border-t border-white/10 bg-black/20 backdrop-blur-md">
          <button
            onClick={() => copyToClipboard(activePreview.body || '', activeTab)}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-95"
          >
            {copied === activeTab ? <CheckCircle size={16} /> : <Copy size={16} />}
            {copied === activeTab ? 'Copied to Clipboard!' : 'Copy Raw Content'}
          </button>
        </div>
      )}
    </div>
  );
}