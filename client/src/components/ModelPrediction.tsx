import { useMemo, useState } from 'react';
import { AlertTriangle, Check, Search } from 'lucide-react';
import * as ss from 'simple-statistics';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getClassDisplayName, type HydroponicImageRecord } from '@/lib/hydroponicMetadata';
import {
  buildPlantModel,
  MODEL_FEATURE_FIELDS,
  normalizeValue,
  predictPlantLabel,
  round,
  type ModelFeatureKey,
} from '@/lib/plantModel';

interface ModelPredictionProps {
  data: HydroponicImageRecord[];
}

const FEATURE_PLACEHOLDERS: Record<ModelFeatureKey, string> = {
  Mean_R: 'e.g. 150.2',
  Mean_G: 'e.g. 165.4',
  Mean_B: 'e.g. 123.6',
  Brightness: 'e.g. 160.8',
  Hue_Deg: 'e.g. 94.3',
  Saturation_Pct: 'e.g. 52.6',
  Green_Coverage_Pct: 'e.g. 44.1',
  Excess_Green_Index: 'e.g. 21.7',
  Contrast: 'e.g. 76.2',
  Edge_Density: 'e.g. 0.18',
  Leaf_Area_Ratio: 'e.g. 0.64',
};

interface PredictionResult {
  label: string;
  confidence: number;
  matchCount: number;
  simpleReason: string;
}

export function ModelPrediction({ data }: ModelPredictionProps) {
  const [values, setValues] = useState<Record<ModelFeatureKey, string>>(
    Object.fromEntries(MODEL_FEATURE_FIELDS.map(({ key }) => [key, ''])) as Record<ModelFeatureKey, string>,
  );
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);

  const model = useMemo(() => buildPlantModel(data), [data]);

  const populateFromDataset = () => {
    if (!data.length) return;
    const averageValues = Object.fromEntries(
      MODEL_FEATURE_FIELDS.map(({ key }) => [key, String(round(ss.mean(data.map((record) => Number(record[key]))), 2))]),
    ) as Record<ModelFeatureKey, string>;
    setValues(averageValues);
  };

  const populateFromFirstSample = () => {
    if (!data.length) return;
    const sample = data[0];
    const sampleValues = Object.fromEntries(
      MODEL_FEATURE_FIELDS.map(({ key }) => [key, String(sample[key])]),
    ) as Record<ModelFeatureKey, string>;
    setValues(sampleValues);
  };

  const handlePredict = () => {
    if (!model) return;

    const parsed = Object.fromEntries(
      MODEL_FEATURE_FIELDS.map(({ key }) => [key, Number(values[key])]),
    ) as Record<ModelFeatureKey, number>;

    if (Object.values(parsed).some((value) => Number.isNaN(value))) {
      setPrediction({
        label: 'Input Required',
        confidence: 0,
        matchCount: 0,
        simpleReason: 'Fill all fields with numbers before running prediction.',
      });
      return;
    }

    const normalizedInput = Object.fromEntries(
      MODEL_FEATURE_FIELDS.map(({ key }) => [
        key,
        normalizeValue(parsed[key], model.featureStats[key].mean, model.featureStats[key].deviation),
      ]),
    ) as Record<ModelFeatureKey, number>;

    const { bestLabel, confidence, matchCount } = predictPlantLabel(normalizedInput, model);
    const neighborPhrase = model.k > 0 ? `${matchCount} of the ${model.k} closest samples` : 'The best-performing metadata model';
    const simpleReason = `${neighborPhrase} support ${getClassDisplayName(bestLabel as any)}.`;

    setPrediction({
      label: bestLabel,
      confidence,
      matchCount,
      simpleReason,
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center">
        <h2 className="text-3xl font-bold tracking-tight">Manual Prediction</h2>
        <p className="text-muted-foreground">
          Enter a few image values and the app will suggest the closest deficiency class from your dataset.
        </p>
      </div>

      {!model && (
        <Alert>
          <AlertTitle>Metadata model not ready</AlertTitle>
          <AlertDescription>
            The predictor needs a labeled metadata dataset with enough rows before it can train the classifier.
          </AlertDescription>
        </Alert>
      )}

      {model && (
        <Card className="border-slate-200 bg-slate-50/70">
          <CardHeader>
            <CardTitle>Validated Metadata Model</CardTitle>
            <CardDescription>
              The prediction uses your uploaded metadata.csv, benchmarks multiple classical models, and applies the best-performing classifier.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <SummaryCard title="Dataset Samples" value={String(model.samples.length)} subtitle="Rows used for prediction" />
            <SummaryCard title="Estimated Accuracy" value={`${model.accuracy}%`} subtitle="Leave-one-out validation" />
            <SummaryCard title="Macro F1 Score" value={`${model.macroF1}%`} subtitle="Class-balanced validation quality" />
            <SummaryCard title="Best Model" value={model.algorithmName} subtitle="Highest validation score on metadata.csv" />
            <SummaryCard title="Tuned Neighbors" value={model.k > 0 ? String(model.k) : 'N/A'} subtitle="Shown only when the winning model is k-NN" />
            <SummaryCard title="Features Used" value={String(MODEL_FEATURE_FIELDS.length)} subtitle="Metadata signals in the classifier" />
          </CardContent>
        </Card>
      )}

      {model && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Model Benchmark Table</CardTitle>
              <CardDescription>Comparison of all candidate models trained using the current metadata.csv.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {model.benchmarks.map((benchmark) => (
                <div key={benchmark.name} className="rounded-2xl border bg-muted/20 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-medium">{benchmark.name}</div>
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{benchmark.kind}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold">{benchmark.accuracy}%</div>
                      <div className="text-xs text-muted-foreground">Macro F1 {benchmark.macroF1}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Confusion Matrix Snapshot</CardTitle>
              <CardDescription>Actual class rows versus predicted class counts for the selected best model.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 overflow-auto">
              {model.confusionMatrix.map((row) => (
                <div key={row.actual} className="rounded-2xl border bg-muted/20 p-4">
                  <div className="mb-2 text-sm font-medium">{getClassDisplayName(row.actual)}</div>
                  <div className="grid gap-2">
                    {Object.entries(row.values).map(([label, count]) => (
                      <div key={label} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{getClassDisplayName(label as any)}</span>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Manual Metadata Testing</CardTitle>
          <CardDescription>
            These values should come from your metadata.csv file when you want to validate a single sample manually.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {MODEL_FEATURE_FIELDS.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                placeholder={FEATURE_PLACEHOLDERS[field.key]}
                value={values[field.key]}
                onChange={(e) => setValues((current) => ({ ...current, [field.key]: e.target.value }))}
              />
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 lg:flex-row">
          <Button className="w-full lg:flex-1" size="lg" onClick={handlePredict} disabled={!model}>
            <Search className="mr-2 h-4 w-4" />
            Predict Class
          </Button>
          <Button variant="outline" className="w-full lg:w-auto" onClick={populateFromDataset} disabled={!model}>
            Use Average Values
          </Button>
          <Button variant="outline" className="w-full lg:w-auto" onClick={populateFromFirstSample} disabled={!model}>
            Use Example Values
          </Button>
        </CardFooter>
      </Card>

      {prediction && (
        <Card className="overflow-hidden border-2 border-emerald-100">
          <div className={`h-2 w-full ${prediction.label === 'Healthy' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <CardHeader>
            <CardTitle>Prediction Result</CardTitle>
            <CardDescription>Result generated by the best benchmarked metadata model.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-muted p-3">
                {prediction.label === 'Healthy' ? (
                  <Check className="h-6 w-6 text-emerald-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-amber-600" />
                )}
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-semibold">{getClassDisplayName(prediction.label as any)}</div>
                <div className="text-sm text-muted-foreground">
                  Confidence: {prediction.confidence}%
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-muted/40 p-4">
              <div className="mb-2 text-sm font-medium">Why this result came</div>
              <p className="text-sm text-muted-foreground">{prediction.simpleReason}</p>
              {model && model.k > 0 && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Matching neighbors: {prediction.matchCount} of {model.k}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
    </div>
  );
}
