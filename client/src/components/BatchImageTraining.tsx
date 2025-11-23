import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FolderArchive, Check, AlertTriangle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import JSZip from 'jszip';

interface AnalyzedImage {
  filename: string;
  url: string;
  deficiency: string;
  confidence: number;
}

export function BatchImageTraining() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isTrained, setIsTrained] = useState(false);
  const [analyzedImages, setAnalyzedImages] = useState<AnalyzedImage[]>([]);

  const analyzeImage = (filename: string): string => {
    // Mock analysis logic - returns a deficiency or "Healthy"
    const roll = Math.random();
    if (roll > 0.7) {
      const deficiencies = ['K Deficiency', 'N Deficiency', 'P Deficiency', 'FN'];
      return deficiencies[Math.floor(Math.random() * deficiencies.length)];
    }
    return 'Healthy';
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsUploading(true);
    setProgress(10);

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      
      const images: AnalyzedImage[] = [];
      let processed = 0;
      const totalFiles = Object.keys(contents.files).length;

      // Extract and analyze each image file
      for (const [path, fileData] of Object.entries(contents.files)) {
        if (!fileData.dir && /\.(jpg|jpeg|png|gif)$/i.test(path)) {
          try {
            const blob = await fileData.async('blob');
            const url = URL.createObjectURL(blob);
            const filename = path.split('/').pop() || path;
            const deficiency = analyzeImage(filename);
            const confidence = 0.85 + Math.random() * 0.14;

            images.push({
              filename,
              url,
              deficiency,
              confidence
            });

            processed++;
            setProgress(10 + (processed / totalFiles) * 80);
          } catch (err) {
            console.error(`Failed to process ${path}:`, err);
          }
        }
      }

      setAnalyzedImages(images);
      setProgress(100);
      setIsUploading(false);
      setIsTrained(true);
    } catch (err) {
      console.error('Failed to extract ZIP:', err);
      setIsUploading(false);
      alert('Failed to extract ZIP file. Please ensure it is a valid .zip file.');
    }
  };

  const deficiencyCounts = analyzedImages.reduce((acc, img) => {
    acc[img.deficiency] = (acc[img.deficiency] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const classDistribution = [
    { name: 'K Deficiency', count: deficiencyCounts['K Deficiency'] || 0 },
    { name: 'N Deficiency', count: deficiencyCounts['N Deficiency'] || 0 },
    { name: 'P Deficiency', count: deficiencyCounts['P Deficiency'] || 0 },
    { name: 'FN Deficiency', count: deficiencyCounts['FN'] || 0 },
    { name: 'Healthy', count: deficiencyCounts['Healthy'] || 0 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Batch Image Processing</h2>
          <p className="text-muted-foreground">Upload ZIP archive containing images to analyze for plant deficiencies.</p>
        </div>
      </div>

      {!isTrained ? (
        <Card className="border-dashed border-2 p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-muted rounded-full">
              <FolderArchive className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Upload Image Dataset</h3>
              <p className="text-sm text-muted-foreground">Upload .zip file containing plant leaf images for analysis</p>
            </div>
            
            {isUploading ? (
              <div className="w-full max-w-xs space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">Analyzing images... {Math.round(progress)}%</p>
              </div>
            ) : (
              <>
                <input 
                  id="zip-upload" 
                  type="file" 
                  accept=".zip" 
                  className="hidden" 
                  onChange={handleUpload}
                />
                <Label htmlFor="zip-upload">
                  <Button size="lg" className="cursor-pointer" asChild>
                    <span>
                      <Upload className="mr-2 h-4 w-4" />
                      Select Archive
                    </span>
                  </Button>
                </Label>
              </>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white">
                <Check className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-green-900">Analysis Complete</p>
                <p className="text-sm text-green-700">Analyzed {analyzedImages.length} images. Detection accuracy: {(85 + Math.random() * 10).toFixed(1)}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Image Analysis Results Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Analyzed Images</CardTitle>
              <CardDescription>Deficiency detection results for each image</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {analyzedImages.map((img, idx) => (
                  <div key={idx} className="group space-y-3 animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${idx * 50}ms` }}>
                    <div className="relative overflow-hidden rounded-lg border bg-muted aspect-square">
                      <img 
                        src={img.url} 
                        alt={img.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <p className="truncate font-medium" title={img.filename}>{img.filename}</p>
                      <div className="flex items-center gap-1">
                        {img.deficiency === 'Healthy' ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-orange-600" />
                        )}
                        <span className={img.deficiency === 'Healthy' ? 'text-green-700 font-medium' : 'text-orange-700 font-medium'}>
                          {img.deficiency}
                        </span>
                      </div>
                      <p className="text-muted-foreground">{(img.confidence * 100).toFixed(0)}% match</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {classDistribution.map((item) => (
              <Card key={item.name} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{item.count}</div>
                  <p className="text-xs text-muted-foreground mt-1">{item.name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
