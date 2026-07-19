import { useMemo, useRef, useState } from 'react';
import { AlertTriangle, Camera, Check, Loader2, Upload } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { REMEDIAL_MEASURES } from '@/lib/mockData';
import { extractMetadataFromImageBlob, getClassDisplayName, type HydroponicImageRecord } from '@/lib/hydroponicMetadata';
import {
  buildPlantModel,
  MODEL_FEATURE_FIELDS,
  normalizeValue,
  predictPlantLabel,
  round,
  type ModelFeatureKey,
} from '@/lib/plantModel';

import healthyLeaf from '@assets/generated_images/close_up_of_a_healthy_green_plant_leaf.png';
import kDefLeaf from '@assets/generated_images/plant_leaf_showing_potassium_deficiency_symptoms.png';

interface ImageDiagnosticsProps {
  data: HydroponicImageRecord[];
}

interface DiagnosticResult {
  class: string;
  confidence: number;
  explanation: string;
  featureNotes: string[];
}

async function imageUrlToBlob(imageUrl: string) {
  const response = await fetch(imageUrl);
  return response.blob();
}

export function ImageDiagnostics({ data }: ImageDiagnosticsProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const model = useMemo(() => buildPlantModel(data), [data]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    setUploadedFile(file);
    setSelectedImage(URL.createObjectURL(file));
    setResult(null);
  };

  const handleDemoImage = (imageUrl: string) => {
    setUploadedFile(null);
    setSelectedImage(imageUrl);
    setResult(null);
  };

  const analyzeImage = async () => {
    if (!selectedImage || !model) return;

    setIsAnalyzing(true);

    try {
      const blob = uploadedFile ?? await imageUrlToBlob(selectedImage);
      const metadata = await extractMetadataFromImageBlob(
        blob,
        uploadedFile?.name ?? 'demo-image.png',
        uploadedFile?.name ?? selectedImage,
      );

      const normalizedInput = Object.fromEntries(
        MODEL_FEATURE_FIELDS.map(({ key }) => [
          key,
          normalizeValue(Number(metadata[key]), model.featureStats[key].mean, model.featureStats[key].deviation),
        ]),
      ) as Record<ModelFeatureKey, number>;

      const { bestLabel: predictedClass, confidence, matchCount: matchingNeighbors } = predictPlantLabel(normalizedInput, model);

      const centroid = model.classCentroids.find((entry) => entry.label === predictedClass)?.centroid;
      const featureNotes = centroid
        ? MODEL_FEATURE_FIELDS.slice(0, 4).map(({ key, label }) => {
            const value = Number(metadata[key]);
            const delta = round(value - centroid[key], key === 'Green_Coverage_Pct' ? 1 : 2);
            const relation = delta >= 0 ? 'higher' : 'lower';
            return `The image has ${relation} ${label} than the average ${getClassDisplayName(predictedClass as any)} sample by ${Math.abs(delta)}.`;
          })
        : [];

      const explanation =
        predictedClass === 'Unknown'
          ? 'The uploaded image could not be matched reliably with the current dataset.'
          : model.k > 0
            ? `${matchingNeighbors} of the ${model.k} nearest metadata samples support ${getClassDisplayName(predictedClass as any)}, so the uploaded image is mapped to that deficiency pattern.`
            : `${model.algorithmName} identified the uploaded image as ${getClassDisplayName(predictedClass as any)} based on the extracted metadata features.`;

      setResult({
        class: predictedClass,
        confidence,
        explanation,
        featureNotes,
      });
    } catch (error) {
      console.error(error);
      setResult({
        class: 'Unknown',
        confidence: 0,
        explanation: 'The image could not be analyzed. Please upload a clearer single-leaf image.',
        featureNotes: [],
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const remedial = result ? REMEDIAL_MEASURES[result.class as keyof typeof REMEDIAL_MEASURES] : null;

  return (
    <div className="mx-auto max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="space-y-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Image Prediction</h2>
        <p className="mx-auto max-w-2xl text-muted-foreground">
          Upload a leaf image and the dashboard will extract metadata, then classify it using the best benchmarked model trained from `metadata.csv`.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Image Upload</CardTitle>
            <CardDescription>Supported formats: .jpg, .png, .jpeg. Best results come from a clear single-leaf image.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`
                cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors
                ${selectedImage ? 'border-primary/50 bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'}
              `}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />

              {selectedImage ? (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg shadow-md">
                  <img src={selectedImage} alt="Preview" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
              ) : (
                <div className="space-y-4 py-8">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Click to upload leaf image</p>
                    <p className="mt-1 text-xs text-muted-foreground">or drag and drop here</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleDemoImage(healthyLeaf)}>
                Demo: Healthy
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDemoImage(kDefLeaf)}>
                Demo: K Def
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={analyzeImage} disabled={!selectedImage || isAnalyzing || !model}>
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Leaf Image...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Analyze Plant Health
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        <div className="space-y-6">
          {isAnalyzing && (
            <Card className="border-primary/20">
              <CardContent className="space-y-4 py-10">
                <div className="mb-2 flex justify-between text-sm font-medium">
                  <span>Comparing image with dataset samples...</span>
                  <span className="text-muted-foreground">78%</span>
                </div>
                <Progress value={78} className="h-2" />
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="h-20 animate-pulse rounded bg-muted delay-75" />
                  <div className="h-20 animate-pulse rounded bg-muted delay-150" />
                  <div className="h-20 animate-pulse rounded bg-muted delay-300" />
                </div>
              </CardContent>
            </Card>
          )}

          {!isAnalyzing && result && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
              <Card
                className="overflow-hidden border-l-4"
                style={{ borderLeftColor: result.class === 'Healthy' ? '#22c55e' : '#ef4444' }}
              >
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>Diagnosis Result</CardTitle>
                    <Badge variant={result.class === 'Healthy' ? 'default' : 'destructive'} className="px-4 py-1 text-base">
                      {result.class === 'Unknown' ? 'Not Verified' : `${result.confidence}% Match`}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className={`rounded-full p-3 ${result.class === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {result.class === 'Healthy' ? <Check className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold tracking-tight text-foreground">{getClassDisplayName(result.class as any)}</h3>
                      <p className="mt-1 text-muted-foreground">{result.explanation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Why This Image Was Classified This Way</CardTitle>
                  <CardDescription>The result is based on metadata extracted from the uploaded image and compared with the labeled metadata training set.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.featureNotes.length > 0 ? (
                      result.featureNotes.map((note) => (
                        <li key={note} className="rounded-lg bg-muted/50 p-3 text-sm leading-6">
                          {note}
                        </li>
                      ))
                    ) : (
                      <li className="rounded-lg bg-muted/50 p-3 text-sm leading-6">
                        Upload a clearer single-leaf image to get more detailed feature explanations.
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              {remedial && (
                <Card>
                  <CardHeader>
                    <CardTitle>Possible Cause and Remedial Measures</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <h4 className="mb-3 text-lg font-semibold text-foreground">{remedial.title}</h4>
                      <ul className="space-y-2">
                        {remedial.actions.map((action, index) => (
                          <li key={index} className="flex items-start gap-3 rounded-lg bg-muted/50 p-3">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-medium">
                              {index + 1}
                            </span>
                            <span className="text-sm leading-6">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!isAnalyzing && !result && (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-muted-foreground">
              <Camera className="mb-4 h-16 w-16 opacity-20" />
              <p className="text-lg font-medium">Ready for Analysis</p>
              <p className="text-sm">Upload an image to see the predicted deficiency and explanation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
