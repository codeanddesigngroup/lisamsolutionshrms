"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-40 w-full bg-gray-50 animate-pulse rounded-xl" />,
});

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Write something amazing...", 
  className = "" 
}) => {
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['clean'],
    ],
  };

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet',
    'link', 'image',
  ];

  return (
    <div className={`rich-text-editor group ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white rounded-xl overflow-hidden border-none transition-all group-focus-within:ring-2 group-focus-within:ring-primary/10"
      />
      <style jsx global>{`
        .rich-text-editor .ql-toolbar.ql-snow {
          border: none !important;
          background: #f9fafb !important;
          padding: 12px !important;
          border-bottom: 1px solid #f3f4f6 !important;
        }
        .rich-text-editor .ql-container.ql-snow {
          border: none !important;
          min-height: 200px !important;
          font-size: 0.875rem !important;
        }
        .rich-text-editor .ql-editor {
          padding: 20px !important;
          line-height: 1.6 !important;
          color: #374151 !important;
        }
        .rich-text-editor .ql-editor.ql-blank::before {
          color: #d1d5db !important;
          font-style: normal !important;
          font-weight: 600 !important;
          left: 20px !important;
        }
        .rich-text-editor .ql-snow .ql-picker {
          color: #6b7280 !important;
          font-weight: 700 !important;
        }
        .rich-text-editor .ql-snow .ql-stroke {
          stroke: #9ca3af !important;
          stroke-width: 2px !important;
        }
        .rich-text-editor .ql-snow .ql-fill {
          fill: #9ca3af !important;
        }
        .rich-text-editor .ql-snow.ql-toolbar button:hover .ql-stroke,
        .rich-text-editor .ql-snow.ql-toolbar button.ql-active .ql-stroke {
          stroke: var(--color-primary) !important;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
