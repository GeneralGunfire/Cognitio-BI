export function RibbonButton({ icon: Icon, label, large = false, disabled = false, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="flex flex-col items-center justify-start gap-0.5 rounded px-1.5 py-1 text-[11px] leading-tight text-[#323130] hover:bg-[#E8E6E4] disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
      style={{ width: large ? 56 : 44 }}
    >
      <Icon className={large ? 'h-6 w-6' : 'h-4 w-4'} strokeWidth={1.5} />
      <span className="text-center">{label}</span>
    </button>
  );
}

export function RibbonGroup({ caption, children, className = '' }) {
  return (
    <div className={`flex h-full flex-col justify-between border-r border-[#E1DFDD] px-2 pt-1 pb-0.5 ${className}`}>
      <div className="flex flex-1 items-start gap-0.5">{children}</div>
      <div className="pt-1 text-center text-[10px] text-[#605E5C]">{caption}</div>
    </div>
  );
}
