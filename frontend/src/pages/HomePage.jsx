import { useState } from 'react';
import DataSourceCards from '@/components/DataSourceCards';
import RecommendedSection from '@/components/RecommendedSection';
import RecentFilesTable from '@/components/RecentFilesTable';
import ExcelImportFlow from '@/components/import/ExcelImportFlow';

export default function HomePage() {
  const [importOpen, setImportOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8 px-8 py-6">
      <DataSourceCards onExcelWorkbook={() => setImportOpen(true)} />
      <RecommendedSection />
      <RecentFilesTable />
      <ExcelImportFlow open={importOpen} onClose={() => setImportOpen(false)} />
    </div>
  );
}
