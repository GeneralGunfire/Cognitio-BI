import { useMemo, useState } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PbixFileIcon, LinkFileIcon } from '@/components/MiniIcons';

const MOCK_RECENT_FILES = [
  {
    id: 1,
    name: 'sales_performance_report.pbix',
    location: "C:\\Users\\gwagn\\OneDrive\\Reports\\quarterly_perf_reports\\",
    opened: '16 hours ago',
    Icon: PbixFileIcon,
  },
  {
    id: 2,
    name: 'DQ-CSV-Adam',
    location: 'Power BI › Standby_Deployment_pipeline',
    opened: '6 days ago',
    Icon: LinkFileIcon,
  },
  {
    id: 3,
    name: 'csv-deployment-pipeline',
    location: 'Power BI › Standby_Deployment_pipeline',
    opened: '6 days ago',
    Icon: LinkFileIcon,
  },
];

export default function RecentFilesTable() {
  const [tab, setTab] = useState('recent');
  const [query, setQuery] = useState('');

  const filteredFiles = useMemo(() => {
    if (!query.trim()) return MOCK_RECENT_FILES;
    const q = query.toLowerCase();
    return MOCK_RECENT_FILES.filter((f) => f.name.toLowerCase().includes(q));
  }, [query]);

  return (
    <section>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab('recent')}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium',
              tab === 'recent' ? 'bg-[#323130] text-white' : 'text-[#605E5C] hover:bg-[#F3F2F1]'
            )}
          >
            Recent
          </button>
          <button
            onClick={() => setTab('shared')}
            className={cn(
              'rounded-full px-3 py-1 text-sm font-medium',
              tab === 'shared' ? 'bg-[#323130] text-white' : 'text-[#605E5C] hover:bg-[#F3F2F1]'
            )}
          >
            Shared with me
          </button>
        </div>

        {tab === 'recent' && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-md border border-[#E1DFDD] bg-white px-2.5 py-1.5">
              <Search className="h-3.5 w-3.5 text-[#8A8886]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Filter by keyword"
                className="w-40 text-xs text-[#323130] placeholder:text-[#8A8886] focus:outline-none"
              />
            </div>
            <button className="flex items-center gap-1 rounded-md border border-[#E1DFDD] bg-white px-2.5 py-1.5 text-xs font-medium text-[#323130] hover:bg-[#F3F2F1]">
              Filter
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-[#E1DFDD]">
        {tab === 'shared' ? (
          <div className="flex items-center justify-center py-14 text-sm text-[#605E5C]">
            No items shared with you yet.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#E1DFDD] bg-[#FAF9F8] text-xs text-[#605E5C]">
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Location</th>
                <th className="px-4 py-2 font-medium">Opened</th>
              </tr>
            </thead>
            <tbody>
              {filteredFiles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-[#605E5C]">
                    No files match "{query}".
                  </td>
                </tr>
              ) : (
                filteredFiles.map(({ id, name, location, opened, Icon }) => (
                  <tr key={id} className="border-b border-[#E1DFDD] last:border-b-0 hover:bg-[#FAF9F8]">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2 text-[#323130]">
                        <Icon />
                        {name}
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="select-none text-[#605E5C] blur-[3px]">{location}</span>
                    </td>
                    <td className="px-4 py-2.5 text-[#605E5C]">{opened}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
