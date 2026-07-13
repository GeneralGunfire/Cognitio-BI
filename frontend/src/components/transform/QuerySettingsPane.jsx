import AppliedStepsList from '@/components/transform/AppliedStepsList';

export default function QuerySettingsPane({
  datasetName,
  steps,
  selectedStepId,
  onSelectStep,
  onEditStep,
  onDeleteStep,
  onMoveStep,
}) {
  return (
    <div className="flex w-[280px] flex-shrink-0 flex-col overflow-y-auto border-l border-[#E1DFDD] bg-white">
      <div className="border-b border-[#E1DFDD] px-3 py-2 text-sm font-semibold text-[#323130]">
        Query Settings
      </div>

      <div className="border-b border-[#E1DFDD] px-3 py-3">
        <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-[#605E5C]">Properties</p>
        <label className="flex flex-col gap-1 text-xs text-[#323130]">
          Name
          <input
            value={datasetName}
            readOnly
            title="Renaming datasets isn't supported by the backend yet — this field is read-only."
            className="cursor-not-allowed rounded border border-[#E1DFDD] bg-[#FAFAFA] px-2 py-1 text-sm text-[#605E5C]"
          />
        </label>
      </div>

      <div className="flex-1 px-2 py-3">
        <p className="mb-1.5 px-1 text-xs font-bold uppercase tracking-wide text-[#605E5C]">Applied Steps</p>
        <AppliedStepsList
          steps={steps}
          selectedStepId={selectedStepId}
          onSelect={onSelectStep}
          onEdit={onEditStep}
          onDelete={onDeleteStep}
          onMove={onMoveStep}
        />
      </div>
    </div>
  );
}
