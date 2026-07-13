import { useState, useRef } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { GettingStartedThumb, BarChartThumb } from '@/components/MiniIcons';

const RECOMMENDED = [
  { key: 'getting-started', title: 'Intro—What is Power BI?', Thumb: GettingStartedThumb },
  { key: 'modified', title: 'DQ-CSV-Adam', Thumb: BarChartThumb },
  { key: 'viewed', title: 'csv-deployment-pipeline', Thumb: BarChartThumb },
  { key: 'recent', title: 'Game Revenue', Thumb: BarChartThumb },
];

export default function RecommendedSection() {
  const [open, setOpen] = useState(true);
  const scrollRef = useRef(null);

  const scrollBy = (delta) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section>
      <div className="flex items-center justify-between">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-medium text-[#323130]"
        >
          <ChevronDown
            className={`h-4 w-4 text-[#605E5C] transition-transform duration-200 ${open ? '' : '-rotate-90'}`}
          />
          Recommended
        </button>
        {open && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => scrollBy(-260)}
              className="flex h-6 w-6 items-center justify-center rounded text-[#605E5C] hover:bg-[#F3F2F1]"
              aria-label="Scroll left"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => scrollBy(260)}
              className="flex h-6 w-6 items-center justify-center rounded text-[#605E5C] hover:bg-[#F3F2F1]"
              aria-label="Scroll right"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div
        className={`grid overflow-hidden transition-all duration-200 ${
          open ? 'mt-3 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div ref={scrollRef} className="flex gap-4 overflow-x-auto overflow-hidden">
          {RECOMMENDED.map(({ key, title, Thumb }) => (
            <button
              key={key}
              className="flex w-56 flex-shrink-0 flex-col overflow-hidden rounded-md border border-[#E1DFDD] bg-white text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="h-28 bg-[#F3F2F1]">
                <Thumb />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-2.5">
                <span className="truncate text-sm text-[#323130]">{title}</span>
                <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-[#605E5C]" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
