export default function StatusBar({ rowCount, columnCount }) {
  return (
    <div className="flex h-6 flex-shrink-0 items-center gap-4 border-t border-[#E1DFDD] bg-[#FAFAFA] px-3 text-[11px] text-[#605E5C]">
      <span>{rowCount.toLocaleString()} rows</span>
      <span>{columnCount.toLocaleString()} columns</span>
    </div>
  );
}
