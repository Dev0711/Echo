'use client';

import { useState } from 'react';
import type { PreviewResponse, FormattedContentResponse } from '@/types';
import { Twitter, Linkedin, Globe, FileText, CheckCircle, XCircle, AlertCircle, Loader2, Copy, Eye } from 'lucide-react';

interface PreviewPanelProps {
  previews: PreviewResponse['previews'];
}

const platformIcons: Record<string, React.ComponentType<{ size?: number }>> = {
  devto: Globe,
  hashnode: FileText,
  twitter: Twitter,
  linkedin: Linkedin,
  medium: Globe,
};

const platformNames: Record<string, string> = {
  devto: 'Dev.to',
  hashnode: 'Hashnode',
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
  medium: 'Medium',
};

export function PreviewPanel({ previews }: PreviewPanelProps) {
  const [activeTab, setActiveTab] = useState<string>('devto');
  const [copied, setCopied] = useState<string | null>(null);

  const tabs = Object.keys(previews);
  
  if (tabs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        No previews available. Save your post first.
      </div>
    );
  }

  const getContent = (preview: FormattedContentResponse) => {
    if (preview.type === 'SINGLE_BODY') {
      return preview.body || '';
    } else if (preview.type === 'CHUNKED') {
      return preview.chunks?.join('\n\n---\n\n') || '';
    }
    return 'Preview not available';
  };

  const copyToClipboard = (content: string, platform: string) => {
    navigator.clipboard.writeText(content);
    setCopied(platform);
    setTimeout(() => setCopied(null), 2000);
  };

  const activePreview = previews[activeTab];

  return (
    <div className="flex flex-col h-full border rounded-lg bg-white dark:bg-gray-900">
      {/* Tab bar */}
      <div className="flex border-b bg-gray-50 dark:bg-gray-800 overflow-x-auto">
        {tabs.map((platform) => {
          const Icon = platformIcons[platform] || Globe;
          const preview = previews[platform];
          
          let statusIcon = null;
          if (preview?.type === 'SINGLE_BODY' && preview.body) {
            statusIcon = <CheckCircle size={14} className="text-green-500" />;
          } else if (preview?.type === 'CHUNKED' && preview.chunks?.length) {
            statusIcon = <CheckCircle size={14} className="text-green-500" />;
          }
          
          return (
            <button
              key={platform}
              onClick={() => setActiveTab(platform)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === platform
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={16} />
              <span>{platformNames[platform] || platform}</span>
              {statusIcon}
            </button>
          );
        })}
      </div>
      
      {/* Preview content */}
      <div className="flex-1 overflow-auto p-4">
        {activePreview ? (
          <div className="prose dark:prose-invert max-w-none">
            {activePreview.type === 'SINGLE_BODY' && activePreview.body && (
              <div className="space-y-4">
                {activePreview.title && (
                  <h1 className="text-2xl font-bold mb-4">{activePreview.title}</h1>
                )}
                <div 
                  className="markdown-body"
                  dangerouslySetInnerHTML={{ __html: activePreview.body }}
                />
                {activePreview.tags && activePreview.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {activePreview.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activePreview.type === 'CHUNKED' && activePreview.chunks && (
              <div className="space-y-4">
                {activePreview.chunks.map((chunk, index) => (
                  <div 
                    key={index} 
                    className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 relative group"
                  >
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      Tweet {index + 1} of {activePreview.chunks.length}
                    </div>
                    <pre className="whitespace-pre-wrap text-sm font-sans">{chunk}</pre>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => copyToClipboard(chunk, `twitter-${index}`)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        title="Copy tweet"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {activePreview.type === 'UNKNOWN' && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                Preview not available for this platform
              </div>
            )}
          </div>
        ) : (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Select a platform to preview
          </div>
        )}
      </div>
      
      {/* Copy button for single body content */}
      {activePreview?.type === 'SINGLE_BODY' && activePreview.body && (
        <div className="flex justify-end p-3 border-t bg-gray-50 dark:bg-gray-800">
          <button
            onClick={() => copyToClipboard(activePreview.body || '', activeTab)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Copy size={16} />
            {copied === activeTab ? 'Copied!' : 'Copy Content'}
          </button>
        </div>
      )}
    </div>
  );
}