import React, { useState, useRef } from "react";
import { uploadDocument, resetDocument, UploadResponse } from "../api";
import {
  X,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Loader2,
  FileUp,
} from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (res: UploadResponse) => void;
  onResetSuccess: () => void;
}

const FILE_ACCEPT = ".pdf,.docx,.doc,.txt,.md,.csv,.json,.log";

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
  onResetSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) { setFile(f); setError(""); }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setError(""); }
  };

  const handleUpload = async () => {
    if (!file) { setError("Please select a file first."); return; }
    setUploading(true);
    setError("");
    try {
      const res = await uploadDocument(file);
      onUploadSuccess(res);
      onClose();
    } catch (err: any) {
      setError(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setError("");
    try {
      await resetDocument();
      onResetSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Reset failed.");
    } finally {
      setResetting(false);
    }
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024
      ? `${(bytes / 1024).toFixed(1)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg bg-navy-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col z-10 animate-fade-in overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-navy-950/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-campus-500/10 border border-campus-500/30 flex items-center justify-center">
              <FileUp className="w-4.5 h-4.5 text-campus-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Upload Document</h2>
              <p className="text-[11px] text-slate-400">
                PDF, DOCX, TXT, MD, CSV, JSON — up to 25 MB
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center space-y-2 transition-colors ${
              dragOver
                ? "border-campus-400 bg-campus-500/10"
                : "border-slate-700 hover:border-campus-500/50 bg-slate-900/40"
            }`}
          >
            <Upload className="w-8 h-8 text-slate-500" />
            <p className="text-sm text-slate-300 font-medium">
              Drag & drop a file here, or click to browse
            </p>
            <p className="text-[11px] text-slate-500">
              Supports PDF, DOCX, TXT, Markdown, CSV, JSON
            </p>
            <input
              ref={fileRef}
              type="file"
              accept={FILE_ACCEPT}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Selected file info */}
          {file && (
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="w-8 h-8 rounded-lg bg-campus-500/10 border border-campus-500/30 flex items-center justify-center flex-shrink-0">
                <FileText className="w-4 h-4 text-campus-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
                <p className="text-[11px] text-slate-500">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                className="text-slate-500 hover:text-rose-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center space-x-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-navy-950/60 flex items-center justify-between">
          {/* Reset to campus guidelines */}
          <button
            onClick={handleReset}
            disabled={resetting || uploading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50"
          >
            {resetting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{resetting ? "Resetting…" : "Reset to Campus Guidelines"}</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              disabled={uploading}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading || !file}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-campus-500 hover:bg-campus-400 text-white text-xs font-semibold transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              <span>{uploading ? "Uploading…" : "Upload & Index"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
