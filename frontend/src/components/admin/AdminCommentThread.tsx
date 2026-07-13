"use client";

import { useRef, useState } from "react";
import { MessageSquare, Paperclip, Send, Trash2, User } from "lucide-react";

export interface AdminComment {
  id: number | string;
  body?: string;
  comment?: string;
  created_at?: string;
  user?: {
    name?: string;
    image?: string;
  };
  files?: Array<{
    id?: number | string;
    filename?: string;
    file_url?: string;
  }>;
  comment_file?: Array<{
    id?: number | string;
    filename?: string;
    file_url?: string;
  }>;
}

interface AdminCommentThreadProps {
  title?: string;
  placeholder?: string;
  comments?: AdminComment[];
  emptyText?: string;
  onCommentsChange?: (comments: AdminComment[]) => void;
}

const getCommentBody = (comment: AdminComment) => comment.body || comment.comment || "";

const getCommentFiles = (comment: AdminComment) => comment.files || comment.comment_file || [];

export default function AdminCommentThread({
  title = "Comments",
  placeholder = "Write a comment...",
  comments = [],
  emptyText = "No comments yet.",
  onCommentsChange,
}: AdminCommentThreadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<AdminComment[]>(comments);
  const [draft, setDraft] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const updateItems = (nextItems: AdminComment[]) => {
    setItems(nextItems);
    onCommentsChange?.(nextItems);
  };

  const submitComment = () => {
    if (!draft.trim() && pendingFiles.length === 0) return;

    const nextComment: AdminComment = {
      id: `local-${Date.now()}`,
      body: draft.trim(),
      created_at: new Date().toISOString(),
      user: { name: "Current user" },
      files: pendingFiles.map((file, index) => ({
        id: `local-file-${Date.now()}-${index}`,
        filename: file.name,
      })),
    };

    updateItems([nextComment, ...items]);
    setDraft("");
    setPendingFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteComment = (commentId: number | string) => {
    updateItems(items.filter((comment) => comment.id !== commentId));
  };

  return (
    <div className="rounded-2xl border border-gray-50 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-800">{title}</h3>
          <p className="mt-1 text-xs font-medium text-gray-400">Threaded activity with attachment support.</p>
        </div>
        <span className="rounded-full bg-gray-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-gray-400">
          {items.length} Total
        </span>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={4}
          placeholder={placeholder}
          className="w-full resize-none rounded-xl border border-gray-100 bg-white p-3 text-sm font-medium text-gray-700 outline-none transition-all focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
        />
        {pendingFiles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {pendingFiles.map((file) => (
              <span key={`${file.name}-${file.size}`} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <Paperclip className="h-3 w-3" />
                {file.name}
              </span>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-sm transition-colors hover:text-primary"
          >
            <Paperclip className="h-4 w-4" />
            <span>Attach</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={(event) => setPendingFiles(Array.from(event.target.files || []))}
            className="hidden"
          />
          <button
            type="button"
            onClick={submitComment}
            className="flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20 transition-colors hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
            <span>Post</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((comment) => {
          const attachments = getCommentFiles(comment);
          return (
            <div key={comment.id} className="rounded-2xl border border-gray-50 bg-gray-50/60 p-4">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-800">{comment.user?.name || "System"}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {comment.created_at ? new Date(comment.created_at).toLocaleString() : "Just now"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteComment(comment.id)}
                  className="rounded-lg p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
                  title="Delete comment"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="text-sm font-medium leading-relaxed text-gray-600" dangerouslySetInnerHTML={{ __html: getCommentBody(comment) || "Attached files only." }} />
              {attachments.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <a
                      key={file.id || file.filename || index}
                      href={file.file_url || undefined}
                      target={file.file_url ? "_blank" : undefined}
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400 transition-colors hover:text-primary"
                    >
                      <Paperclip className="h-3 w-3" />
                      {file.filename || "Attachment"}
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="rounded-2xl border border-gray-50 bg-gray-50/60 px-4 py-10 text-center">
            <MessageSquare className="mx-auto mb-3 h-8 w-8 text-gray-200" />
            <p className="text-xs font-black uppercase tracking-widest text-gray-400">{emptyText}</p>
          </div>
        )}
      </div>
    </div>
  );
}
