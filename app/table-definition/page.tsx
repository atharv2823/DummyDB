"use client";

import React, { useState } from "react";
import { Sparkles, Download, FileJson, FileSpreadsheet, Database, Table, ArrowRight, Info, Check } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Toaster, toast } from "sonner";

export default function TableDefinitionPage() {
  const [definition, setDefinition] = useState("");
  const [count, setCount] = useState(10);
  const [format, setFormat] = useState("csv");
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [generatedColumns, setGeneratedColumns] = useState<string[]>([]);

  const generateData = async (definitionStr: string, limit: number) => {
    if (!definitionStr.trim()) {
      throw new Error("Please provide a table definition");
    }

    const response = await fetch("/api/generate-from-def", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        definition: definitionStr,
        count: limit,
      }),
    });
    
    const result = await response.json();
    if (result.error) throw new Error(result.error);
    return result.data;
  };

  const handlePreview = async () => {
    if (!definition.trim()) {
      toast.error("Please provide a table definition");
      return;
    }
    
    setIsGenerating(true);
    try {
      const data = await generateData(definition, Math.min(5, count));
      if (data && data.length > 0) {
        setPreviewData(data);
        setGeneratedColumns(Object.keys(data[0]));
        toast.success("Preview updated");
      } else {
        toast.error("No data could be generated");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate preview");
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!definition.trim()) {
      toast.error("Please provide a table definition");
      return;
    }

    setIsGenerating(true);
    try {
      const rawData = await generateData(definition, count);
      
      if (!rawData || rawData.length === 0) {
        throw new Error("No data generated");
      }

      const columns = Object.keys(rawData[0]);
      setPreviewData(rawData);
      setGeneratedColumns(columns);

      if (format === "csv") {
        const csv = Papa.unparse(rawData);
        const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `data_${Date.now()}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const worksheet = XLSX.utils.json_to_sheet(rawData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, `data_${Date.now()}.xlsx`);
      }

      toast.success(`Successfully generated ${count} rows!`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to generate data");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-center" richColors />

      {/* Background Blobs */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary blur-[120px] rounded-full animate-float"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent blur-[120px] rounded-full animate-float" style={{ animationDelay: '-2s' }}></div>
      </div>

      {/* Header */}
      <header className="w-full max-w-5xl mb-12 flex flex-col items-center text-center">
        <div className="flex items-center gap-2 mb-4 px-4 py-1.5 rounded-full glass border border-white/10 text-sm font-medium text-primary">
          <Table className="w-4 h-4" />
          <span>Natural Language to Data</span>
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-4 gradient-text">
          Table Definition
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl">
          Paste your SQL table definition, Prisma schema, or just describe it in plain English. AI will understand and generate realistic mock data for you.
        </p>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={onSubmit} className="glass rounded-3xl p-6 sm:p-8 space-y-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <FileJson className="w-5 h-5 text-primary" />
                Input Definition
              </h2>
              <div className="space-y-2">
                <textarea
                  value={definition}
                  onChange={(e) => setDefinition(e.target.value)}
                  placeholder="CREATE TABLE Users (&#10;  id INT PRIMARY KEY,&#10;  full_name VARCHAR(100),&#10;  email VARCHAR(255) UNIQUE,&#10;  created_at TIMESTAMP&#10;);"
                  className="w-full min-h-[240px] bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 font-mono text-sm resize-y focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>

            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                  Record Count
                  <Info className="w-3.5 h-3.5" />
                </label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                  className="w-full bg-white/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary"
                  min="1"
                  max="50"
                />
                <p className="text-[10px] text-zinc-500 italic">Limited to 50 rows due to AI generation limits.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Export Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`
                    flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer
                    ${format === 'csv' ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400'}
                  `}>
                    <input type="radio" value="csv" checked={format === 'csv'} onChange={(e) => setFormat(e.target.value)} className="hidden" />
                    <FileJson className="w-4 h-4" />
                    CSV
                  </label>
                  <label className={`
                    flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer
                    ${format === 'xlsx' ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400'}
                  `}>
                    <input type="radio" value="xlsx" checked={format === 'xlsx'} onChange={(e) => setFormat(e.target.value)} className="hidden" />
                    <FileSpreadsheet className="w-4 h-4" />
                    XLSX
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating || !definition.trim()}
              className="w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed btn-ai px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5" />
              )}
              {isGenerating ? "Analyzing & Generating..." : "Generate & Download"}
            </button>
          </form>
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Live Preview
              </h2>
              <button
                onClick={handlePreview}
                disabled={isGenerating || !definition.trim()}
                className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                Refresh <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {previewData.length > 0 ? ( 
              <div className="flex-1 overflow-auto -mx-6 px-6">
                <div className="inline-block min-w-full align-middle overflow-auto h-96">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        {generatedColumns.map((col, idx) => (
                          <th key={idx} className="sticky top-0 z-10 py-3.5 px-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 first:rounded-tl-xl last:rounded-tr-xl">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                <Database className="w-3 h-3" />
                              </div>
                              <span>{col}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      {previewData.map((row, i) => (
                        <tr key={i} className="group hover:bg-primary/5 transition-colors">
                          {generatedColumns.map((col, j) => (
                            <td key={j} className="py-4 px-4 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                              {String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                  <Table className="w-8 h-8" />
                </div>
                <h3 className="font-medium mb-1">Waiting for definition</h3>
                <p className="text-sm text-zinc-500">Paste your table schema and click refresh or generate.</p>
              </div>
            )}
            
            {previewData.length > 0 && (
              <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-xs text-primary font-medium flex gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  Successfully inferred {generatedColumns.length} columns from your definition.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="mt-16 text-zinc-500 text-sm">
        &copy; {new Date().getFullYear()} DummyDB • AI Data Engine
      </footer>
    </div>
  );
}
