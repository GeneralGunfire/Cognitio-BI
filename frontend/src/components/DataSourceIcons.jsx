export function BlankReportIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="7" y="3" width="18" height="26" rx="2" fill="#FFFFFF" stroke="#E8B339" strokeWidth="1.5" />
      <path d="M7 3 L25 3 L25 29 L7 29 Z" fill="none" />
      <rect x="10" y="9" width="12" height="1.6" rx="0.8" fill="#F2C811" />
      <rect x="10" y="14" width="12" height="1.6" rx="0.8" fill="#F2C811" />
      <rect x="10" y="19" width="8" height="1.6" rx="0.8" fill="#F2C811" />
    </svg>
  );
}

export function OneLakeIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="onelake-grad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#37B6E9" />
          <stop offset="100%" stopColor="#1B5FBF" />
        </linearGradient>
      </defs>
      <path
        d="M8 20c-2.8 0-5-2-5-4.6 0-2.3 1.7-4.2 4-4.5.5-3 3.1-5.2 6.2-5.2 2.3 0 4.3 1.2 5.4 3 .5-.2 1-.3 1.6-.3 2.6 0 4.8 2 4.8 4.6 0 .3 0 .6-.1.8 1.8.4 3.1 2 3.1 3.9 0 2.2-1.9 4-4.2 4H8z"
        fill="url(#onelake-grad)"
      />
    </svg>
  );
}

export function ExcelIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="4" y="3" width="24" height="26" rx="2" fill="#107C41" />
      <rect x="4" y="3" width="13" height="26" rx="2" fill="#0F7B3F" />
      <path d="M8 10l3 5-3 5h2.6l1.9-3.4 1.9 3.4H17l-3-5 3-5h-2.6l-1.9 3.3L10.6 10H8z" fill="#FFFFFF" />
    </svg>
  );
}

export function SqlServerIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id="sql-grad" x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#E23B4E" />
          <stop offset="100%" stopColor="#1A6FC4" />
        </linearGradient>
      </defs>
      <ellipse cx="16" cy="8" rx="11" ry="4.2" fill="url(#sql-grad)" />
      <path d="M5 8v16c0 2.3 4.9 4.2 11 4.2s11-1.9 11-4.2V8" stroke="url(#sql-grad)" strokeWidth="2" fill="none" />
      <path d="M5 14.7c0 2.3 4.9 4.2 11 4.2s11-1.9 11-4.2" stroke="url(#sql-grad)" strokeWidth="2" fill="none" />
      <path d="M5 21.3c0 2.3 4.9 4.2 11 4.2s11-1.9 11-4.2" stroke="url(#sql-grad)" strokeWidth="2" fill="none" />
    </svg>
  );
}

export function SampleDataIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="5" y="4" width="15" height="20" rx="1.5" fill="#FFFFFF" stroke="#C8C6C4" strokeWidth="1.2" />
      <rect x="7.5" y="8" width="10" height="1.3" rx="0.6" fill="#C8C6C4" />
      <rect x="7.5" y="11" width="10" height="1.3" rx="0.6" fill="#C8C6C4" />
      <rect x="15" y="14" width="12" height="14" rx="1.5" fill="#FFFFFF" stroke="#E1DFDD" strokeWidth="1.2" />
      <rect x="17.5" y="24" width="1.8" height="4" fill="#F2C811" />
      <rect x="20.3" y="21" width="1.8" height="7" fill="#0F8564" />
      <rect x="23.1" y="18" width="1.8" height="10" fill="#1A6FC4" />
    </svg>
  );
}

export function OtherSourcesIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="12" fill="none" stroke="#8A8886" strokeWidth="1.5" />
      <path d="M16 10v12M10 16h12" stroke="#8A8886" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
