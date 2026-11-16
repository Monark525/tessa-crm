'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface ImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}

export default function ImporterModal({ isOpen, onClose, onImportSuccess }: ImporterModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccess(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // Basic text parsing example (or connect to your specific CSV parsing endpoint/API)
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length <= 1) {
        throw new Error('CSV file appears to be empty or missing data rows.');
      }

      // Indicate success
      setSuccess(`Successfully processed ${lines.length - 1} records!`);
      setFile(null);
      if (onImportSuccess) onImportSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to upload CSV.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg text-white shadow-2xl p-6 relative">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">Import CSV Data</h2>
            <p className="text-xs text-slate-400">Upload surplus funds, leads, or property records.</p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg px-2 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Status Banners */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm rounded-xl">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm rounded-xl">
            {success}
          </div>
        )}

        {/* Drag & Drop Upload Zone */}
        <div className="border-2 border-dashed border-slate-700 hover:border-blue-500 bg-slate-950/50 rounded-2xl p-8 text-center transition cursor-pointer relative group">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="text-3xl mb-2">📥</div>
          <p className="text-sm font-medium text-slate-200">
            {file ? file.name : 'Click or drag CSV file here to upload'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Supports standard CSV formatted lead lists</p>
        </div>

        {/* Action Controls */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-lg transition"
          >
            {uploading ? 'Processing...' : 'Upload & Import'}
          </button>
        </div>

      </div>
    </div>
  );
}