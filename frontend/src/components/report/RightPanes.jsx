import FiltersPane from '@/components/report/FiltersPane';
import BuildPane from '@/components/report/BuildPane';

export default function RightPanes({ selectedVisual, onChangeType, onRemoveField }) {
  return (
    <div className="flex w-64 flex-shrink-0 flex-col border-l border-[#E1DFDD]">
      <FiltersPane />
      <div className="flex min-h-0 flex-1 flex-col">
        <BuildPane selectedVisual={selectedVisual} onChangeType={onChangeType} onRemoveField={onRemoveField} />
      </div>
    </div>
  );
}
