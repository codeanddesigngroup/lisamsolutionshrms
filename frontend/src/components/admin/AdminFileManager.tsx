"use client";

import { useRef, useState } from "react";
import {
  Download,
  Eye,
  FileText,
  Paperclip,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";

export interface ManagedFile {
  id?: number | string;
  filename?: string;
  name?: string;
  file_url?: string;
  url?: string;
  external_link?: string | null;
  size?: number | string;
  created_at?: string;
  uploaded_by?: string;
  user?: {
    name?: string;
  };
}

interface AdminFileManagerProps {
  title?: string;
  description?: string;
  files?: ManagedFile[];
  emptyText?: string;
  uploadLabel?: string;
  accept?: string;
  multiple?: boolean;
  allowUpload?: boolean;
  onFilesChange?: (files: ManagedFile[]) => void;
}

const formatSize = (size?: number | string) => {
  if (!size) return "Size not available";
  if (typeof size === "string") return size;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileName = (file: ManagedFile) => file.filename || file.name || "Untitled file";

const getFileUrl = (file: ManagedFile) => file.file_url || file.url || file.external_link || "";

const getFileKey = (file: ManagedFile, index: number) => file.id || `${getFileName(file)}-${index}`;

export default function AdminFileManager({
  title = "Files",
  description = "Upload, preview, download, and remove related files.",
  files = [],
  emptyText = "No files uploaded yet.",
  uploadLabel = "Upload Files",
  accept = "*",
  multiple = true,
  allowUpload = true,
  onFilesChange,
}: AdminFileManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ManagedFile[]>(files);

  const updateItems = (nextItems: ManagedFile[]) => {
    setItems(nextItems);
    onFilesChange?.(nextItems);
  };

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles?.length) return;

    const uploadedFiles = Array.from(selectedFiles).map((file, index) => ({
      id: `local-${Date.now()}-${index}`,
      filename: file.name,
      size: file.size,
      created_at: new Date().toISOString(),
      uploaded_by: "Current user",
    }));

    updateItems([...uploadedFiles, ...items]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const deleteFile = (fileId: number | string) => {
    updateItems(items.filter((file, index) => getFileKey(file, index) !== fileId));
  };

  return (
    <div className="rounded-2xl border border-gray-50 bg-white p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">{title}</h3>
          <p className="mt-1 max-w-xl text-xs font-medium leading-relaxed text-gray-400">{description}</p>
        </div>
        {allowUpload && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
          >
            <Upload className="h-4 w-4" />
            <span>{uploadLabel}</span>
          </button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(event) => handleFiles(event.target.files)}
          className="hidden"
        />
      </div>

      {allowUpload && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mb-5 flex min-h-28 w-full flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <Plus className="mb-2 h-5 w-5 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Dropzone Ready</span>
          <span className="mt-1 text-xs font-medium text-gray-400">Select files for upload. API wiring can persist these records.</span>
        </button>
      )}

      <div className="space-y-3">
        {items.map((file, index) => {
          const fileUrl = getFileUrl(file);
          const fileKey = getFileKey(file, index);
          return (
            <div
              key={fileKey}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-50 bg-gray-50/60 px-4 py-3 transition-colors hover:bg-white hover:shadow-sm"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-gray-800">{getFileName(file)}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span>{formatSize(file.size)}</span>
                    <span className="text-gray-200">/</span>
                    <span>{file.user?.name || file.uploaded_by || "System"}</span>
                    {file.created_at && (
                      <>
                        <span className="text-gray-200">/</span>
                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {fileUrl ? (
                  <>
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="Preview file"
                    >
                      <Eye className="h-4 w-4" />
                    </a>
                    <a
                      href={fileUrl}
                      download
                      className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
                      title="Download file"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                  </>
                ) : (
                  <span className="rounded-lg bg-white px-3 py-2 text-[9px] font-black uppercase tracking-widest text-gray-300">
                    Local
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => deleteFile(fileKey)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Remove file"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="rounded-2xl border border-gray-50 bg-gray-50/60 px-4 py-10 text-center">
            <Paperclip className="mx-auto mb-3 h-8 w-8 text-gray-200" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
