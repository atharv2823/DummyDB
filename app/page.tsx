"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState } from "react";
import * as allFakers from "@faker-js/faker";
import {
  Plus,
  Trash2,
  Download,
  FileJson,
  FileSpreadsheet,
  Database,
  Sparkles,
  ArrowRight,
  Info,
  User,
  MapPin,
  ShoppingBag,
  Code,
  ChevronDown,
  Search,
  Check,
  Globe
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { Toaster, toast } from "sonner";

// --- Schema & Types ---

const columnSchema = z.object({
  name: z.string().min(1, "Column name is required"),
  type: z.string().min(1, "Data type is required"),
});

const formSchema = z.object({
  columns: z.array(columnSchema).min(1, "Add at least one column"),
  count: z.number().min(1).max(5000),
  format: z.enum(["csv", "xlsx"]),
  locale: z.string(),
});

type FormValues = z.infer<typeof formSchema>;

const FAKER_CATEGORIES = [
  {
    name: "Personal",
    icon: "User",
    types: [
      { label: "Full Name", value: "person.fullName" },
      { label: "First Name", value: "person.firstName" },
      { label: "Last Name", value: "person.lastName" },
      { label: "Email", value: "internet.email" },
      { label: "Phone Number", value: "phone.number" },
      { label: "Job Title", value: "person.jobTitle" },
      { label: "Username", value: "internet.userName" },
      { label: "Bio", value: "person.bio" },
      { label: "Date of Birth", value: "date.birthdate" },
    ]
  },
  {
    name: "Location",
    icon: "MapPin",
    types: [
      { label: "City", value: "location.city" },
      { label: "Country", value: "location.country" },
      { label: "Street Address", value: "location.streetAddress" },
    ]
  },
  {
    name: "Commerce",
    icon: "ShoppingBag",
    types: [
      { label: "Company", value: "company.name" },
      { label: "Product Name", value: "commerce.productName" },
      { label: "Price", value: "commerce.price" },
      { label: "Department", value: "commerce.department" },
    ]
  },
  {
    name: "Technical",
    icon: "Code",
    types: [
      { label: "UUID", value: "string.uuid" },
      { label: "Number (1-100)", value: "number.int" },
      { label: "Boolean", value: "datatype.boolean" },
      { label: "Color", value: "color.human" },
    ]
  }
];

const ALL_TYPES = FAKER_CATEGORIES.flatMap(c => c.types);

const LOCALES = [
  { label: "English (US)", value: "EN_US" },
  { label: "English (UK)", value: "EN_GB" },
  { label: "English (India)", value: "EN_IN" },
  { label: "Spanish", value: "ES" },
  { label: "French", value: "FR" },
  { label: "German", value: "DE" },
  { label: "Japanese", value: "JA" },
  { label: "Chinese", value: "ZH_CN" },
  { label: "Russian", value: "RU" },
  { label: "Italian", value: "IT" },
  { label: "Hindi", value: "HI" },
  { label: "Portuguese", value: "PT_BR" },
];

const HINDI_DATA: any = {
  person: {
    firstName: ["प्रिया", "आदित्य", "अंजलि", "राहुल", "नेहा", "समीर", "पूजा", "अमित", "दीपा", "विक्रम"],
    lastName: ["पाटिल", "शर्मा", "वर्मा", "गुप्ता", "मल्होत्रा", "जोशी", "कुलकर्णी", "देशमुख", "सिंह", "मिश्र"],
    fullName: () => {
      const first = HINDI_DATA.person.firstName[Math.floor(Math.random() * HINDI_DATA.person.firstName.length)];
      const last = HINDI_DATA.person.lastName[Math.floor(Math.random() * HINDI_DATA.person.lastName.length)];
      return `${first} ${last}`;
    },
    jobTitle: [
      "सॉफ्टवेयर इंजीनियर", "डॉक्टर", "शिक्षक", "परियोजना प्रबंधक", "वरिष्ठ प्रबंधक",
      "वित्तीय विश्लेषक", "विपणन विशेषज्ञ", "बिक्री प्रतिनिधि", "प्रशासनिक सहायक",
      "डेटा वैज्ञानिक", "लेखक", "कलाकार"
    ],
    bio: ["नमस्ते, मैं एक उत्साही व्यक्ति हूँ।", "मुझे नई चीजें सीखना पसंद है।", "भारत मेरा देश है।"]
  },
  location: {
    city: ["मुंबई", "पुणे", "दिल्ली", "नागपुर", "औरंगाबाद", "बेंगलुरु", "चेन्नई", "कोलकाता", "हैदराबाद", "अहमदाबाद"],
    country: ["भारत"],
    streetAddress: ["महात्मा गांधी मार्ग", "शिवाजी नगर", "लक्ष्मी रोड", "सयाजी मार्ग"]
  },
  company: {
    name: ["टाटा समूह", "रिलायंस इंडस्ट्रीज", "इन्फोसिस", "विप्रो", "एचसीएल टेक्नोलॉजीज"]
  },
  commerce: {
    productName: ["लैपटॉप", "स्मार्टफोन", "घड़ी", "जूते", "किताब", "बैग"],
    department: ["इलेक्ट्रॉनिक्स", "कपड़े", "किताबें", "घर और रसोई"]
  }
};

const getFakerValue = (path: string, locale: string = "EN_US") => {
  try {
    const parts = path.split(".");

    // Custom Hindi script support
    if (locale === 'HI') {
      let currentHindi = HINDI_DATA;
      for (const part of parts) {
        if (currentHindi && part in currentHindi) {
          currentHindi = currentHindi[part];
        } else {
          currentHindi = null;
          break;
        }
      }
      if (currentHindi) {
        if (typeof currentHindi === "function") return currentHindi();
        if (Array.isArray(currentHindi)) return currentHindi[Math.floor(Math.random() * currentHindi.length)];
        return String(currentHindi);
      }
    }

    // Support for locale-specific instances in Faker v10
    const fakerInstance =
      (allFakers as any)[`faker${locale}`] ||
      (allFakers as any)[`faker${locale.replace('_', '')}`] ||
      (locale === 'HI' ? (allFakers as any).fakerEN_IN : null) ||
      allFakers.faker;

    let current: any = fakerInstance;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return "N/A";
      }
    }
    
    const result = typeof current === "function" ? current() : current;
    
    // Format Date objects to DD-MM-YYYY
    if (result instanceof Date) {
      const day = String(result.getDate()).padStart(2, '0');
      const month = String(result.getMonth() + 1).padStart(2, '0');
      const year = result.getFullYear();
      return `${day}-${month}-${year}`;
    }
    
    return String(result);
  } catch (e) {
    console.error(`Error generating faker value for ${path} (${locale}):`, e);
    return "Error";
  }
};

const TypeSelector = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const selectedType = ALL_TYPES.find(t => t.value === value);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredCategories = FAKER_CATEGORIES.map(cat => ({
    ...cat,
    types: cat.types.filter(t =>
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      cat.name.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.types.length > 0);

  const IconMap: any = { User, MapPin, ShoppingBag, Code };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 bg-white/5 dark:bg-zinc-950/30 backdrop-blur-md border border-(--border) rounded-xl px-4 py-2.5 hover:border-primary/50 hover:bg-primary/5 transition-all text-sm shadow-sm"
      >
        <span className="truncate font-medium">{selectedType?.label || "Select Type"}</span>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 w-full mt-2 rounded-2xl border border-primary/20 shadow-[0_20px_50px_rgba(99,102,241,0.15)] z-50 overflow-hidden min-w-60 bg-white/70 dark:bg-zinc-950/80 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute inset-0 bg-linear-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <div className="relative">
            <div className="p-3 border-b border-(--border)">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  autoFocus
                  className="w-full pl-9 py-1.5 text-sm bg-zinc-100 dark:bg-zinc-900 border-none rounded-lg focus:ring-1 focus:ring-primary"
                  placeholder="Search types..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="max-h-75 overflow-y-auto p-2 space-y-4">
              {filteredCategories.map((cat) => {
                const CategoryIcon = IconMap[cat.icon];
                return (
                  <div key={cat.name} className="space-y-1">
                    <div className="px-2 py-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      <CategoryIcon className="w-3 h-3" />
                      {cat.name}
                    </div>
                    <div className="space-y-0.5">
                      {cat.types.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          onClick={() => {
                            onChange(t.value);
                            setIsOpen(false);
                            setSearch("");
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all hover:bg-primary/10 hover:text-primary ${value === t.value ? 'bg-primary/5 text-primary' : ''}`}
                        >
                          {t.label}
                          {value === t.value && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {filteredCategories.length === 0 && (
                <div className="py-8 text-center text-zinc-500 text-sm">
                  No data types found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [useAi, setUseAi] = useState(false);
  const [previewData, setPreviewData] = useState<any[][]>([]);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      columns: [{ name: "id", type: "string.uuid" }, { name: "name", type: "person.fullName" }],
      count: 100,
      format: "csv",
      locale: "EN_US",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "columns",
  });

  const generateData = async (values: FormValues, limit?: number) => {
    const count = limit || values.count;

    if (useAi) {
      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            columns: values.columns,
            count,
            locale: values.locale,
          }),
        });
        const result = await response.json();
        if (result.error) throw new Error(result.error);
        return result.data;
      } catch (error: any) {
        toast.error(error.message || "AI Generation failed. Falling back to Faker.");
        // Fallback to faker below
      }
    }

    const data: any[][] = [];
    if (!values.columns) return data;
    for (let i = 0; i < count; i++) {
      const row: any[] = [];
      values.columns.forEach((col) => {
        row.push(getFakerValue(col.type, values.locale));
      });
      data.push(row);
    }
    return data;
  };

  // Smart Type Detection Logic
  const handleNameChange = (index: number, name: string) => {
    const n = name.toLowerCase();
    if (n.includes("city") || n.includes("शहर") || n.includes("place") || n.includes("location")) setValue(`columns.${index}.type`, "location.city");
    else if (n.includes("designation") || n.includes("job") || n.includes("पद") || n.includes("role") || n.includes("title") || n.includes("post") || n.includes("नौकरी") || n.includes("काम")) setValue(`columns.${index}.type`, "person.jobTitle");
    else if (n.includes("email") || n.includes("ईमेल") || n.includes("mail")) setValue(`columns.${index}.type`, "internet.email");
    else if (n.includes("country") || n.includes("देश")) setValue(`columns.${index}.type`, "location.country");
    else if (n.includes("company") || n.includes("कंपनी") || n.includes("compnay") || n.includes("org") || n.includes("firm")) setValue(`columns.${index}.type`, "company.name");
    else if (n.includes("price") || n.includes("कीमत") || n.includes("cost") || n.includes("amount") || n.includes("rate")) setValue(`columns.${index}.type`, "commerce.price");
    else if (n.includes("phone") || n.includes("mobile") || n.includes("संपर्क") || n.includes("tel") || n.includes("contact") || n.includes("no")) setValue(`columns.${index}.type`, "phone.number");
  };

  // Reactive preview update
  const watchedColumns = watch("columns");
  const watchedLocale = watch("locale");

  React.useEffect(() => {
    const updatePreview = async () => {
      const data = await generateData({ columns: watchedColumns, locale: watchedLocale } as any, 5);
      setPreviewData(data);
    };
    updatePreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedColumns, watchedLocale, useAi]);

  const onSubmit = async (values: FormValues) => {
    setIsGenerating(true);
    try {
      const rawData = await generateData(values);

      // Map to objects for export
      const exportData = rawData.map((row: any[]) => {
        const obj: any = {};
        values.columns.forEach((col, i) => {
          let val = row[i];
          // Prevent Excel from converting phone numbers/large numbers to scientific notation in CSV
          if (values.format === "csv" && typeof val === "string" && /^[0-9+() -]+$/.test(val) && val.replace(/\D/g, "").length >= 8) {
            val = val + "\t"; // Appending a tab forces Excel to read it as text
          }
          obj[col.name || `Column_${i + 1}`] = val;
        });
        return obj;
      });

      if (values.format === "csv") {
        const csv = Papa.unparse(exportData);
        // Prepend UTF-8 BOM (\uFEFF) so Excel reads Unicode (like Hindi) correctly
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
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
        XLSX.writeFile(workbook, `data_${Date.now()}.xlsx`);
      }

      toast.success(`Successfully generated ${values.count} rows!`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Failed to generate data");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = async () => {
    const currentValues = watch();
    if (currentValues.columns.some(c => !c.name)) {
      toast.error("Please fill in all column names first");
      return;
    }
    const data = await generateData({ ...currentValues } as any, 5);
    setPreviewData(data);
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
          <Sparkles className="w-4 h-4" />
          <span>Next-Gen Data Generator</span>
        </div>
        <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-4 gradient-text">
          DummyDB
        </h1>
        <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl">
          Generate hyper-realistic dummy data using DummyDB or the power of AI.
        </p>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-3xl p-6 sm:p-8 space-y-8 border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Database className="w-5 h-5 text-primary" />
                    Schema Configuration
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => setUseAi(!useAi)}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer transition-all border
                      ${useAi ? 'bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/5 border-white/10 text-zinc-500'}
                    `}
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${useAi ? 'animate-pulse' : ''}`} />
                    <span className="text-xs font-bold uppercase tracking-wider">AI Mode</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => append({ name: "", type: "person.fullName" })}
                    className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Column
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="relative flex flex-col sm:flex-row gap-3 group items-start p-4 sm:p-0 rounded-2xl bg-white/50 dark:bg-zinc-900/20 sm:bg-transparent border border-zinc-200 dark:border-zinc-800 sm:border-none shadow-sm sm:shadow-none transition-all hover:border-primary/30">
                    <div className="w-full sm:flex-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block sm:hidden">Column Name</label>
                      <input
                        {...register(`columns.${index}.name` as const, {
                          onChange: (e) => handleNameChange(index, e.target.value)
                        })}
                        placeholder="e.g. user_id"
                        className="w-full"
                      />
                      {errors.columns?.[index]?.name && (
                        <p className="text-xs text-red-500 mt-1">{errors.columns[index]?.name?.message}</p>
                      )}
                    </div>
                    <div className="w-full sm:flex-1 relative">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1 block sm:hidden">Data Type</label>
                      <TypeSelector
                        value={watchedColumns[index]?.type}
                        onChange={(val) => {
                          setValue(`columns.${index}.type`, val);
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="absolute top-2 right-2 sm:static p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                  Language / Locale
                  <Globe className="w-3.5 h-3.5" />
                </label>
                <select
                  {...register("locale")}
                  className="w-full"
                >
                  {LOCALES.map((l) => (
                    <option key={l.value} value={l.value} className="bg-black text-white">
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500 flex items-center gap-2">
                  Record Count
                  <Info className="w-3.5 h-3.5" />
                </label>
                <input
                  type="number"
                  {...register("count", { valueAsNumber: true })}
                  className="w-full"
                  min="1"
                  max={useAi ? "50" : "5000"}
                />
                {useAi && <p className="text-[10px] text-zinc-500 italic">AI generation is limited to 50 rows per batch.</p>}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-500">Export Format</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className={`
                    flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer
                    ${watch("format") === 'csv' ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400'}
                  `}>
                    <input {...register("format")} type="radio" value="csv" className="hidden" />
                    <FileJson className="w-4 h-4" />
                    CSV
                  </label>
                  <label className={`
                    flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 transition-all cursor-pointer
                    ${watch("format") === 'xlsx' ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-200 dark:border-zinc-800 text-zinc-400'}
                  `}>
                    <input {...register("format")} type="radio" value="xlsx" className="hidden" />
                    <FileSpreadsheet className="w-4 h-4" />
                    XLSX
                  </label>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className={`
                w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed
                ${useAi ? 'btn-ai' : 'btn-primary'}
              `}
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                useAi ? <Sparkles className="w-5 h-5" /> : <Download className="w-5 h-5" />
              )}
              {isGenerating ? "Processing..." : useAi ? "Generate with AI" : "Generate & Download"}
            </button>
          </form>
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800 flex flex-col h-full min-h-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Sparkles className={`w-5 h-5 ${useAi ? 'text-primary' : 'text-accent'}`} />
                {useAi ? 'AI Intelligence Preview' : 'Standard Live Preview'}
              </h2>
              <button
                onClick={handlePreview}
                className="text-sm text-zinc-500 hover:text-primary transition-colors flex items-center gap-1"
              >
                Refresh <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {previewData.length > 0 ? (
              <div className="flex-1 overflow-auto -mx-6 px-6">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full border-separate border-spacing-0">
                    <thead>
                      <tr>
                        {watchedColumns.map((col, idx) => {
                          const category = FAKER_CATEGORIES.find(c => c.types.some(t => t.value === col.type));
                          const IconMap: any = { User, MapPin, ShoppingBag, Code };
                          const Icon = category ? IconMap[category.icon] : Database;

                          return (
                            <th key={idx} className="sticky top-0 z-10 py-3.5 px-4 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 first:rounded-tl-xl last:rounded-tr-xl">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                  <Icon className="w-3 h-3" />
                                </div>
                                <span>{col.name || "Untitled"}</span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                      {previewData.map((row, i) => (
                        <tr key={i} className="group hover:bg-primary/5 transition-colors">
                          {Array.isArray(row) && row.map((val: any, j) => (
                            <td key={j} className="py-4 px-4 text-sm text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                              <span className="font-mono text-xs opacity-70 mr-2 text-primary">#</span>
                              {String(val)}
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
                  <Database className="w-8 h-8" />
                </div>
                <h3 className="font-medium mb-1">No preview available</h3>
                <p className="text-sm text-zinc-500">Configure your schema and click refresh to see a sample of your data.</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-primary/5 rounded-2xl border border-primary/10">
              <p className="text-xs text-primary font-medium flex gap-2">
                <Info className="w-4 h-4 shrink-0" />
                {useAi ? "AI mode generates highly realistic, contextual data but is limited to smaller batches." : "Standard mode is fast and supports up to 5000 rows."}
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-16 text-zinc-500 text-sm">
        &copy; {new Date().getFullYear()} DummyDB • Simple, Fast, Seeded.
      </footer>
    </div>
  );
}
