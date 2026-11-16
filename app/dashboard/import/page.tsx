'use client';
import Link from 'next/link';

import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { sanitizeText, formatPhoneNumber, formatDateDisplay } from '../../../lib/sanitizer';
import { Upload, FileSpreadsheet, CheckCircle, ArrowRight, Database, RefreshCw, Eye, ArrowLeft, Plus, AlertTriangle, ChevronDown, Check, LogOut, ShieldCheck } from 'lucide-react';

const CORE_FIELDS = [
  // General & Auction
  { key: 'deal_type', label: 'Deal Type', isMulti: false },
  { key: 'county', label: '[Auction] County', isMulti: false },
  { key: 'case_number', label: '[Auction] Case Number', isMulti: false },
  { key: 'parcel_id', label: '[Auction] Parcel ID', isMulti: false },
  { key: 'opening_bid', label: '[Auction] Opening Bid', isMulti: false },
  { key: 'amount_sold', label: '[Auction] Amount Sold', isMulti: false },
  { key: 'excess_funds', label: '[Auction] Excess Funds', isMulti: false },
  { key: 'auction_date', label: '[Auction] Auction Date', isMulti: false },
  
  // Property Info
  { key: 'prop_address', label: '[Property] Address', isMulti: false },
  { key: 'prop_city', label: '[Property] City', isMulti: false },
  { key: 'prop_state', label: '[Property] State', isMulti: false },
  { key: 'prop_zip', label: '[Property] Zip', isMulti: false },

  // Owner 1
  { key: 'o1_fname', label: '[Owner 1] First Name', isMulti: false },
  { key: 'o1_mname', label: '[Owner 1] Middle Name', isMulti: false },
  { key: 'o1_lname', label: '[Owner 1] Last Name', isMulti: false },
  { key: 'o1_mail_address', label: '[Owner 1] Mailing Address', isMulti: false },
  { key: 'o1_mail_city', label: '[Owner 1] Mailing City', isMulti: false },
  { key: 'o1_mail_state', label: '[Owner 1] Mailing State', isMulti: false },
  { key: 'o1_mail_zip', label: '[Owner 1] Mailing Zip', isMulti: false },
  { key: 'o1_phones', label: '[Owner 1] Phones (Select Multiple)', isMulti: true },
  { key: 'o1_emails', label: '[Owner 1] Emails (Select Multiple)', isMulti: true },

  // Owner 2
  { key: 'o2_fname', label: '[Owner 2] First Name', isMulti: false },
  { key: 'o2_lname', label: '[Owner 2] Last Name', isMulti: false },
  { key: 'o2_mail_address', label: '[Owner 2] Mailing Address', isMulti: false },
  { key: 'o2_mail_city', label: '[Owner 2] Mailing City', isMulti: false },
  { key: 'o2_mail_state', label: '[Owner 2] Mailing State', isMulti: false },
  { key: 'o2_mail_zip', label: '[Owner 2] Mailing Zip', isMulti: false },
  { key: 'o2_phones', label: '[Owner 2] Phones (Select Multiple)', isMulti: true },
  { key: 'o2_emails', label: '[Owner 2] Emails (Select Multiple)', isMulti: true },

  // Relative 1
  { key: 'r1_fname', label: '[Relative 1] First Name', isMulti: false },
  { key: 'r1_lname', label: '[Relative 1] Last Name', isMulti: false },
  { key: 'r1_mail_address', label: '[Relative 1] Mailing Address', isMulti: false },
  { key: 'r1_mail_city', label: '[Relative 1] Mailing City', isMulti: false },
  { key: 'r1_mail_state', label: '[Relative 1] Mailing State', isMulti: false },
  { key: 'r1_mail_zip', label: '[Relative 1] Mailing Zip', isMulti: false },
  { key: 'r1_phones', label: '[Relative 1] Phones (Select Multiple)', isMulti: true },
  { key: 'r1_emails', label: '[Relative 1] Emails (Select Multiple)', isMulti: true },

  // Relative 2
  { key: 'r2_fname', label: '[Relative 2] First Name', isMulti: false },
  { key: 'r2_lname', label: '[Relative 2] Last Name', isMulti: false },
  { key: 'r2_mail_address', label: '[Relative 2] Mailing Address', isMulti: false },
  { key: 'r2_mail_city', label: '[Relative 2] Mailing City', isMulti: false },
  { key: 'r2_mail_state', label: '[Relative 2] Mailing State', isMulti: false },
  { key: 'r2_mail_zip', label: '[Relative 2] Mailing Zip', isMulti: false },
  { key: 'r2_phones', label: '[Relative 2] Phones (Select Multiple)', isMulti: true },
  { key: 'r2_emails', label: '[Relative 2] Emails (Select Multiple)', isMulti: true },

  // Relative 3
  { key: 'r3_fname', label: '[Relative 3] First Name', isMulti: false },
  { key: 'r3_lname', label: '[Relative 3] Last Name', isMulti: false },
  { key: 'r3_mail_address', label: '[Relative 3] Mailing Address', isMulti: false },
  { key: 'r3_mail_city', label: '[Relative 3] Mailing City', isMulti: false },
  { key: 'r3_mail_state', label: '[Relative 3] Mailing State', isMulti: false },
  { key: 'r3_mail_zip', label: '[Relative 3] Mailing Zip', isMulti: false },
  { key: 'r3_phones', label: '[Relative 3] Phones (Select Multiple)', isMulti: true },
  { key: 'r3_emails', label: '[Relative 3] Emails (Select Multiple)', isMulti: true },

  // Relative 4
  { key: 'r4_fname', label: '[Relative 4] First Name', isMulti: false },
  { key: 'r4_lname', label: '[Relative 4] Last Name', isMulti: false },
  { key: 'r4_mail_address', label: '[Relative 4] Mailing Address', isMulti: false },
  { key: 'r4_mail_city', label: '[Relative 4] Mailing City', isMulti: false },
  { key: 'r4_mail_state', label: '[Relative 4] Mailing State', isMulti: false },
  { key: 'r4_mail_zip', label: '[Relative 4] Mailing Zip', isMulti: false },
  { key: 'r4_phones', label: '[Relative 4] Phones (Select Multiple)', isMulti: true },
  { key: 'r4_emails', label: '[Relative 4] Emails (Select Multiple)', isMulti: true },

  // Relative 5
  { key: 'r5_fname', label: '[Relative 5] First Name', isMulti: false },
  { key: 'r5_lname', label: '[Relative 5] Last Name', isMulti: false },
  { key: 'r5_mail_address', label: '[Relative 5] Mailing Address', isMulti: false },
  { key: 'r5_mail_city', label: '[Relative 5] Mailing City', isMulti: false },
  { key: 'r5_mail_state', label: '[Relative 5] Mailing State', isMulti: false },
  { key: 'r5_mail_zip', label: '[Relative 5] Mailing Zip', isMulti: false },
  { key: 'r5_phones', label: '[Relative 5] Phones (Select Multiple)', isMulti: true },
  { key: 'r5_emails', label: '[Relative 5] Emails (Select Multiple)', isMulti: true },
];

const MultiSelectDropdown = ({ options, selectedValues, onChange }: { options: string[], selectedValues: string[], onChange: (vals: string[]) => void }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (val: string) => {
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter(v => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  return (
    <div className="relative">
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 cursor-pointer flex justify-between items-center hover:border-indigo-500 transition-colors"
      >
        <span className="truncate text-slate-300">
          {selectedValues.length === 0 ? '-- Select Columns --' : 
           selectedValues.length === 1 ? selectedValues[0] : 
           `${selectedValues.length} columns selected`}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 mt-2 w-full bg-slate-800 border border-slate-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar py-2">
            {options.length === 0 ? (
              <div className="px-4 py-2 text-sm text-slate-400">No columns found</div>
            ) : (
              options.map(opt => (
                <div 
                  key={opt} 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(opt);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-700 cursor-pointer transition-colors group"
                >
                  <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedValues.includes(opt) ? 'bg-indigo-500 border-indigo-500' : 'border-slate-500 bg-slate-900 group-hover:border-indigo-400'}`}>
                    {selectedValues.includes(opt) && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                  </div>
                  <span className="text-sm text-slate-200 truncate select-none">{opt}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default function CSVImporter() {
  const router = useRouter();
  
  // Auth & Profile State
  const [profile, setProfile] = useState<any>(null);
  const [companyName, setCompanyName] = useState<string>('');
  const [authLoading, setAuthLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Importer State
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [parsedData, setParsedData] = useState<Record<string, string>[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string[]>>({});
  const [customFields, setCustomFields] = useState<{ key: string, label: string, isMulti: boolean }[]>([]);
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [unmappedHeadersList, setUnmappedHeadersList] = useState<string[]>([]);

  const combinedFields = [...CORE_FIELDS, ...customFields];

  // Auth Hook
  useEffect(() => {
    const authenticateAndFetchProfile = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession();
        if (authError || !session) return router.push('/login');

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`id, full_name, role, company_id, companies (company_name)`)
          .eq('id', session.user.id)
          .single();

        if (profileError) throw profileError;

        setProfile(profileData);
        if (profileData.companies) {
          // @ts-ignore
          setCompanyName(profileData.companies.company_name || 'Unknown Company');
        }
      } catch (error: any) {
        setErrorMsg('Failed to verify workspace credentials.');
      } finally {
        setAuthLoading(false);
      }
    };
    authenticateAndFetchProfile();
  }, [router]);

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg('');
    Papa.parse<Record<string, string>>(selectedFile, {
      header: true, 
      skipEmptyLines: 'greedy', // 'greedy' forces the parser to drop rows that only contain empty commas
      complete: (results) => {
        if (results.meta.fields) {
          setCsvHeaders(results.meta.fields);
          
          // Strict Filter: Destroy any row that doesn't have at least one actual character of data
          const strictValidData = results.data.filter((row) => {
  const hasRealData = Object.values(row).some((val) => {
    if (val === undefined || val === null) return false;
    const cleaned = String(val).trim();
    return cleaned !== '' && cleaned !== ',' && cleaned !== '-';
  });
  return hasRealData;
});

setParsedData(strictValidData);
setFieldMapping({});
setStep(2);
        }
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) {
      if (e.dataTransfer.files[0].type === "text/csv" || e.dataTransfer.files[0].name.endsWith('.csv')) {
        processFile(e.dataTransfer.files[0]);
      } else {
        alert("Please drop a valid .csv file.");
      }
    }
  };

  const handleMappingChange = (targetKey: string, values: string[]) => {
    setFieldMapping((prev) => ({ ...prev, [targetKey]: values }));
  };

  const addCustomField = () => {
    const fieldName = prompt("Enter the name for your custom field:");
    if (!fieldName) return;
    const key = `custom_${fieldName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    setCustomFields(prev => [...prev, { key, label: `[Custom] ${fieldName}`, isMulti: false }]);
  };

  const validateMappingsAndProceed = () => {
    const allMappedColumns = Object.values(fieldMapping).flat();
    const unmapped = csvHeaders.filter(header => !allMappedColumns.includes(header));
    
    if (unmapped.length > 0) {
      setUnmappedHeadersList(unmapped);
      setShowWarningModal(true);
    } else {
      processPreviewData(combinedFields, fieldMapping);
    }
  };

  const autoCreateCustomFieldsForUnmapped = () => {
    const newFields = unmappedHeadersList.map(header => ({
      key: `custom_${header.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      label: `[Custom] ${header}`,
      isMulti: false
    }));
    
    const newMappings: Record<string, string[]> = {};
    newFields.forEach(field => {
      newMappings[field.key] = [field.label.replace('[Custom] ', '')];
    });

    const updatedCustomFields = [...customFields, ...newFields];
    const updatedMappings = { ...fieldMapping, ...newMappings };
    const updatedCombinedFields = [...CORE_FIELDS, ...updatedCustomFields];

    setCustomFields(updatedCustomFields);
    setFieldMapping(updatedMappings);
    
    processPreviewData(updatedCombinedFields, updatedMappings);
  };

  const processPreviewData = (fieldsToUse: typeof combinedFields, mappingsToUse: typeof fieldMapping) => {
    setShowWarningModal(false);
    
    const sanitizedRows = parsedData.map((row) => {
      const cleanRow: Record<string, any> = {};
      
      fieldsToUse.forEach(field => {
        const mappedColumns = mappingsToUse[field.key] || [];
        if (mappedColumns.length === 0) return;

        const rawValues = mappedColumns
          .map(col => row[col])
          .filter(val => val !== undefined && val !== null && String(val).trim() !== '');
        
        if (rawValues.length === 0) return;

        if (field.key.includes('phone')) {
          cleanRow[field.key] = rawValues.map(v => formatPhoneNumber(String(v))).join(', ');
        } else if (field.key.includes('email')) {
          cleanRow[field.key] = rawValues.map(v => String(v).trim().toLowerCase()).join(', ');
        } else if (field.key.includes('date')) {
          cleanRow[field.key] = formatDateDisplay(String(rawValues[0]));
        } else if (field.key.includes('amount') || field.key.includes('bid') || field.key.includes('funds')) {
          cleanRow[field.key] = parseFloat(String(rawValues[0]).replace(/[^0-9.-]+/g, '')) || 0;
        } else {
          cleanRow[field.key] = rawValues.map(v => sanitizeText(String(v))).join(' '); 
        }
      });
      return cleanRow;
    });

    setPreviewData(sanitizedRows);
    setStep(3); 
  };

  /// THE UPGRADED DATABASE INJECTION ENGINE
  const handleFinalImport = async () => {
    setIsUploading(true);
    setErrorMsg('');
    
    try {
      // 1. Sort standard fields, package custom fields into JSONB, and stamp the Company ID
      const finalPayload = previewData.map(row => {
        const formattedRow: any = {
          company_id: profile.company_id,
          custom_fields: {} // Initialize the flexible JSONB bucket
        };

        // Loop through the row and separate standard data from custom data
        Object.entries(row).forEach(([key, value]) => {
          if (key.startsWith('custom_')) {
            // Drop it into the JSONB bucket
            formattedRow.custom_fields[key] = value; 
          } else {
            // Keep it as a standard column
            formattedRow[key] = value; 
          }
        });

        return formattedRow;
      });

      console.log('Final Packaged Payload heading to Supabase:', finalPayload);

      // 2. Fire the properly structured payload into the database
      const { error } = await supabase
        .from('claims')
        .insert(finalPayload);

      if (error) throw error;
      
      // 3. Complete
      setStep(4);
    } catch (err: any) {
      console.error("Import failed:", err);
      setErrorMsg(`Database rejection: ${err.message}`);
      setStep(3); // Kick back to preview if it fails so you can see the error
    } finally {
      setIsUploading(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setFile(null);
    setCsvHeaders([]);
    setParsedData([]);
    setFieldMapping({});
    setCustomFields([]);
    setPreviewData([]);
    setShowWarningModal(false);
    setErrorMsg('');
  };

  const mappedFields = combinedFields.filter(field => fieldMapping[field.key] && fieldMapping[field.key].length > 0);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400">
        <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mb-4"></div>
        <p>Decrypting Workspace...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center overflow-y-auto relative">
      
      {/* Dynamic Header */}
      <header className="w-full bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-900/50 p-2 rounded-lg border border-indigo-500/30">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Tessa CRM Engine</h1>
            <p className="text-xs text-slate-400">{companyName} Workspace</p>
          </div>
        </div>
        <button 
          onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} 
          className="text-slate-400 hover:text-red-400 text-sm font-medium flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </header>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl shadow-amber-900/20">
            <div className="flex items-center gap-3 mb-4 text-amber-500">
              <AlertTriangle className="w-8 h-8" />
              <h2 className="text-xl font-bold">Unmapped Columns Detected</h2>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              You have <strong className="text-white">{unmappedHeadersList.length}</strong> columns in your CSV that are not mapped to any CRM field. If you ignore this, that data will not be imported.
            </p>
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 max-h-32 overflow-y-auto mb-6 text-xs text-slate-400 custom-scrollbar">
              {unmappedHeadersList.join(' • ')}
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={autoCreateCustomFieldsForUnmapped}
                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 rounded-xl transition-colors"
              >
                Auto-Create Custom Fields for Them
              </button>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowWarningModal(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl transition-colors text-sm"
                >
                  Go Back
                </button>
                <button 
                  onClick={() => processPreviewData(combinedFields, fieldMapping)}
                  className="flex-1 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 py-2.5 rounded-xl transition-colors text-sm"
                >
                  Ignore & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-6xl w-full px-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
          Data Import Engine
        </h1>
        <p className="text-slate-400">
          Clean, sanitize, map, and preview records before injecting them into the central database.
        </p>

        {errorMsg && (
          <div className="bg-red-950/50 border border-red-900 rounded-xl p-4 mt-6 flex items-start gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-sm">{errorMsg}</p>
          </div>
        )}
      </div>

      <div className="max-w-6xl w-full mx-8 my-8 flex justify-between items-center bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
          <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500 flex items-center justify-center flex-shrink-0">1</div>
          <span className="hidden sm:inline">Upload CSV</span>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
          <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500 flex items-center justify-center flex-shrink-0">2</div>
          <span className="hidden sm:inline">Map Fields</span>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
          <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500 flex items-center justify-center flex-shrink-0">3</div>
          <span className="hidden sm:inline">Preview Data</span>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
        <div className={`flex items-center gap-2 ${step === 4 ? 'text-indigo-400 font-semibold' : 'text-slate-500'}`}>
          <div className="w-8 h-8 rounded-full bg-indigo-900/50 border border-indigo-500 flex items-center justify-center flex-shrink-0">4</div>
          <span className="hidden sm:inline">Complete</span>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-8 mb-16 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
        {step === 1 && (
  <>
    <div className="border-2 border-dashed border-slate-700 bg-slate-900 rounded-2xl p-8 text-center">
      <input type="file" accept=".csv" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="absolute inset-0 cursor-pointer w-full h-full" />
      
      <Upload className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
      <h3 className="text-xl font-medium text-white">
        {isDragging ? 'Drop Spreadsheet Here' : 'Upload CSV File'}
      </h3>
      <p className="text-slate-400 text-sm mt-1">
        Drag and drop your file here, or click to browse
      </p>
      <div className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-4 py-2 rounded-xl mt-4 inline-block cursor-pointer">
        Select File
      </div>
    </div>

    {/* 2. Your Skip Button (Placed right below the dropzone box) */}
    <div className="mt-4 flex justify-center relative z-50">
      <Link
        href="/dashboard"
        className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition flex items-center gap-2 shadow-md"
      >
        <span>✕ Cancel & Skip to Dashboard</span>
      </Link>
    </div>
  </>
)}

        {step === 2 && (
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
              <div>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                  {file?.name}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{parsedData.length} records detected | Click dropdowns to map columns</p>
              </div>
              <div className="flex gap-4">
                <button onClick={addCustomField} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-950/30 px-3 py-1.5 rounded-lg border border-indigo-900/50 transition-colors">
                  <Plus className="w-3 h-3" /> Add Custom Field
                </button>
                <button onClick={resetWizard} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Start Over
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
              {combinedFields.map((field) => (
                <div key={field.key} className={`flex flex-col bg-slate-950 p-4 rounded-xl border ${field.isMulti ? 'border-indigo-900/40 bg-indigo-950/10' : 'border-slate-800'}`}>
                  <label className="text-xs font-semibold text-slate-400 mb-2 truncate" title={field.label}>
                    {field.label}
                  </label>
                  
                  {field.isMulti ? (
                    <MultiSelectDropdown 
                      options={csvHeaders} 
                      selectedValues={fieldMapping[field.key] || []} 
                      onChange={(vals) => handleMappingChange(field.key, vals)} 
                    />
                  ) : (
                    <select
                      value={fieldMapping[field.key]?.[0] || ''}
                      onChange={(e) => handleMappingChange(field.key, e.target.value ? [e.target.value] : [])}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 w-full"
                    >
                      <option value="">-- Unmapped --</option>
                      {csvHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={validateMappingsAndProceed}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Eye className="w-5 h-5" />
              Verify & Generate Preview
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="w-full">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Review Data Consolidation</h3>
              <p className="text-sm text-slate-400">
                Review your first 5 records below to verify mapping, merged phones, and email links.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-700 rounded-xl mb-8 bg-slate-950 custom-scrollbar">
              <table className="w-full text-sm text-left text-slate-300 whitespace-nowrap">
                <thead className="bg-slate-800 text-slate-400">
                  <tr>
                    {mappedFields.map((field) => (
                      <th key={field.key} className="px-4 py-3 font-medium border-b border-slate-700">
                        {field.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.length > 0 ? (
                    previewData.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/40">
                        {mappedFields.map((field) => (
                          <td key={field.key} className="px-4 py-3">
                            {field.key.includes('email') && row[field.key] ? (
                              <div className="flex gap-2 flex-wrap">
                                {row[field.key].split(', ').map((email: string) => (
                                  <a key={email} href={`mailto:${email}`} className="text-blue-400 hover:text-blue-300 underline">
                                    {email}
                                  </a>
                                ))}
                              </div>
                            ) : (
                              row[field.key] ? row[field.key].toString() : <span className="text-slate-600">-</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={mappedFields.length || 1} className="px-4 py-8 text-center text-slate-500">
                        No valid data could be previewed. Please check your CSV contents.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                disabled={isUploading}
                className="w-1/4 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <button
                onClick={handleFinalImport}
                disabled={isUploading}
                className="w-3/4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Database className="w-5 h-5" />
                {isUploading ? 'Securing Data to Vault...' : `Commit ${parsedData.length} Records to Database`}
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="text-center py-12">
            <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
            <h3 className="text-3xl font-bold text-white mb-3">System Sync Complete</h3>
            <p className="text-slate-400 text-base mb-8 max-w-lg mx-auto">
              {parsedData.length} records have been securely mapped, sanitized, stamped with your Company ID, and structurally secured in the Supabase backend.
            </p>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={resetWizard}
                className="bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600"
              >
                Process Another Export
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-8 py-3 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all text-sm"
              >
                Proceed to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}