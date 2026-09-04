import React from 'react';

export const Panel = ({ title, hint, actions, children }) => (
  <section className="mb-10">
    <header className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
      <div>
        <h2 className="font-mono text-sm text-gray-300 tracking-wide uppercase">{title}</h2>
        {hint ? <p className="font-mono text-xs text-gray-600 mt-1">{hint}</p> : null}
      </div>
      {actions ? <div className="font-mono text-xs">{actions}</div> : null}
    </header>
    {children}
  </section>
);

export const StatGrid = ({ items }) => (
  <dl className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
    {items.map((item) => (
      <div key={item.label} className="border border-white/10 bg-[#151515] rounded p-5">
        <dt className="font-mono text-[11px] uppercase tracking-wider text-gray-500">{item.label}</dt>
        <dd className="font-mono text-2xl text-white mt-2 break-words">{item.value}</dd>
        {item.note ? <p className="font-mono text-xs text-gray-600 mt-2">{item.note}</p> : null}
      </div>
    ))}
  </dl>
);

export const DataTable = ({ columns, rows, rowKey }) => (
  <div className="border border-white/10 bg-[#151515] rounded overflow-x-auto">
    <table className="w-full text-left font-mono text-xs">
      <thead>
        <tr className="text-gray-500 border-b border-white/10">
          {columns.map((column) => (
            <th key={column.key} scope="col" className="px-4 py-3 font-normal uppercase tracking-wider whitespace-nowrap">
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={rowKey(row, index)} className="border-b border-white/5 last:border-0 text-gray-300">
            {columns.map((column) => (
              <td key={column.key} className="px-4 py-3 align-top">
                {column.render ? column.render(row) : String(row[column.key] ?? '—')}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
