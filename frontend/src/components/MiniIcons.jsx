export function GettingStartedThumb() {
  return (
    <div className="flex h-full w-full items-center justify-center gap-2">
      <svg width="20" height="20" viewBox="0 0 20 20">
        <rect x="2" y="10" width="3" height="8" fill="#1A6FC4" />
        <rect x="7" y="6" width="3" height="12" fill="#F2C811" />
        <rect x="12" y="2" width="3" height="16" fill="#0F8564" />
      </svg>
      <svg width="18" height="18" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" fill="none" stroke="#E1DFDD" strokeWidth="2" />
        <path d="M10 2a8 8 0 0 1 6 13.3L10 10z" fill="#E8B339" />
      </svg>
      <svg width="18" height="18" viewBox="0 0 20 20">
        <path d="M2 3h16l-6 8v6l-4 2v-8z" fill="#8A8886" />
      </svg>
    </div>
  );
}

export function BarChartThumb() {
  return (
    <div className="flex h-full w-full items-end justify-center gap-1.5 pb-4">
      <div className="h-6 w-2.5 rounded-t bg-[#1A6FC4]" />
      <div className="h-10 w-2.5 rounded-t bg-[#F2C811]" />
      <div className="h-8 w-2.5 rounded-t bg-[#0F8564]" />
      <div className="h-12 w-2.5 rounded-t bg-[#E23B4E]" />
    </div>
  );
}

export function PbixFileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" className="flex-shrink-0">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="#F2C811" />
      <rect x="5.5" y="11" width="2" height="5" fill="#323130" />
      <rect x="9" y="7" width="2" height="9" fill="#323130" />
      <rect x="12.5" y="9" width="2" height="7" fill="#323130" />
    </svg>
  );
}

export function LinkFileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" className="flex-shrink-0">
      <path
        d="M8 12l4-4m-5 5l-2 2a2.8 2.8 0 0 1-4-4l3-3a2.8 2.8 0 0 1 4 0M12 8l2-2a2.8 2.8 0 0 1 4 4l-3 3a2.8 2.8 0 0 1-4 0"
        fill="none"
        stroke="#605E5C"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
