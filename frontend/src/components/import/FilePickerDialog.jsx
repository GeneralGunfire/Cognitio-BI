import { useRef, useState } from 'react';
import { UploadCloud, X, Loader2 } from 'lucide-react';

export default function FilePickerDialog({ open, loading, onFileSelected, onClose }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  if (!open) return null;

  const handleFiles = (files) => {
    const file = files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40">
      <div className="w-[480px] rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#E1DFDD] px-5 py-3">
          <h2 className="text-sm font-semibold text-[#323130]">Import from Excel/CSV</h2>
          <button onClick={onClose} className="text-[#605E5C] hover:text-[#323130]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-[#D0D0D0] py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#0F8564]" />
              <p className="text-sm text-[#605E5C]">Reading file...</p>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFiles(e.dataTransfer.files);
              }}
              className={`flex flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed py-16 transition-colors ${
                dragOver ? 'border-[#0F8564] bg-[#E6F4EA]' : 'border-[#D0D0D0]'
              }`}
            >
              <UploadCloud className="h-8 w-8 text-[#605E5C]" strokeWidth={1.5} />
              <p className="text-sm text-[#323130]">Drag and drop a file here</p>
              <p className="text-xs text-[#8A8886]">or</p>
              <button
                onClick={() => inputRef.current?.click()}
                className="rounded-md border border-[#E1DFDD] bg-white px-4 py-1.5 text-sm font-medium text-[#323130] hover:bg-[#F3F2F1]"
              >
                Browse files
              </button>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
