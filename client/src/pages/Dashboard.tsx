import { useState } from 'react';
import { BarChart3, BrainCircuit, Menu, Microscope, Sprout } from 'lucide-react';

import { DatasetDashboard } from '@/components/DatasetDashboard';
import { ImageDiagnostics } from '@/components/ImageDiagnostics';
import { ModelPrediction } from '@/components/ModelPrediction';
import { Button } from '@/components/ui/button';
import { DEFAULT_PARSED_DATA } from '@/lib/csvData';
import { type HydroponicImageRecord } from '@/lib/hydroponicMetadata';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'predict' | 'classify'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dataset, setDataset] = useState<HydroponicImageRecord[]>(DEFAULT_PARSED_DATA);
  const [filename, setFilename] = useState('metadata.csv (Default)');

  const menuItems = [
    { id: 'dashboard', label: 'DAV Overview', icon: BarChart3, desc: 'Project, statistics, and findings' },
    { id: 'predict', label: 'Model Evaluation', icon: BrainCircuit, desc: 'Best model, inputs, and metrics' },
    { id: 'classify', label: 'Image Prediction', icon: Microscope, desc: 'Predict deficiency from uploaded image' },
  ] as const;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={cn(
          'flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300',
          isSidebarOpen ? 'w-64' : 'w-[70px]',
        )}
      >
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap text-xl font-bold text-primary">
            <div className="shrink-0 rounded-lg bg-primary/10 p-2">
              <Sprout className="h-6 w-6" />
            </div>
            {isSidebarOpen && <span className="tracking-tight">PlantInsight DAV</span>}
          </div>
        </div>

        <div className="flex-1 space-y-2 px-3 py-6">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'group relative flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors',
                activeTab === item.id
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <item.icon
                className={cn(
                  'h-5 w-5 shrink-0',
                  activeTab === item.id ? 'text-white' : 'text-muted-foreground group-hover:text-foreground',
                )}
              />

              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <div className="text-sm font-medium">{item.label}</div>
                  <div className={cn('text-xs opacity-70', activeTab === item.id ? 'text-white/80' : 'text-muted-foreground')}>
                    {item.desc}
                  </div>
                </div>
              )}

              {!isSidebarOpen && (
                <div className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs text-popover-foreground opacity-0 shadow-md group-hover:opacity-100">
                  {item.label}
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="border-t border-sidebar-border p-4">
          <Button variant="ghost" size="sm" className="w-full" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      <main className="relative flex-1 overflow-auto bg-muted/10">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-8 backdrop-blur">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{menuItems.find((item) => item.id === activeTab)?.label}</h1>
            <p className="text-xs text-muted-foreground">{filename}</p>
          </div>
          <div className="text-sm text-muted-foreground">
            DAV Lab Dashboard: <span className="font-medium text-green-600">Ready</span>
          </div>
        </header>

        <div className="mx-auto max-w-7xl p-8">
          {activeTab === 'dashboard' && (
            <DatasetDashboard
              data={dataset}
              filename={filename}
              onDataChange={setDataset}
              onFilenameChange={setFilename}
            />
          )}
          {activeTab === 'predict' && <ModelPrediction data={dataset} />}
          {activeTab === 'classify' && <ImageDiagnostics data={dataset} />}
        </div>
      </main>
    </div>
  );
}
