import React, { useState } from 'react';
import {
  Network,
  Database,
  Key,
  Link2,
  FileCode2,
  CheckCircle2,
  Copy,
  Check,
  Download,
  Info,
  Maximize2,
  ArrowRight,
  Sparkles,
  Table,
} from 'lucide-react';
import {
  TABLES_SCHEMA,
  RELATIONSHIPS,
  NORMALIZATION_REPORT,
  POSTGRES_DDL,
  MYSQL_DDL,
  PRISMA_SCHEMA,
} from '../data/dbSchema';
import { TableSchema } from '../types/isp';

export const InteractiveERD: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'erd' | 'normalization' | 'ddl' | 'dictionary'>('erd');
  const [selectedTable, setSelectedTable] = useState<string>('subscriptions');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [ddlFlavor, setDdlFlavor] = useState<'postgres' | 'mysql' | 'prisma'>('postgres');

  const currentTableSchema = TABLES_SCHEMA.find((t) => t.name === selectedTable) || TABLES_SCHEMA[0];

  // Relationships connected to the selected table
  const relatedLinks = RELATIONSHIPS.filter(
    (r) => r.fromTable === selectedTable || r.toTable === selectedTable
  );

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDownloadSql = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getDdlContent = () => {
    switch (ddlFlavor) {
      case 'postgres':
        return { code: POSTGRES_DDL, ext: 'sql', name: 'isp_billing_schema_postgres.sql' };
      case 'mysql':
        return { code: MYSQL_DDL, ext: 'sql', name: 'isp_billing_schema_mysql.sql' };
      case 'prisma':
        return { code: PRISMA_SCHEMA, ext: 'prisma', name: 'schema.prisma' };
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header and Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Relational Database Design & Architecture
            </h2>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
              6 Entities · 7 Foreign Keys
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete database design specification for ISP billing, 3NF normalization proofs, entity diagram, and production DDL generators.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0">
          <button
            onClick={() => setActiveTab('erd')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'erd'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Visual ERD
          </button>
          <button
            onClick={() => setActiveTab('normalization')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'normalization'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Normalization (3NF)
          </button>
          <button
            onClick={() => setActiveTab('ddl')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'ddl'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            SQL DDL Schema
          </button>
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'dictionary'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Data Dictionary
          </button>
        </div>
      </div>

      {/* 1. VISUAL ERD TAB */}
      {activeTab === 'erd' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Main Visual Schema Grid */}
          <div className="xl:col-span-8 flex flex-col gap-4">
            <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Info className="w-4 h-4 text-indigo-500" />
                <span>
                  Click any entity card to inspect its attributes, relationships, foreign keys, and indexes.
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" /> PK (Primary Key)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-indigo-500" /> FK (Foreign Key)
                </span>
              </div>
            </div>

            {/* Grid of entities simulating the schema model */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TABLES_SCHEMA.map((table) => {
                const isSelected = selectedTable === table.name;
                const isRelated = relatedLinks.some(
                  (r) => r.fromTable === table.name || r.toTable === table.name
                );

                return (
                  <div
                    key={table.name}
                    onClick={() => setSelectedTable(table.name)}
                    className={`cursor-pointer rounded-xl border transition-all text-xs flex flex-col overflow-hidden bg-white dark:bg-slate-900 ${
                      isSelected
                        ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                        : isRelated
                        ? 'border-indigo-300 dark:border-indigo-800/80 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {/* Table Title Bar */}
                    <div
                      className={`px-4 py-2.5 flex items-center justify-between border-b font-semibold ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-700'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Table className="w-3.5 h-3.5" />
                        <span className="font-mono text-xs">{table.name}</span>
                      </div>
                      <span
                        className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-indigo-700 text-indigo-100'
                            : 'bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {table.rowCount} rows
                      </span>
                    </div>

                    {/* Columns List */}
                    <div className="p-3 flex flex-col gap-1.5 divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                      {table.columns.map((col) => (
                        <div
                          key={col.name}
                          className="pt-1.5 first:pt-0 flex items-center justify-between text-slate-700 dark:text-slate-300"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            {col.isPk ? (
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300">
                                PK
                              </span>
                            ) : col.isFk ? (
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                                FK
                              </span>
                            ) : (
                              <span className="w-2" />
                            )}
                            <span className={col.isPk ? 'font-bold text-slate-900 dark:text-white' : ''}>
                              {col.name}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate ml-2">
                            {col.type}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer note */}
                    <div className="mt-auto px-3 py-2 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500">
                      PK: {table.primaryKey} · {table.columns.length} columns
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Visual Relationships Matrix */}
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Schema Referential Relationships (1:N Cardinality)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {RELATIONSHIPS.map((rel, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-lg border text-xs transition-colors flex items-center justify-between ${
                      rel.fromTable === selectedTable || rel.toTable === selectedTable
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200'
                        : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="font-semibold text-slate-900 dark:text-white">{rel.fromTable}</span>
                      <span className="text-slate-400">.{rel.fromColumn}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="font-semibold text-slate-900 dark:text-white">{rel.toTable}</span>
                      <span className="text-slate-400">.{rel.toColumn}</span>
                    </div>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
                      {rel.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Inspector Drawer */}
          <div className="xl:col-span-4 flex flex-col gap-4">
            <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Entity Inspector</span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono flex items-center gap-2">
                    <Table className="w-4 h-4 text-indigo-600" />
                    <span>{currentTableSchema.name}</span>
                  </h3>
                </div>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200 dark:border-indigo-800">
                  {currentTableSchema.rowCount} records
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400">
                {currentTableSchema.description}
              </p>

              {/* Attributes Detail */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Attributes & Constraints ({currentTableSchema.columns.length})
                </span>
                <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
                  {currentTableSchema.columns.map((col) => (
                    <div
                      key={col.name}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between font-mono">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                          {col.isPk && (
                            <Key className="w-3.5 h-3.5 text-amber-500" />
                          )}
                          {col.isFk && (
                            <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                          )}
                          <span>{col.name}</span>
                        </div>
                        <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">
                          {col.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {col.description}
                      </p>
                      {col.references && (
                        <div className="mt-1 text-[10px] font-mono text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                          <span>↳ References:</span>
                          <span className="font-semibold underline">
                            {col.references.table}.{col.references.column}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Indexes & Keys */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Indexes & Foreign Keys
                </span>
                <div className="flex flex-col gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                  {currentTableSchema.indexes.map((idxStr, i) => (
                    <div key={i} className="p-1.5 rounded bg-slate-100 dark:bg-slate-800/80 text-[10px] truncate">
                      {idxStr}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. NORMALIZATION (3NF) TAB */}
      {activeTab === 'normalization' && (
        <div className="flex flex-col gap-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {NORMALIZATION_REPORT.title}
              </h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {NORMALIZATION_REPORT.summary} Each relation has been thoroughly audited to prevent Insertion Anomalies, Update Anomalies, and Deletion Anomalies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {NORMALIZATION_REPORT.stages.map((stage, idx) => (
              <div
                key={idx}
                className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="font-bold text-sm text-slate-900 dark:text-white">
                    {stage.form}
                  </span>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                    {stage.status}
                  </span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {stage.criteria}
                </div>
                <ul className="flex flex-col gap-2 mt-1">
                  {stage.details.map((detail, dIdx) => (
                    <li
                      key={dIdx}
                      className="text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/60"
                    >
                      <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Anomaly Prevention Matrix */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col gap-4">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              Database Anomaly Elimination Proofs
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">Insertion Anomalies</span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  A new internet broadband plan (e.g., &quot;Gigabit 1000&quot;) can be inserted into the <code>packages</code> catalog without requiring an existing subscriber to be registered first.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">Update Anomalies</span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Updating the speed or monthly tariff of &quot;Turbo 50&quot; requires modifying exactly one single tuple in <code>packages</code>, eliminating discrepancies across the 200 subscriptions.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">Deletion Anomalies</span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Terminating a subscriber&apos;s subscription does not delete the master customer record or erase historical bills and cleared payments needed for tax auditing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SQL DDL SCHEMA TAB */}
      {activeTab === 'ddl' && (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-indigo-500" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Production Database Schema DDL Generators
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Download or execute directly in PostgreSQL, MySQL 8.0, or Prisma ORM.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  onClick={() => setDdlFlavor('postgres')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    ddlFlavor === 'postgres'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  PostgreSQL
                </button>
                <button
                  onClick={() => setDdlFlavor('mysql')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    ddlFlavor === 'mysql'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  MySQL 8
                </button>
                <button
                  onClick={() => setDdlFlavor('prisma')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    ddlFlavor === 'prisma'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Prisma ORM
                </button>
              </div>

              <button
                onClick={() => {
                  const d = getDdlContent();
                  handleCopy(d.code, ddlFlavor);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
              >
                {copiedCode === ddlFlavor ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copy Code</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  const d = getDdlContent();
                  handleDownloadSql(d.code, d.name);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File</span>
              </button>
            </div>
          </div>

          {/* DDL Code Box */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950 text-slate-100 shadow-md">
            <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
              <span>{getDdlContent().name}</span>
              <span>Syntax: {ddlFlavor.toUpperCase()}</span>
            </div>
            <pre className="p-5 text-xs font-mono leading-relaxed overflow-x-auto max-h-[600px] text-emerald-400 selection:bg-indigo-900 selection:text-white">
              <code>{getDdlContent().code}</code>
            </pre>
          </div>
        </div>
      )}

      {/* 4. DATA DICTIONARY TAB */}
      {activeTab === 'dictionary' && (
        <div className="flex flex-col gap-6">
          <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Complete Relational Data Dictionary (6 Tables)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Field definitions, data types, indexing, and foreign key referential actions matching the term-paper dataset.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {TABLES_SCHEMA.map((table) => (
              <div
                key={table.name}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden"
              >
                <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Table className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-sm text-slate-900 dark:text-white font-mono">
                      {table.name}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      — {table.description}
                    </span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {table.rowCount} tuples
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-mono text-[11px] bg-slate-50/50 dark:bg-slate-900/50">
                        <th className="py-2.5 px-4">Column Name</th>
                        <th className="py-2.5 px-4">Data Type</th>
                        <th className="py-2.5 px-4">Key Type</th>
                        <th className="py-2.5 px-4">Nullability</th>
                        <th className="py-2.5 px-4">Description / Constraints</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                      {table.columns.map((c) => (
                        <tr key={c.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">
                            {c.name}
                          </td>
                          <td className="py-2.5 px-4 text-indigo-600 dark:text-indigo-400">
                            {c.type}
                          </td>
                          <td className="py-2.5 px-4">
                            {c.isPk ? (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px]">
                                PRIMARY KEY
                              </span>
                            ) : c.isFk ? (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px]">
                                FOREIGN KEY
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {c.nullable ? (
                              <span className="text-slate-400">NULL</span>
                            ) : (
                              <span className="text-slate-700 dark:text-slate-300 font-medium">NOT NULL</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 font-sans text-xs text-slate-600 dark:text-slate-300">
                            {c.description}
                            {c.references && (
                              <span className="block font-mono text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                                → References {c.references.table}({c.references.column})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
