import { useMemo, useState } from 'react';
import JSZip from 'jszip';
import { Check, FolderArchive, Upload } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  extractMetadataFromImageBlob,
  recordsToCSV,
  type HydroponicImageRecord,
} from '@/lib/hydroponicMetadata';

interface BatchImageTrainingProps {
  data: HydroponicImageRecord[];
  onDatasetGenerated: (records: HydroponicImageRecord[]) => void;
  onFilenameChange: (filename: string) => void;
}

interface PreviewImage {
  filename: string;
  url: string;
  classLabel: string;
}

export function BatchImageTraining({
  data,
  onDatasetGenerated,
  onFilenameChange,
}: BatchImageTrainingProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [previewImages, setPreviewImages] = useState<PreviewImage[]>([]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    setIsUploading(true);
    setProgress(8);

    try {
      const zip = await JSZip.loadAsync(file);
      const imageEntries = Object.entries(zip.files).filter(
        ([path, fileData]) => !fileData.dir && /\.(jpg|jpeg|png|webp)$/i.test(path),
      );

      const records: HydroponicImageRecord[] = [];
      const previews: PreviewImage[] = [];

      for (let index = 0; index < imageEntries.length; index++) {
        const [path, fileData] = imageEntries[index];
        const blob = await fileData.async('blob');
        const filename = path.split('/').pop() || `image_${index + 1}.png`;
        const metadata = await extractMetadataFromImageBlob(blob, filename, path);

        records.push(metadata);

        if (previews.length < 12) {
          previews.push({
            filename,
            url: URL.createObjectURL(blob),
            classLabel: metadata.Class_Label,
          });
        }

        setProgress(10 + ((index + 1) / imageEntries.length) * 85);
      }

      onDatasetGenerated(records);
      onFilenameChange(`${file.name.replace(/\.zip$/i, '')}_metadata.csv`);
      setPreviewImages(previews);
      setIsReady(true);
      setProgress(100);
    } catch (error) {
      console.error('Failed to process ZIP:', error);
      alert('Failed to process the ZIP file. Please check that it contains readable images.');
    } finally {
      setIsUploading(false);
    }
  };

  const classDistribution = useMemo(() => {
    return Array.from(
      data.reduce((map, record) => {
        map.set(record.Class_Label, (map.get(record.Class_Label) ?? 0) + 1);
        return map;
      }, new Map<string, number>()),
    );
  }, [data]);

  const downloadCsv = () => {
    if (!data.length) return;
    const csv = recordsToCSV(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'hydroponic_image_metadata.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Model Training</h2>
          <p className="text-muted-foreground">Upload a ZIP of plant images to generate metadata for analysis and prediction.</p>
        </div>
        {data.length > 0 && (
          <Button onClick={downloadCsv}>
            Download Metadata CSV
          </Button>
        )}
      </div>

      {!isReady ? (
        <Card className="border-dashed border-2 p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="rounded-full bg-muted p-4">
              <FolderArchive className="h-10 w-10 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Upload Image Dataset</h3>
              <p className="text-sm text-muted-foreground">Upload a `.zip` file containing plant images.</p>
            </div>

            {isUploading ? (
              <div className="w-full max-w-xs space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">Generating metadata... {Math.round(progress)}%</p>
              </div>
            ) : (
              <>
                <input id="zip-upload" type="file" accept=".zip" className="hidden" onChange={handleUpload} />
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
              <div className="flex-1">
                <p className="font-medium text-green-900">Metadata generation complete</p>
                <p className="text-sm text-green-700">Generated {data.length} records from the uploaded image dataset.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {classDistribution.map(([label, count]) => (
                  <Badge key={label} variant="secondary">
                    {label}: {count}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Previewed Images</CardTitle>
              <CardDescription>Sample images detected from the uploaded archive.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {previewImages.map((image, index) => (
                  <div key={`${image.filename}-${index}`} className="space-y-2">
                    <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
                      <img src={image.url} alt={image.filename} className="h-full w-full object-cover" />
                    </div>
                    <div className="space-y-1 text-xs">
                      <p className="truncate font-medium" title={image.filename}>{image.filename}</p>
                      <p className="text-muted-foreground">{image.classLabel}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{data.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Records Generated</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{data.filter((record) => record.Class_Label !== 'Unknown').length}</div>
                <p className="text-xs text-muted-foreground mt-1">Labeled Samples</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {(data.reduce((sum, record) => sum + record.Green_Coverage_Pct, 0) / Math.max(data.length, 1)).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-1">Average Green Area</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {(data.reduce((sum, record) => sum + record.Contrast, 0) / Math.max(data.length, 1)).toFixed(1)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Average Contrast</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
