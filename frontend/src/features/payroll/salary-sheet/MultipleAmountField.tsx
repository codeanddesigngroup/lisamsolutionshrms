"use client";

import { useRef, useState } from 'react';
import { ChevronDown, Plus, Trash2, X } from 'lucide-react';
import { entryTotal, type SalaryEntry } from '@/lib/salary-templates';

export default function MultipleAmountField({ label, value, entries, options = [], onChange }: { label: string; value: number; entries?: SalaryEntry[]; options?: string[]; onChange: (entries: SalaryEntry[]) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [draft, setDraft] = useState<SalaryEntry[]>([]);
  const [error, setError] = useState('');
  const open = () => {
    setDraft(entries ? structuredClone(entries) : value ? [{ id: crypto.randomUUID(), label: 'Existing amount', amount: value }] : []);
    setError(''); dialog.current?.showModal();
  };
  return <>
    <button type="button" aria-label={`Edit ${label} breakdown`} onClick={open} className="flex h-9 w-32 items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50 px-2 text-[10px] font-bold text-blue-800"><span>{value.toLocaleString()} <span className="text-blue-400">({entries?.length ?? (value ? 1 : 0)})</span></span><ChevronDown size={14} /></button>
    <dialog onKeyDown={event => { if (event.key === "Enter" && event.target instanceof HTMLInputElement) event.preventDefault(); }} ref={dialog} className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-xl backdrop:bg-black/40" aria-label={`${label} breakdown`}>
      <div className="mb-4 flex items-center justify-between gap-3"><div><h2 className="text-base font-bold text-gray-900">{label}</h2><p className="mt-1 text-xs text-gray-500">Add each amount separately. The sheet uses their total.</p></div><button type="button" aria-label="Close breakdown" onClick={() => dialog.current?.close()} className="rounded-lg p-3 hover:bg-gray-100"><X size={18} /></button></div>
      <div className="space-y-3">{draft.map((entry, index) => <div key={entry.id} className="flex flex-wrap items-end gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3">
        <label className="grid min-w-0 flex-1 basis-44 gap-1 text-xs text-gray-600">Reason / type{options.length > 0 && <select aria-label={`Select type for entry ${index + 1}`} value={options.includes(entry.label) ? entry.label : ''} className="h-10 min-w-0 rounded-lg border bg-white px-2" onChange={e => setDraft(items => items.map(item => item.id === entry.id ? { ...item, label: e.target.value } : item))}><option value="">Choose type or enter below</option>{options.map(option => <option key={option}>{option}</option>)}</select>}<input aria-label={`Reason for entry ${index + 1}`} value={entry.label} placeholder="Enter a reason" className="h-10 min-w-0 rounded-lg border bg-white px-2 text-sm" onChange={e => setDraft(items => items.map(item => item.id === entry.id ? { ...item, label: e.target.value } : item))} /></label>
        <label className="grid w-28 gap-1 text-xs text-gray-600">Amount<input type="number" min="0" step="0.01" value={entry.amount} className="h-10 w-full rounded-lg border bg-white px-2 text-sm" onChange={e => setDraft(items => items.map(item => item.id === entry.id ? { ...item, amount: Number(e.target.value) } : item))} /></label>
        <button type="button" aria-label={`Delete entry ${index + 1}`} className="p-3 text-red-500" onClick={() => setDraft(items => items.filter(item => item.id !== entry.id))}><Trash2 size={16} /></button>
      </div>)}</div>
      {!draft.length && <p className="rounded-xl border border-dashed p-5 text-center text-sm text-gray-500">No entries yet.</p>}
      <button type="button" className="my-4 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold" onClick={() => setDraft(items => [...items, { id: crypto.randomUUID(), label: '', amount: 0 }])}><Plus size={16} />Add entry</button>
      {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4"><strong className="text-sm">Total: PKR {entryTotal(draft).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong><div className="flex gap-2"><button type="button" className="rounded-lg border px-3 py-2 text-sm" onClick={() => dialog.current?.close()}>Cancel</button><button type="button" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white" onClick={() => { if (draft.some(e => !e.label.trim() || !Number.isFinite(e.amount) || e.amount < 0)) { setError('Give each entry a reason and a valid non-negative amount.'); return; } onChange(draft.map(e => ({ ...e, label: e.label.trim(), amount: Math.round(e.amount * 100) / 100 }))); dialog.current?.close(); }}>Apply total</button></div></div>
    </dialog>
  </>;
}
