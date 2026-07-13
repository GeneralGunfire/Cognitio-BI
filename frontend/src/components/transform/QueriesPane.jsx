import { Table2 } from 'lucide-react';

export default function QueriesPane({ datasetName }) {
  return (
    <div className="flex w-[200px] flex-shrink-0 flex-col border-r border-[#E1DFDD] bg-[#FAFAFA]">
      <div className="border-b border-[#E1DFDD] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#605E5C]">
        Queries
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2 bg-[#EFF6FC] px-3 py-2 text-sm text-[#323130]">
          <Table2 className="h-4 w-4 flex-shrink-0 text-[#605E5C]" strokeWidth={1.5} />
          <span className="truncate">{datasetName}</span>
        </div>
      </div>
    </div>
  );
}
