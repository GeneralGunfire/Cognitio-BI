import { Eye, ChevronsUpDown, Search } from 'lucide-react';

function FilterDropTarget({ label }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-[#323130]">{label}</span>
      <div className="rounded border border-dashed border-[#D0D0D0] bg-[#FAFAFA] px-3 py-3 text-center text-[11px] text-[#8A8886]">
        Add data fields here
      </div>
    </div>
  );
}

export default function FiltersPane() {
  return (
    <div className="flex flex-shrink-0 flex-col border-b border-[#E1DFDD] bg-white">
      <div className="flex items-center justify-between border-b border-[#E1DFDD] px-3 py-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-[#323130]">
          <Eye className="h-4 w-4 text-[#605E5C]" strokeWidth={1.5} />
          Filters
        </div>
        <ChevronsUpDown className="h-3.5 w-3.5 text-[#605E5C]" strokeWidth={1.5} />
      </div>

      <div className="flex items-center gap-2 border-b border-[#E1DFDD] px-3 py-2">
        <Search className="h-3.5 w-3.5 text-[#8A8886]" />
        <input
          placeholder="Search"
          className="w-full text-xs text-[#323130] placeholder:text-[#8A8886] focus:outline-none"
        />
      </div>

      <div className="flex flex-col gap-4 px-3 py-3">
        <FilterDropTarget label="Filters on this page" />
        <FilterDropTarget label="Filters on all pages" />
      </div>
    </div>
  );
}
