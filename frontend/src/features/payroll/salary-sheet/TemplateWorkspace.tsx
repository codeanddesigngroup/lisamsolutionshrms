"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileSpreadsheet, Plus, Save, Trash2 } from "lucide-react";
import api from "@/lib/api";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { baseFields, defaultTemplates, readLocal, templateKey, type SalaryField, type SalaryTemplate } from "@/lib/salary-templates";

const input = "h-11 w-full min-w-0 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const button = "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40";
const secondary = "inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-40";
const catalog = [...baseFields, ...defaultTemplates.flatMap(t => t.fields)].filter((field, index, all) => all.findIndex(f => f.id === field.id) === index);

export default function TemplateWorkspace() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [templates, setTemplates] = useState<SalaryTemplate[]>([]);
  const [selected, setSelected] = useState("");
  const [fieldId, setFieldId] = useState("");
  const [customLabel, setCustomLabel] = useState("");
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const saved = readLocal(templateKey, defaultTemplates);
    const initial = (saved.length ? saved : defaultTemplates).map(t => ({ ...t, fields: t.fields.filter(f => f.enabled).map(f => ({ ...f, visible: true })) }));
    // Hydrate browser-only saved settings after the initial server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTemplates(initial);
    setSelected(initial[0]?.id || "");
    api.get('/departments').then(response => {
      const records = Array.isArray(response.data) ? response.data : response.data.data;
      setDepartments(Array.isArray(records) ? [...new Set<string>(records.map((item: { name?: string; title?: string }) => String(item.name || item.title || '')).filter(Boolean))] : []);
    }).catch(() => setNotice('Departments could not be loaded. Please refresh to try again.'));
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const current = templates.find(t => t.id === selected);
  const available = catalog.filter(f => !current?.fields.some(existing => existing.id === f.id));
  const update = (next: SalaryTemplate) => {
    setTemplates(items => items.map(t => t.id === next.id ? next : t));
    setDirty(true);
    setNotice("");
  };
  const addField = (field: SalaryField) => {
    if (!current) return;
    update({ ...current, fields: [...current.fields, { ...field, enabled: true, visible: true }] });
    setFieldId("");
  };
  const save = () => {
    if (templates.some(t => !t.name.trim() || t.fields.some(f => !f.label.trim() || (f.options || []).some(option => !option.trim()) || new Set((f.options || []).map(option => option.trim().toLowerCase())).size !== (f.options || []).length))) {
      setNotice("Enter names for templates, fields, and types. Type names must be unique within each field.");
      return;
    }
    try {
      localStorage.setItem(templateKey, JSON.stringify(templates));
      setDirty(false);
      setNotice("Templates saved in this browser.");
    } catch { setNotice("Could not save templates. Check browser storage and available disk space."); }
  };

  return <DashboardLayout><div className="min-w-0 space-y-5 pb-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="hidden rounded-2xl bg-blue-50 p-3 text-blue-600 sm:block"><FileSpreadsheet size={24} /></span>
        <div><p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-blue-600">Payroll / Configuration</p><h1 className="text-xl font-black text-gray-900 sm:text-2xl">Salary Sheet Templates</h1><p className="mt-1 text-sm text-gray-500">Build a field list for each department.</p></div>
      </div>
      <Link className={`${secondary} self-start`} href="/payroll/salary-sheet"><ArrowLeft size={16} />Salary Sheet</Link>
    </header>
    {notice && <p role="status" className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-blue-900">{notice}</p>}
    <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <div className="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="grid min-w-0 gap-2 text-xs font-semibold text-gray-600">Selected template<select className={input} value={selected} onChange={e => { setSelected(e.target.value); setFieldId(""); setCustomLabel(""); }}>{templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
        <button className={secondary} onClick={() => { const next: SalaryTemplate = { id: crypto.randomUUID(), name: "New Template", departments: [], fields: [] }; setTemplates([...templates, next]); setSelected(next.id); setFieldId(""); setDirty(true); }}><Plus size={16} />New template</button>
        <button className={button} disabled={!current} onClick={save}><Save size={16} />Save templates</button>
      </div>
      {dirty && <p className="mt-3 text-xs font-medium text-amber-700">You have unsaved changes.</p>}
    </section>
    {!current && <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">No templates yet. Create a template to add fields and assign departments.</div>}
    {current && <>
      <section className="grid gap-5 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5 md:grid-cols-2">
        <label className="grid min-w-0 content-start gap-2 text-xs font-semibold text-gray-600">Template name<input className={input} value={current.name} onChange={e => update({ ...current, name: e.target.value })} /></label>
        <div className="min-w-0 space-y-2"><label className="grid gap-2 text-xs font-semibold text-gray-600">Assign department<select className={input} value="" onChange={e => {
          const department = e.target.value;
          if (!department) return;
          setTemplates(items => items.map(t => t.id === current.id ? { ...t, departments: [...t.departments, department] } : { ...t, departments: t.departments.filter(d => d !== department) }));
          setDirty(true);
        }}><option value="">Choose a department</option>{departments.filter(d => !current.departments.includes(d)).map(d => <option key={d}>{d}</option>)}</select></label>
          <div className="flex flex-wrap gap-2">{current.departments.map(d => <span key={d} className="inline-flex max-w-full items-center gap-1 rounded-xl border border-blue-100 bg-blue-50 pl-3 text-xs font-semibold text-blue-800">{d}<button type="button" title={`Remove ${d}`} aria-label={`Remove ${d} department`} className="flex h-11 w-11 items-center justify-center rounded-xl text-blue-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-blue-600" onClick={() => update({ ...current, departments: current.departments.filter(item => item !== d) })}><Trash2 size={15} /></button></span>)}</div>
          <p className="text-xs leading-relaxed text-gray-500">Each department belongs to one template. Assigning it here replaces its previous assignment.</p>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-4"><h2 className="text-sm font-bold text-gray-900">Add fields</h2><p className="mt-1 text-xs text-gray-500">Create a custom field or choose from the existing list.</p></div>
          <div className="grid gap-4 xl:grid-cols-2">
            <form className="min-w-0 rounded-xl border border-blue-100 bg-white p-3 sm:p-4" onSubmit={e => {
              e.preventDefault();
              if (!customLabel.trim()) return;
              if (current.fields.some(f => f.label.trim().toLowerCase() === customLabel.trim().toLowerCase())) { setNotice("A field with this name already exists in this template."); return; }
              addField({ id: `custom-${crypto.randomUUID()}`, label: customLabel.trim(), enabled: true, visible: true, role: "info", stage: "netBasic" }); setCustomLabel("");
            }}>
              <label htmlFor="custom-salary-field" className="mb-2 block text-xs font-semibold text-gray-700">Custom field</label>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row"><input id="custom-salary-field" className={input} placeholder="e.g. Travel allowance" value={customLabel} onChange={e => setCustomLabel(e.target.value)} /><button type="submit" className={button} disabled={!customLabel.trim()}><Plus size={16} />Add custom field</button></div>
            </form>
            <form className="min-w-0 rounded-xl border border-gray-200 bg-white p-3 sm:p-4" onSubmit={e => { e.preventDefault(); const field = available.find(f => f.id === fieldId); if (field) addField(field); }}>
              <label htmlFor="existing-salary-field" className="mb-2 block text-xs font-semibold text-gray-700">Existing field</label>
              <div className="flex min-w-0 flex-col gap-2 sm:flex-row"><select id="existing-salary-field" className={input} value={fieldId} onChange={e => setFieldId(e.target.value)}><option value="">{available.length ? "Choose a field" : "All existing fields added"}</option>{available.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}</select><button type="submit" className={secondary} disabled={!available.some(f => f.id === fieldId)}><Plus size={16} />Add field</button></div>
            </form>
          </div>
        </div>
        <div className="p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><h2 className="text-sm font-bold text-gray-900">Template fields</h2><span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{current.fields.length}</span></div><p className="text-xs text-gray-500">Edit a name or remove a field.</p></div>
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            {current.fields.map((f, index) => <div key={f.id} className="group flex min-w-0 flex-wrap items-center gap-2 rounded-xl border border-gray-200 p-2 transition focus-within:border-blue-300 focus-within:bg-blue-50/30 hover:border-gray-300 sm:gap-3 sm:p-3">
              <span aria-hidden="true" className="hidden w-6 shrink-0 text-center text-xs font-semibold tabular-nums text-gray-400 sm:block">{String(index + 1).padStart(2, "0")}</span>
              <label className="grid min-w-0 flex-1 gap-1"><span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">{f.id.startsWith("custom-") ? "Custom field" : "Field name"}</span><input className="h-9 w-full min-w-0 rounded-md border border-transparent bg-transparent px-1 text-sm font-semibold text-gray-800 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100" aria-label={`${f.label} field name`} value={f.label} onChange={e => update({ ...current, fields: current.fields.map(item => item.id === f.id ? { ...item, label: e.target.value } : item) })} /></label>
              <button type="button" title={`Delete ${f.label}`} aria-label={`Delete ${f.label}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-red-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500" onClick={() => update({ ...current, fields: current.fields.filter(item => item.id !== f.id) })}><Trash2 size={18} /></button>
              <details className="w-full border-t border-gray-100 pt-2 text-xs text-gray-600">
                <summary className="cursor-pointer py-2 font-semibold text-blue-600">{f.multiple || f.id === 'penalties' ? `Multiple entries (${f.options?.length || 0} types)` : 'Add multiple-entry types'}</summary>
                <p className="mb-2 leading-relaxed">Add types such as misconduct or equipment damage. Each employee can have several named amounts in this field.</p>
                <div className="space-y-2">{(f.options || []).map((option, optionIndex) => <div key={optionIndex} className="flex gap-2"><input aria-label={`${f.label} type ${optionIndex + 1}`} className={input} value={option} placeholder="Enter type name" onChange={e => update({ ...current, fields: current.fields.map(item => item.id === f.id ? { ...item, options: item.options?.map((value, i) => i === optionIndex ? e.target.value : value) } : item) })} /><button type="button" aria-label={`Delete ${option || 'type'}`} className="p-3 text-red-500" onClick={() => update({ ...current, fields: current.fields.map(item => item.id === f.id ? { ...item, options: item.options?.filter((_, i) => i !== optionIndex) } : item) })}><Trash2 size={16} /></button></div>)}</div>
                <button type="button" className="mt-2 inline-flex items-center gap-1 rounded-lg border px-3 py-2 font-semibold" onClick={() => update({ ...current, fields: current.fields.map(item => item.id === f.id ? { ...item, multiple: true, options: [...(item.options || []), ''] } : item) })}><Plus size={14} />Add type</button>
              </details>
            </div>)}
          </div>
          {!current.fields.length && <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center"><Plus className="mx-auto mb-3 text-gray-400" size={24} /><p className="text-sm font-semibold text-gray-700">Start with your first field</p><p className="mt-1 text-xs text-gray-500">Use the controls above to add an existing or custom field.</p></div>}
        </div>
      </section>
    </>}
  </div></DashboardLayout>;
}
