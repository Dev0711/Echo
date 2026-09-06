'use client';

import { useState, useEffect } from 'react';
import { credentialsApi } from '@/lib/api';
import { auth } from '@/lib/auth';
import { Zap, ArrowLeft, Globe, FileText, Twitter, Linkedin, CheckCircle, Plug, Trash2, Key, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import type { CredentialStatusResponse, SaveCredentialRequest } from '@/types';

const PLATFORMS = [
  {
    id: 'devto',
    name: 'Dev.to',
    description: 'Publish developer articles and tutorials',
    icon: Globe,
    color: 'text-white',
    bg: 'from-gray-800 to-black',
    fields: [{ key: 'apiKey' as keyof SaveCredentialRequest, label: 'API Key', help: 'Settings → Extensions → DEV Community API Keys' }],
  },
  {
    id: 'hashnode',
    name: 'Hashnode',
    description: 'Publish to your Hashnode blog',
    icon: FileText,
    color: 'text-blue-400',
    bg: 'from-blue-900 to-blue-950',
    fields: [{ key: 'accessToken' as keyof SaveCredentialRequest, label: 'Personal Access Token', help: 'hashnode.com → Account Settings → Developer → Access Tokens' }],
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    description: 'Post threads to your X account',
    icon: Twitter,
    color: 'text-sky-400',
    bg: 'from-sky-950 to-slate-950',
    fields: [
      { key: 'apiKey' as keyof SaveCredentialRequest, label: 'API Key', help: 'developer.twitter.com → Your App → Keys and Tokens' },
      { key: 'accessToken' as keyof SaveCredentialRequest, label: 'Access Token', help: 'developer.twitter.com → Your App → Keys and Tokens' },
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Publish professional posts',
    icon: Linkedin,
    color: 'text-blue-500',
    bg: 'from-blue-950 to-indigo-950',
    fields: [{ key: 'accessToken' as keyof SaveCredentialRequest, label: 'Access Token', help: 'linkedin.com/developers → Your App → Auth → OAuth2 Token' }],
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
    } catch (e) {
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
      setStatuses(prev => {
        const next = { ...prev };
        delete next[platformId];
        return next;
      });
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 h-16 flex items-center gap-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap size={16} className="text-white" />
          </div>
          <Link href="/dashboard"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to Dashboard
          </Link>
          <div className="flex-1" />
          {user && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-indigo-400 to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                {user.name?.[0]?.toUpperCase()}
              </div>
              {user.name}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white mb-2">Connected Accounts</h1>
          <p className="text-gray-400">
            Connect your publishing platforms once. Your credentials are stored encrypted in your personal database and never shared.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-400" size={32} />
          </div>
        ) : (
          <div className="space-y-4">
            {PLATFORMS.map(platform => {
              const isConnected = statuses[platform.id]?.connected;
              const isExpanded = expanded === platform.id;
              const Icon = platform.icon;

              return (
                <div key={platform.id}
                  className={`rounded-2xl border overflow-hidden transition-all ${
                    isConnected ? 'border-emerald-500/20 bg-emerald-500/3' : 'border-white/8 bg-white/2'
                  }`}
                >
                  {/* Platform row */}
                  <div className="flex items-center gap-4 p-5">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${platform.bg} border border-white/10 flex items-center justify-center shrink-0`}>
                      <Icon size={22} className={platform.color} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-white">{platform.name}</h3>
                        {isConnected && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            <CheckCircle size={9} /> Connected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{platform.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isConnected ? (
                        <>
                          <button
                            onClick={() => setExpanded(isExpanded ? null : platform.id)}
                            className="px-3 py-2 text-xs font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-all"
                          >
                            <Key size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(platform.id)}
                            disabled={deleting === platform.id}
                            className="px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 rounded-lg transition-all"
                          >
                            {deleting === platform.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setExpanded(isExpanded ? null : platform.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white text-sm font-medium rounded-lg transition-all active:scale-95"
                        >
                          <Plug size={13} /> Connect
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expandable credential form */}
                  {isExpanded && (
                    <div className="border-t border-white/8 px-5 pt-4 pb-5 space-y-4 bg-black/20">
                      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
                        {isConnected ? 'Update Credentials' : 'Enter Credentials'}
                      </p>

                      {platform.fields.map(field => (
                        <div key={field.key}>
                          <label className="text-xs font-medium text-gray-400 mb-1.5 flex items-center gap-1.5">
                            <Key size={11} /> {field.label}
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
                              className="w-full px-4 py-3 pr-10 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowFields(prev => ({ ...prev, [`${platform.id}-${field.key}`]: !prev[`${platform.id}-${field.key}`] }))}
                              className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
                            >
                              {showFields[`${platform.id}-${field.key}`] ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-1.5">📍 {field.help}</p>
                        </div>
                      ))}

                      <div className="flex justify-end gap-3 pt-2">
                        <button onClick={() => setExpanded(null)}
                          className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                          Cancel
                        </button>
                        <button
                          onClick={() => handleSave(platform.id)}
                          disabled={saving === platform.id}
                          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-50"
                        >
                          {saving === platform.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                          {isConnected ? 'Update' : 'Save & Connect'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
