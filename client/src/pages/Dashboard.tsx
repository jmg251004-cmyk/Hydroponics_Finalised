
import { useState } from 'react';
import { DatasetDashboard } from "@/components/DatasetDashboard";
import { ModelPrediction } from "@/components/ModelPrediction";
import { BatchImageTraining } from "@/components/BatchImageTraining";
import { ImageDiagnostics } from "@/components/ImageDiagnostics"; // Reusing existing component for 4th option
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Calculator, 
  Layers, 
  ScanLine, 
  Menu,
  Sprout
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'predict' | 'batch' | 'classify'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard', label: 'Dataset Dashboard', icon: LayoutDashboard, desc: 'Upload & Analyze CSV' },
    { id: 'predict', label: 'Manual Prediction', icon: Calculator, desc: 'Single Value Input' },
    { id: 'batch', label: 'Model Training', icon: Layers, desc: 'Batch Image Upload' },
    { id: 'classify', label: 'Image Classifier', icon: ScanLine, desc: 'Diagnostic Tool' },
  ] as const;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Navigation Sidebar */}
      <aside 
        className={cn(
          "bg-sidebar border-r border-sidebar-border transition-all duration-300 flex flex-col",
          isSidebarOpen ? "w-64" : "w-[70px]"
        )}
      >
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2 text-primary font-bold text-xl overflow-hidden whitespace-nowrap">
            <div className="bg-primary/10 p-2 rounded-lg shrink-0">
              <Sprout className="h-6 w-6" />
            </div>
            {isSidebarOpen && <span className="tracking-tight">PhytoDiagnose</span>}
          </div>
        </div>

        <div className="flex-1 py-6 px-3 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors text-left group relative",
                activeTab === item.id 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 shrink-0", activeTab === item.id ? "text-white" : "text-muted-foreground group-hover:text-foreground")} />
              
              {isSidebarOpen && (
                <div className="overflow-hidden">
                  <div className="font-medium text-sm">{item.label}</div>
                  <div className={cn("text-xs opacity-70", activeTab === item.id ? "text-white/80" : "text-muted-foreground")}>
                    {item.desc}
                  </div>
                </div>
              )}

              {!isSidebarOpen && (
                 <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                   {item.label}
                 </div>
              )}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-sidebar-border">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto bg-muted/10 relative">
        <header className="h-16 bg-background/80 backdrop-blur border-b px-8 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-2xl font-bold tracking-tight">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="text-sm text-muted-foreground">
            System Status: <span className="text-green-600 font-medium">Operational</span>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {activeTab === 'dashboard' && <DatasetDashboard />}
          {activeTab === 'predict' && <ModelPrediction />}
          {activeTab === 'batch' && <BatchImageTraining />}
          {activeTab === 'classify' && <ImageDiagnostics />}
        </div>
      </main>
    </div>
  );
}
