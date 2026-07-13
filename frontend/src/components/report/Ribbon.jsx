import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { RibbonButton, RibbonGroup } from '@/components/report/RibbonButton';
import {
  Clipboard,
  Scissors,
  Copy,
  Paintbrush,
  Database,
  FileSpreadsheet,
  Cloud,
  Server,
  Keyboard,
  Boxes,
  History,
  RefreshCw,
  Wand2,
  Type,
  BarChart3,
  LineChart,
  PieChart,
  Table,
  MoreHorizontal,
  Sigma,
  Calculator,
  ShieldCheck,
  UploadCloud,
  Sparkles,
  FileCog,
} from 'lucide-react';

const TABS = ['File', 'Home', 'Insert', 'Modeling', 'View', 'Optimize', 'Help', 'External tools'];

function HomeRibbonContent({ onTransformData }) {
  return (
    <div className="flex h-[92px] items-stretch overflow-x-auto">
      <RibbonGroup caption="Clipboard">
        <RibbonButton icon={Clipboard} label="Paste" large />
        <div className="flex flex-col gap-0.5">
          <RibbonButton icon={Scissors} label="Cut" />
          <RibbonButton icon={Copy} label="Copy" />
        </div>
        <RibbonButton icon={Paintbrush} label="Format painter" />
      </RibbonGroup>

      <RibbonGroup caption="Data">
        <RibbonButton icon={Database} label="Get data" large />
        <RibbonButton icon={FileSpreadsheet} label="Excel workbook" />
        <RibbonButton icon={Cloud} label="OneLake catalog" />
        <RibbonButton icon={Server} label="SQL Server" />
        <RibbonButton icon={Keyboard} label="Enter data" />
        <RibbonButton icon={Boxes} label="Dataverse" />
        <RibbonButton icon={History} label="Recent sources" />
      </RibbonGroup>

      <RibbonGroup caption="Queries">
        <RibbonButton icon={Wand2} label="Transform data" large onClick={onTransformData} />
        <RibbonButton icon={RefreshCw} label="Refresh" />
      </RibbonGroup>

      <RibbonGroup caption="Insert">
        <RibbonButton icon={BarChart3} label="New visual" large />
        <div className="grid grid-cols-2 gap-0.5">
          <button className="flex h-5 w-5 items-center justify-center rounded hover:bg-[#E8E6E4]">
            <BarChart3 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button className="flex h-5 w-5 items-center justify-center rounded hover:bg-[#E8E6E4]">
            <LineChart className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button className="flex h-5 w-5 items-center justify-center rounded hover:bg-[#E8E6E4]">
            <PieChart className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button className="flex h-5 w-5 items-center justify-center rounded hover:bg-[#E8E6E4]">
            <Table className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </div>
        <RibbonButton icon={Type} label="Text box" />
        <RibbonButton icon={MoreHorizontal} label="More visuals" />
      </RibbonGroup>

      <RibbonGroup caption="Calculations">
        <RibbonButton icon={BarChart3} label="New visual calculation" large />
        <RibbonButton icon={Sigma} label="New measure" />
        <RibbonButton icon={Calculator} label="Quick measure" />
      </RibbonGroup>

      <RibbonGroup caption="Sensitivity">
        <RibbonButton icon={ShieldCheck} label="Sensitivity" large />
      </RibbonGroup>

      <RibbonGroup caption="Share">
        <RibbonButton icon={UploadCloud} label="Publish" large />
      </RibbonGroup>

      <RibbonGroup caption="Copilot" className="border-r-0">
        <RibbonButton icon={FileCog} label="Prep data for AI" />
        <RibbonButton icon={Sparkles} label="Copilot" large />
      </RibbonGroup>
    </div>
  );
}

function PlaceholderRibbonContent({ tabName }) {
  return (
    <div className="flex h-[92px] items-center px-6 text-sm text-[#8A8886]">
      {tabName} commands coming soon.
    </div>
  );
}

export default function Ribbon({ datasetId }) {
  const [activeTab, setActiveTab] = useState('Home');
  const navigate = useNavigate();

  const handleTransformData = () => {
    if (datasetId && datasetId !== 'new') navigate(`/transform/${datasetId}`);
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
      {activeTab === 'Home' ? (
        <HomeRibbonContent onTransformData={handleTransformData} />
      ) : (
        <PlaceholderRibbonContent tabName={activeTab} />
      )}
    </div>
  );
}
