import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BlankReportIcon,
  OneLakeIcon,
  ExcelIcon,
  SqlServerIcon,
  SampleDataIcon,
  OtherSourcesIcon,
} from '@/components/DataSourceIcons';

const SOURCES = [
  { key: 'blank', label: 'Blank report', Icon: BlankReportIcon },
  { key: 'onelake', label: 'OneLake data hub', Icon: OneLakeIcon },
  { key: 'excel', label: 'Excel workbook', Icon: ExcelIcon },
  { key: 'sql', label: 'SQL Server', Icon: SqlServerIcon },
  { key: 'sample', label: 'Learn with sample data', Icon: SampleDataIcon },
  { key: 'other', label: 'Get data from other sources', Icon: OtherSourcesIcon },
];

export default function DataSourceCards({ onExcelWorkbook }) {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const handleSourceClick = (key) => {
    if (key === 'blank') navigate('/report/new');
    if (key === 'excel') onExcelWorkbook?.();
  };

  return (
    <section>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-medium text-[#323130]"
      >
        <ChevronDown
          className={`h-4 w-4 text-[#605E5C] transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
        />
        Select a data source or start with a blank report
      </button>

      <div
        className={`grid overflow-hidden transition-all duration-200 ${
          open ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="flex flex-wrap gap-4 overflow-hidden">
          {SOURCES.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => handleSourceClick(key)}
              className="flex h-[100px] w-[120px] flex-col items-center justify-center gap-2 rounded-md border border-[#E1DFDD] bg-white px-2 text-center shadow-sm transition-shadow hover:shadow-md"
            >
              <Icon />
              <span className="text-xs leading-tight text-[#323130]">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
