'use client';
import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface CoverImageUploadProps {
  coverImageUrl?: string | null;
  postId: string;
  onChange: (url: string | null) => void;
}

export function CoverImageUpload({ coverImageUrl, onChange }: CoverImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const sigRes = await fetch('http://localhost:8080/api/media/signature', {
        headers: { Authorization: `Bearer ${localStorage.getItem('echo_token')}` },
      });
      const sigData = await sigRes.json();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', sigData.apiKey);
      formData.append('timestamp', sigData.timestamp.toString());
      formData.append('signature', sigData.signature);
      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );
      const uploadData = await uploadRes.json();
      if (uploadData.secure_url) {
        onChange(uploadData.secure_url);
      } else {
        setError('Upload failed. Try again.');
      }
    } catch {
      setError('Upload failed. Check your connection.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="px-8 pb-2">
      {coverImageUrl ? (
        <div className="relative group rounded-xl overflow-hidden h-48 mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs rounded-lg backdrop-blur-sm transition-colors flex items-center gap-1.5"
            >
              <Upload size={12} /> Change
            </button>
            <button
              onClick={() => onChange(null)}
              className="px-3 py-1.5 bg-red-500/70 hover:bg-red-500 text-white text-xs rounded-lg backdrop-blur-sm transition-colors flex items-center gap-1.5"
            >
              <X size={12} /> Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="group border border-dashed border-white/10 hover:border-emerald-500/40 rounded-xl h-20 flex items-center justify-center gap-2 cursor-pointer transition-all hover:bg-emerald-500/5 mb-1"
        >
          {isUploading ? (
            <Loader2 size={16} className="animate-spin text-emerald-400" />
          ) : (
            <>
              <ImageIcon size={16} className="text-zinc-600 group-hover:text-emerald-400 transition-colors" />
              <span className="text-xs text-zinc-600 group-hover:text-zinc-400 transition-colors">
                Add cover image — drag & drop or click
              </span>
            </>
          )}
        </div>
      )}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
      />
    </div>
  );
}
