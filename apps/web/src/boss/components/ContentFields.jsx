import React from 'react';
import { SECTION_SCHEMAS, editAt, newValue, isObject } from '../../content-source/schema.js';
const control = 'w-full rounded border border-white/20 bg-[#151515] px-3 py-2 text-sm text-white';
const button = 'rounded border border-white/20 px-3 py-2 text-xs disabled:opacity-40';
export default function ContentFields({ section, data, onChange, errors = [], disabled }) {
  const update = (path, next) => onChange(editAt(data, path, next));
  function field(schema, value, path) {
    const key = path.join('.');
    const id = `cms-${section}-${key}`;
    const messages = errors.filter(e => e.path === key);
    let input;
    if (value === undefined && schema.optional) return <div key={key} className="flex flex-wrap items-center gap-3"><span>{schema.label} (optional; current public default applies)</span><button type="button" className={button} onClick={() => update(path, newValue(schema))}>Set {schema.label}</button></div>;
    if (schema.type === 'object' && isObject(value)) {
      const unknown = Object.keys(value).filter(k => !Object.hasOwn(schema.fields, k));
      input = <fieldset className="min-w-0 space-y-4 rounded border border-white/10 p-4"><legend className="px-2 font-semibold">{schema.label}</legend>
        {Object.entries(schema.fields).map(([k,f]) => field(f, value[k], [...path,k]))}
        {unknown.length > 0 && <p className="text-xs text-gray-400">Additional fields retained: {unknown.join(', ')}. Use Advanced JSON to inspect them.</p>}
      </fieldset>;
    } else if (schema.type === 'array' && Array.isArray(value)) {
      input = <fieldset className="min-w-0 space-y-3 rounded border border-white/10 p-4"><legend className="px-2 font-semibold">{schema.label}</legend>
        {value.map((v,i) => <div key={v?.id ?? i} className="rounded border border-white/10 p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2"><span>{schema.item.label} {i+1}</span>{[-1,1].map(d => <button type="button" key={d} className={button} disabled={i+d < 0 || i+d >= value.length} aria-label={`Move ${schema.item.label} ${i+1} ${d < 0 ? 'up' : 'down'}`} onClick={() => { const next = [...value]; [next[i],next[i+d]] = [next[i+d],next[i]]; update(path,next); }}>{d < 0 ? 'Up' : 'Down'}</button>)}
            <button type="button" className={button} onClick={() => { if (window.confirm(`Remove ${schema.item.label} ${i+1}? Unsaved changes can be reloaded.`)) update(path,value.filter((_,n) => n !== i)); }}>Remove {schema.item.label} {i+1}</button></div>
          {field(schema.item,v,[...path,i])}
        </div>)}
        <button type="button" className={button} onClick={() => update(path,[...value,newValue(schema.item)])}>Add {schema.item.label}</button>
      </fieldset>;
    } else if (schema.type === 'boolean') input = <label className="flex gap-3"><input id={id} type="checkbox" checked={value === true} onChange={e => update(path,e.target.checked)} />{schema.label}</label>;
    else if (['object','array'].includes(schema.type)) input = <p role="alert">Invalid {schema.label}. Repair it in Advanced JSON.</p>;
    else input = <label className="block space-y-2" htmlFor={id}><span>{schema.label}</span>
      {schema.choices ? <select id={id} className={control} value={value ?? ''} onChange={e => update(path,e.target.value)}>{schema.choices.map(c => <option key={c}>{c}</option>)}</select>
      : schema.multiline ? <textarea id={id} rows={4} className={control} value={value ?? ''} onChange={e => update(path,e.target.value)} aria-invalid={!!messages.length} />
      : <div className="flex gap-2">{schema.format === 'color' && <input aria-label={`${schema.label} picker`} type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={e => update(path,e.target.value)} />}
        <input id={id} className={control} type={schema.type === 'number' ? 'number' : schema.format === 'external' ? 'url' : 'text'} step="any" readOnly={schema.readonly} value={value ?? ''} onChange={e => update(path,schema.type === 'number' && e.target.value !== '' ? Number(e.target.value) : e.target.value)} aria-invalid={!!messages.length} /></div>}
    </label>;
    return <div key={key} className="space-y-2">{input}{messages.map((e,i) => <p key={i} role="alert" className="text-red-300 text-xs">{e.message}</p>)}
      {schema.optional && value !== undefined && <button type="button" className={button} onClick={() => update(path,undefined)}>Use default for {schema.label}</button>}
    </div>;
  }
  return <fieldset disabled={disabled} className="min-w-0 space-y-4 text-sm">{field(SECTION_SCHEMAS[section],data,[])}</fieldset>;
}
