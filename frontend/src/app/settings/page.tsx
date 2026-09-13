'use client';

import { useState, useEffect } from 'react';
import { credentialsApi } from '@/lib/api';
import { auth } from '@/lib/auth';
import {
  Globe, FileText, Twitter, Linkedin, BookOpen,
  CheckCircle, Trash2, Key, Loader2, Eye, EyeOff, Plug, Zap, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { CredentialStatusResponse, SaveCredentialRequest } from '@/types';

const PLATFORMS = [
  {
    id: 'devto',
    name: 'Dev.to',
    description: 'Developer articles and tutorials',
    icon: Globe,
    fields: [{ key: 'apiKey' as keyof SaveCredentialRequest, label: 'API Key', help: 'Settings → Extensions → DEV Community API Keys' }],
  },
  {
    id: 'hashnode',
    name: 'Hashnode',
    description: 'Publish to your Hashnode blog',
    icon: FileText,
    fields: [{ key: 'accessToken' as keyof SaveCredentialRequest, label: 'Personal Access Token', help: 'Account Settings → Developer → Access Tokens' }],
  },
  {
    id: 'medium',
    name: 'Medium',
    description: 'Stories and articles',
    icon: BookOpen,
    fields: [{ key: 'accessToken' as keyof SaveCredentialRequest, label: 'Integration Token', help: 'Settings → Security and apps → Integration tokens' }],
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    description: 'Post threads to your X account',
    icon: Twitter,
    fields: [
      { key: 'apiKey' as keyof SaveCredentialRequest, label: 'API Key', help: 'developer.twitter.com → Keys and Tokens' },
      { key: 'accessToken' as keyof SaveCredentialRequest, label: 'Access Token', help: 'developer.twitter.com → Keys and Tokens' },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Professional posts and articles',
    icon: Linkedin,
    fields: [{ key: 'accessToken' as keyof SaveCredentialRequest, label: 'Access Token', help: 'developers.linkedin.com → Your App → Auth → OAuth2' }],
  },
];

export default function SettingsPage() {
  const [statuses, setStatuses] = useState<Record<string, CredentialStatusResponse>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, Record<string, string>>>({});
  const [showFields, setShowFields] = useState<Record<string, boolean>>({});
  const user = auth.getUser();

  useEffect(() => {
    if (!auth.isAuthenticated()) { window.location.href = '/login'; return; }
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      const res = await credentialsApi.getAll();
      const map: Record<string, CredentialStatusResponse> = {};
      res.data.forEach(s => { map[s.platform] = s; });
      setStatuses(map);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const handleSave = async (platformId: string) => {
    const values = fieldValues[platformId] || {};
    setSaving(platformId);
    try {
      const req: SaveCredentialRequest = {
        apiKey: values.apiKey,
        accessToken: values.accessToken,
        refreshToken: values.refreshToken,
      };
      const res = await credentialsApi.save(platformId, req);
      setStatuses(prev => ({ ...prev, [platformId]: res.data }));
      setFieldValues(prev => ({ ...prev, [platformId]: {} }));
      setExpanded(null);
    } catch {
      alert('Failed to save credentials. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (platformId: string) => {
    if (!confirm(`Disconnect ${platformId}? Your stored credentials will be deleted.`)) return;
    setDeleting(platformId);
    try {
      await credentialsApi.delete(platformId);
      setStatuses(prev => { const next = { ...prev }; delete next[platformId]; return next; });
    } finally { setDeleting(null); }
  };

  const connectedCount = Object.values(statuses).filter(s => s.connected).length;

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f] overflow-hidden">
      {/* Header */}
      <header className="h-11 flex items-center px-5 shrink-0" style={{ borderBottom: '1px solid #1f1f1f' }}>
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-indigo-500 rounded flex items-center justify-center">
            <Zap size={11} className="text-white" />
          </div>
          <span className="text-[13px] font-semibold text-[#f2f2f2]">Echo</span>
        </div>

        <Separator orientation="vertical" className="mx-4 h-4" />

        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-[12px] text-[#71717a] hover:text-[#d4d4d4] transition-colors"
        >
          <ArrowLeft size={12} /> Dashboard
        </Link>

        <div className="flex-1" />

        {user && (
          <div className="flex items-center gap-2">
            <div suppressHydrationWarning className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-semibold">
              {user.name?.[0]?.toUpperCase() ?? '?'}
            </div>
            <span suppressHydrationWarning className="text-[12px] text-[#a1a1aa]">{user.name}</span>
          </div>
        )}
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-6 py-8">
          {/* Page heading */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-[16px] font-semibold text-[#f2f2f2]">Connected Platforms</h1>
              <span className="text-[12px] text-[#52525b]">{connectedCount} of {PLATFORMS.length} connected</span>
            </div>
            <p className="text-[12px] text-[#71717a] mt-1">
              Connect once. Credentials are encrypted and stored in your private database.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={20} className="animate-spin text-[#52525b]" />
            </div>
          ) : (
            <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
              {PLATFORMS.map((platform, idx) => {
                const isConnected = statuses[platform.id]?.connected;
                const isExpanded = expanded === platform.id;
                const Icon = platform.icon;

                return (
                  <div key={platform.id}>
                    {/* Platform row */}
                    <div className={`flex items-center gap-4 px-4 py-3.5 ${idx < PLATFORMS.length - 1 || isExpanded ? 'border-b border-[#1f1f1f]' : ''}`}>
                      {/* Icon */}
                      <div className="w-8 h-8 rounded bg-[#1f1f1f] flex items-center justify-center shrink-0">
                        <Icon size={15} className={isConnected ? 'text-indigo-400' : 'text-[#71717a]'} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-[#f2f2f2]">{platform.name}</span>
                          {isConnected && (
                            <Badge variant="published">
                              <CheckCircle size={9} className="mr-0.5" /> Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-[#52525b] mt-0.5">{platform.description}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {isConnected ? (
                          <>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => setExpanded(isExpanded ? null : platform.id)}
                              title="Update credentials"
                            >
                              <Key size={13} />
                            </Button>
                            <Button
                              variant="ghost" size="icon"
                              onClick={() => handleDelete(platform.id)}
                              disabled={deleting === platform.id}
                              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            >
                              {deleting === platform.id
                                ? <Loader2 size={13} className="animate-spin" />
                                : <Trash2 size={13} />}
                            </Button>
                          </>
                        ) : (
                          <Button
                            variant="outline" size="sm"
                            onClick={() => setExpanded(isExpanded ? null : platform.id)}
                          >
                            <Plug size={12} /> Connect
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expandable credential form */}
                    {isExpanded && (
                      <div className={`px-4 pt-4 pb-5 bg-[#111111] space-y-4 ${idx < PLATFORMS.length - 1 ? 'border-b border-[#1f1f1f]' : ''}`}>
                        <p className="label-xs">
                          {isConnected ? 'Update Credentials' : 'Enter Credentials'}
                        </p>

                        {platform.fields.map(field => (
                          <div key={field.key}>
                            <label className="text-[11px] text-[#71717a] mb-1.5 flex items-center gap-1.5 font-medium">
                              <Key size={10} /> {field.label}
                            </label>
                            <div className="relative">
                              <input
                                type={showFields[`${platform.id}-${field.key}`] ? 'text' : 'password'}
                                value={fieldValues[platform.id]?.[field.key] || ''}
                                onChange={e => setFieldValues(prev => ({
                                  ...prev,
                                  [platform.id]: { ...prev[platform.id], [field.key]: e.target.value }
                                }))}
                                placeholder={`Paste your ${field.label.toLowerCase()}...`}
                                className="w-full px-3 py-2 pr-9 bg-[#1a1a1a] border border-[#252525] rounded-md text-[12px] text-[#d4d4d4] placeholder-[#52525b] focus:outline-none focus:border-indigo-500 font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => setShowFields(prev => ({
                                  ...prev, [`${platform.id}-${field.key}`]: !prev[`${platform.id}-${field.key}`]
                                }))}
                                className="absolute right-2.5 top-2 text-[#52525b] hover:text-[#a1a1aa] transition-colors"
                              >
                                {showFields[`${platform.id}-${field.key}`] ? <EyeOff size={13} /> : <Eye size={13} />}
                              </button>
                            </div>
                            <p className="text-[10px] text-[#52525b] mt-1">→ {field.help}</p>
                          </div>
                        ))}

                        <div className="flex justify-end gap-2 pt-1">
                          <Button variant="ghost" size="sm" onClick={() => setExpanded(null)}>Cancel</Button>
                          <Button
                            size="sm"
                            onClick={() => handleSave(platform.id)}
                            disabled={saving === platform.id}
                          >
                            {saving === platform.id
                              ? <Loader2 size={12} className="animate-spin" />
                              : <CheckCircle size={12} />}
                            {isConnected ? 'Update' : 'Save & Connect'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
