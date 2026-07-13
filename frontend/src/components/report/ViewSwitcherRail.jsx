import { useState } from 'react';
import { BarChart3, Table2, Share2, Bookmark, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIEWS = [
  { key: 'report', label: 'Report view', icon: BarChart3 },
  { key: 'data', label: 'Table view', icon: Table2 },
  { key: 'model', label: 'Model view', icon: Share2 },
  { key: 'bookmarks', label: 'Bookmarks', icon: Bookmark },
  { key: 'layers', label: 'Layers', icon: Layers },
];

export default function ViewSwitcherRail() {
  const [active, setActive] = useState('report');

  return (
    <div className="flex w-11 flex-shrink-0 flex-col items-center gap-1 border-r border-[#E1DFDD] bg-[#FAFAFA] py-2">
      {VIEWS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => setActive(key)}
          title={label}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded text-[#605E5C] hover:bg-[#E8E6E4]',
            active === key && 'bg-[#E1DFDD] text-[#0F8564]'
          )}
        >
          <Icon className="h-4.5 w-4.5" strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}
