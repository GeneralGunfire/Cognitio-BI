import { useState } from 'react';
import { cn } from '@/lib/utils';
import { RibbonButton, RibbonGroup } from '@/components/report/RibbonButton';
import {
  LogOut,
  RefreshCw,
  Copy,
  GitBranch,
  Columns3,
  Trash2,
  ListFilter,
  ListChecks,
  ArrowUpAZ,
  ArrowDownAZ,
  ToggleLeft,
  Rows3,
  FlipHorizontal2,
  GitMerge,
  GitCommitHorizontal,
  TextCursorInput,
  SplitSquareHorizontal,
  Group,
  Grid2x2,
  Replace,
  Search,
  PlusSquare,
  GitFork,
  Beaker,
  Hash,
  Calendar,
  Type,
  Eye,
  ListTree,
  BarChart2,
} from 'lucide-react';

const TABS = ['File', 'Home', 'Transform', 'Add Column', 'View'];

function DisabledButton({ icon, label }) {
  return (
    <div title="Not yet supported">
      <RibbonButton icon={icon} label={label} disabled />
    </div>
  );
}

// Wraps a column-dependent RibbonButton: disabled + explanatory tooltip when
// no column is selected, otherwise behaves like a normal enabled button.
function ColumnScopedButton({ icon, label, large, hasColumnSelected, onClick }) {
  return (
    <div title={hasColumnSelected ? undefined : 'Select a column first'}>
      <RibbonButton icon={icon} label={label} large={large} disabled={!hasColumnSelected} onClick={onClick} />
    </div>
  );
}

function HomeTab({ onAction, hasColumnSelected }) {
  return (
    <div className="flex h-[92px] items-stretch overflow-x-auto">
      <RibbonGroup caption="Close">
        <button
          onClick={() => onAction('close_and_load')}
          className="flex h-full flex-col items-center justify-center gap-1 rounded px-3 text-xs font-semibold text-[#323130] hover:bg-[#E8E6E4]"
        >
          <LogOut className="h-6 w-6" strokeWidth={1.5} />
          Close &amp; Load
        </button>
      </RibbonGroup>

      <RibbonGroup caption="Query">
        <DisabledButton icon={RefreshCw} label="Refresh" />
        <DisabledButton icon={Copy} label="Duplicate" />
        <DisabledButton icon={GitBranch} label="Reference" />
      </RibbonGroup>

      <RibbonGroup caption="Manage Columns">
        <DisabledButton icon={Columns3} label="Choose Columns" />
        <ColumnScopedButton
          icon={Trash2}
          label="Remove Columns"
          large
          hasColumnSelected={hasColumnSelected}
          onClick={() => onAction('remove_column')}
        />
      </RibbonGroup>

      <RibbonGroup caption="Reduce Rows">
        <RibbonButton icon={ListFilter} label="Remove Rows" onClick={() => onAction('filter_rows')} />
        <DisabledButton icon={ListChecks} label="Keep Rows" />
      </RibbonGroup>

      <RibbonGroup caption="Sort">
        <DisabledButton icon={ArrowUpAZ} label="Sort Ascending" />
        <DisabledButton icon={ArrowDownAZ} label="Sort Descending" />
      </RibbonGroup>

      <RibbonGroup caption="Transform">
        <ColumnScopedButton
          icon={ToggleLeft}
          label="Data Type"
          large
          hasColumnSelected={hasColumnSelected}
          onClick={() => onAction('change_type')}
        />
        <DisabledButton icon={Rows3} label="Use First Row as Headers" />
        <DisabledButton icon={FlipHorizontal2} label="Transpose" />
      </RibbonGroup>

      <RibbonGroup caption="Combine" className="border-r-0">
        <DisabledButton icon={GitMerge} label="Merge Queries" />
        <DisabledButton icon={GitCommitHorizontal} label="Append Queries" />
      </RibbonGroup>
    </div>
  );
}

function TransformTab({ onAction, hasColumnSelected }) {
  return (
    <div className="flex h-[92px] items-stretch overflow-x-auto">
      <RibbonGroup caption="Text Column">
        <ColumnScopedButton
          icon={TextCursorInput}
          label="Rename"
          hasColumnSelected={hasColumnSelected}
          onClick={() => onAction('rename_column')}
        />
        <ColumnScopedButton
          icon={SplitSquareHorizontal}
          label="Split Column"
          hasColumnSelected={hasColumnSelected}
          onClick={() => onAction('split_column')}
        />
        <ColumnScopedButton
          icon={Beaker}
          label="Trim / Case"
          hasColumnSelected={hasColumnSelected}
          onClick={() => onAction('trim_text')}
        />
      </RibbonGroup>

      <RibbonGroup caption="Any Column">
        <ColumnScopedButton
          icon={ToggleLeft}
          label="Data Type"
          large
          hasColumnSelected={hasColumnSelected}
          onClick={() => onAction('change_type')}
        />
        <RibbonButton icon={Copy} label="Remove Duplicates" onClick={() => onAction('remove_duplicates')} />
        <ColumnScopedButton
          icon={Search}
          label="Fill Down"
          hasColumnSelected={hasColumnSelected}
          onClick={() => onAction('fill_down')}
        />
      </RibbonGroup>

      <RibbonGroup caption="Structured">
        <DisabledButton icon={Group} label="Group By" />
        <DisabledButton icon={Grid2x2} label="Pivot Column" />
        <DisabledButton icon={Grid2x2} label="Unpivot Columns" />
      </RibbonGroup>

      <RibbonGroup caption="Values" className="border-r-0">
        <DisabledButton icon={Replace} label="Replace Values" />
      </RibbonGroup>
    </div>
  );
}

function AddColumnTab({ onStartCustomColumn }) {
  return (
    <div className="flex h-[92px] items-stretch overflow-x-auto">
      <RibbonGroup caption="General">
        <RibbonButton icon={PlusSquare} label="Custom Column" large onClick={onStartCustomColumn} />
        <DisabledButton icon={GitFork} label="Conditional Column" />
        <DisabledButton icon={ListTree} label="Column from Examples" />
      </RibbonGroup>
      <RibbonGroup caption="From Number" className="border-r-0">
        <DisabledButton icon={Hash} label="From Number" />
        <DisabledButton icon={Calendar} label="From Date" />
        <DisabledButton icon={Type} label="From Text" />
      </RibbonGroup>
    </div>
  );
}

function ViewTab({ formulaBarVisible, onToggleFormulaBar }) {
  return (
    <div className="flex h-[92px] items-stretch overflow-x-auto">
      <RibbonGroup caption="Layout">
        <button
          onClick={onToggleFormulaBar}
          className={cn(
            'flex h-full flex-col items-center justify-center gap-1 rounded px-3 text-xs text-[#323130] hover:bg-[#E8E6E4]',
            formulaBarVisible && 'bg-[#E1DFDD]'
          )}
        >
          <Eye className="h-5 w-5" strokeWidth={1.5} />
          Formula Bar
        </button>
      </RibbonGroup>
      <RibbonGroup caption="Data Preview" className="border-r-0">
        <DisabledButton icon={BarChart2} label="Column Distribution" />
      </RibbonGroup>
    </div>
  );
}

export default function TransformRibbon({
  onAction,
  formulaBarVisible,
  onToggleFormulaBar,
  hasColumnSelected,
  onStartCustomColumn,
}) {
  const [activeTab, setActiveTab] = useState('Home');

  const renderTab = () => {
    switch (activeTab) {
      case 'Home':
        return <HomeTab onAction={onAction} hasColumnSelected={hasColumnSelected} />;
      case 'Transform':
        return <TransformTab onAction={onAction} hasColumnSelected={hasColumnSelected} />;
      case 'Add Column':
        return <AddColumnTab onStartCustomColumn={onStartCustomColumn} />;
      case 'View':
        return <ViewTab formulaBarVisible={formulaBarVisible} onToggleFormulaBar={onToggleFormulaBar} />;
      default:
        return (
          <div className="flex h-[92px] items-center px-6 text-sm text-[#8A8886]">
            {activeTab} commands coming soon.
          </div>
        );
    }
  };

  return (
    <div className="flex-shrink-0 border-b border-[#E1DFDD] bg-[#F3F2F1]">
      <div className="flex items-center gap-1 px-3 pt-1.5">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'border-b-2 border-transparent px-2.5 py-1.5 text-sm text-[#323130] hover:bg-[#E8E6E4]',
              activeTab === tab && 'border-[#0F8564] font-semibold'
            )}
          >
            {tab}
          </button>
        ))}
      </div>
      {renderTab()}
    </div>
  );
}
