import React, { useState } from 'react';
import { 
  Play, Copy, Check, Download, Database, Code2, 
  Sparkles, Clock, CheckCircle2, RefreshCw, Terminal, Layers
} from 'lucide-react';
import { PRESET_QUERIES, PresetQuery, ispDb } from '../utils/analytics';

export const SqlConsole: React.FC = () => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESET_QUERIES[0].id);
  const [copied, setCopied] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    columns: string[];
    rows: (string | number)[][];
    executionTimeMs: number;
    queryTitle: string;
  }>(() => {
    const q = PRESET_QUERIES[0];
    const t0 = performance.now();
    const res = q.execute(ispDb);
    const t1 = performance.now();
    return {
      columns: res.columns,
      rows: res.rows,
      executionTimeMs: Math.max(1, Math.round(t1 - t0)),
      queryTitle: q.title,
    };
  });

  const activeQuery = PRESET_QUERIES.find(q => q.id === selectedPresetId) || PRESET_QUERIES[0];

  const handleRunQuery = (query: PresetQuery) => {
    setSelectedPresetId(query.id);
    const t0 = performance.now();
    const res = query.execute(ispDb);
    const t1 = performance.now();
    setExecutionResult({
      columns: res.columns,
      rows: res.rows,
      executionTimeMs: Math.max(1, Math.round(t1 - t0)),
      queryTitle: query.title,
    });
  };

  const handleCopySql = () => {
    navigator.clipboard?.writeText(activeQuery.sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCsv = () => {
    const headers = executionResult.columns.join(',');
    const rows = executionResult.rows.map(row => 
      row.map(val => typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `query_result_${activeQuery.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30 font-mono">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm tracking-tight">Interactive SQL Query Engine</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                In-Memory RDBMS Engine
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Execute complex relational queries, multi-table joins, aggregations, and subqueries on 3,695 records
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span>ANSI SQL 2016 Compliant</span>
        </div>
      </div>

      {/* Preset Query Picker Tabs */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          Preset Analytical Queries
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {PRESET_QUERIES.map((q) => {
            const isSelected = selectedPresetId === q.id;
            return (
              <button
                key={q.id}
                onClick={() => handleRunQuery(q)}
                className={`p-3 rounded-lg text-left transition-all border flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-emerald-500 text-slate-900 dark:text-white shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                      SQL #{q.id.toUpperCase()}
                    </span>
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <div className="text-xs font-bold line-clamp-1">
                    {q.title}
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-1 mt-2">
                  {q.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Query Code Box & Execution Controls */}
      <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-md">
        {/* Editor Header */}
        <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white font-mono">
              {activeQuery.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySql}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy SQL'}</span>
            </button>

            <button
              onClick={() => handleRunQuery(activeQuery)}
              className="px-3.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Execute SQL</span>
            </button>
          </div>
        </div>

        {/* SQL Code View */}
        <div className="p-4 bg-slate-950 font-mono text-xs overflow-x-auto text-slate-200 leading-relaxed border-b border-slate-800">
          <pre>{activeQuery.sql}</pre>
        </div>

        {/* Execution Metadata Bar */}
        <div className="px-4 py-2.5 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Status: 200 OK
            </span>
            <span>Execution: {executionResult.executionTimeMs} ms</span>
            <span>Rows: {executionResult.rows.length} tuples</span>
            <span>Columns: {executionResult.columns.length}</span>
          </div>

          <button
            onClick={handleExportCsv}
            className="hover:text-white transition-colors flex items-center gap-1 text-[11px]"
          >
            <Download className="w-3 h-3" />
            Export Result Set (CSV)
          </button>
        </div>
      </div>

      {/* Query Results Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-500" />
              Query Result Set
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live materialized output from relational join execution
            </p>
          </div>
          <span className="font-mono text-xs text-slate-400">
            {executionResult.rows.length} rows returned
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                {executionResult.columns.map((col, idx) => (
                  <th key={idx} className="p-3">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {executionResult.rows.length === 0 ? (
                <tr>
                  <td colSpan={executionResult.columns.length} className="p-8 text-center text-slate-400">
                    Query completed with 0 rows returned.
                  </td>
                </tr>
              ) : (
                executionResult.rows.map((row: any, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    {row.map((cell: any, cellIdx: number) => (
                      <td key={cellIdx} className="p-3 text-slate-800 dark:text-slate-200">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
