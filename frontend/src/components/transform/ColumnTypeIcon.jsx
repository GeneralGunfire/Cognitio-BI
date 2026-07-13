import { CaseSensitive, Hash, Calendar, ToggleLeft } from 'lucide-react';

const ICONS = {
  text: CaseSensitive,
  number: Hash,
  date: Calendar,
  boolean: ToggleLeft,
};

export default function ColumnTypeIcon({ type }) {
  const Icon = ICONS[type] ?? CaseSensitive;
  return <Icon className="h-3.5 w-3.5 flex-shrink-0 text-[#605E5C]" strokeWidth={1.75} />;
}
