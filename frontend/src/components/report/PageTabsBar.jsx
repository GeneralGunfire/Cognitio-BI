import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Minus, Maximize } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PageTabsBar() {
  const [pages, setPages] = useState(['Page 1']);
  const [activePage, setActivePage] = useState('Page 1');
  const [zoom, setZoom] = useState(110);

  const addPage = () => {
    const name = `Page ${pages.length + 1}`;
    setPages((prev) => [...prev, name]);
    setActivePage(name);
  };

  return (
    <div className="flex h-8 flex-shrink-0 items-center justify-between border-t border-[#E1DFDD] bg-white px-2 text-xs text-[#605E5C]">
      <div className="flex items-center gap-1">
        <span>Page 1 of {pages.length}</span>
      </div>

      <div className="flex items-center gap-1">
        <button className="flex h-6 w-6 items-center justify-center rounded text-[#605E5C] hover:bg-[#F3F2F1]">
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setActivePage(page)}
            className={cn(
              'border-b-2 border-transparent px-3 py-1.5 text-xs',
              activePage === page && 'border-[#0F8564] font-semibold text-[#323130]'
            )}
          >
            {page}
          </button>
        ))}
        <button className="flex h-6 w-6 items-center justify-center rounded text-[#605E5C] hover:bg-[#F3F2F1]">
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={addPage}
          title="Add page"
          className="flex h-6 w-6 items-center justify-center rounded text-[#0F8564] hover:bg-[#F3F2F1]"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setZoom((z) => Math.max(25, z - 10))}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-[#F3F2F1]"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="w-9 text-center">{zoom}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(400, z + 10))}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-[#F3F2F1]"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <Maximize className="h-3.5 w-3.5" strokeWidth={1.5} />
      </div>
    </div>
  );
}
