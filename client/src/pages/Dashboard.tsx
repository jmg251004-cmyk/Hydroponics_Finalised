
import { useState } from 'react';
import { Sidebar } from "@/components/Sidebar";
import { DataAnalysis } from "@/components/DataAnalysis";
import { ImageDiagnostics } from "@/components/ImageDiagnostics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Image as ImageIcon } from "lucide-react";

// Import background asset
import heroBg from '@assets/generated_images/modern_agricultural_laboratory_background_with_plants_and_data_screens.png';

export default function Dashboard() {
  const [inputs, setInputs] = useState({
    moisture: 65,
    temp: 24,
    ec: 2.5,
    ph: 6.2,
    days: 45
  });

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar inputs={inputs} setInputs={setInputs} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Hero Header */}
        <div className="relative h-48 bg-primary/10 overflow-hidden border-b">
          <div className="absolute inset-0">
             <img src={heroBg} alt="Lab Background" className="w-full h-full object-cover opacity-20 mix-blend-multiply" />
             <div className="absolute inset-0 bg-gradient-to-r from-background/90 to-transparent" />
          </div>
          <div className="relative z-10 h-full flex flex-col justify-center px-8">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Plant Health Diagnostics</h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
              Integrated platform for sensor data analysis and computer vision-based disease detection.
            </p>
          </div>
        </div>

        <div className="p-8 max-w-7xl mx-auto">
          <Tabs defaultValue="data" className="space-y-6">
            <TabsList className="grid w-full max-w-md grid-cols-2 h-12 p-1 bg-muted/50">
              <TabsTrigger value="data" className="flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4" />
                Data Analysis
              </TabsTrigger>
              <TabsTrigger value="image" className="flex items-center gap-2 text-sm">
                <ImageIcon className="h-4 w-4" />
                Image Diagnostics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="outline-none mt-6">
              <DataAnalysis inputs={inputs} />
            </TabsContent>

            <TabsContent value="image" className="outline-none mt-6">
              <ImageDiagnostics />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
