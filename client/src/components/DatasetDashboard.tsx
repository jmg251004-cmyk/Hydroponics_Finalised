import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import * as ss from 'simple-statistics';
import { BookOpenText, FileSpreadsheet, FlaskConical, Upload, Users } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseCSV } from '@/lib/csvData';
import { getClassDisplayName, type HydroponicImageRecord } from '@/lib/hydroponicMetadata';
import { buildPlantModel, MODEL_FEATURE_FIELDS, round } from '@/lib/plantModel';

interface DatasetDashboardProps {
  data: HydroponicImageRecord[];
  filename: string;
  onDataChange: (records: HydroponicImageRecord[]) => void;
  onFilenameChange: (filename: string) => void;
}

const CLASS_COLORS: Record<string, string> = {
  Healthy: '#15803d',
  'K Deficiency': '#f59e0b',
  'N Deficiency': '#facc15',
  'P Deficiency': '#fb7185',
  'Fungal Infection': '#ef4444',
  Unknown: '#64748b',
};

function safeCorrelation(a: number[], b: number[]) {
  if (a.length < 2 || b.length < 2 || a.length !== b.length) return 0;
  if (new Set(a).size < 2 || new Set(b).size < 2) return 0;

  try {
    return ss.sampleCorrelation(a, b);
  } catch {
    return 0;
  }
}

export function DatasetDashboard({
  data,
  filename,
  onDataChange,
  onFilenameChange,
}: DatasetDashboardProps) {
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    onFilenameChange(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = parseCSV(String(event.target?.result ?? ''));
        if (!parsed.length) throw new Error('No records parsed');
        onDataChange(parsed);
        setError(null);
      } catch (uploadError) {
        console.error(uploadError);
        setError('The uploaded CSV could not be parsed. Please upload the project metadata.csv file.');
      }
    };

    reader.readAsText(file);
  };

  const analytics = useMemo(() => {
    if (!data.length) return null;

    const model = buildPlantModel(data);
    const labels = Array.from(new Set(data.map((record) => record.Class_Label))).sort();
    const classDistribution = labels.map((label) => ({
      label,
      display: getClassDisplayName(label),
      value: data.filter((record) => record.Class_Label === label).length,
      fill: CLASS_COLORS[label] ?? CLASS_COLORS.Unknown,
    }));

    const barData = labels.map((label) => {
      const rows = data.filter((record) => record.Class_Label === label);
      return {
        label: getClassDisplayName(label),
        Brightness: round(ss.mean(rows.map((record) => record.Brightness)), 2),
        GreenCoverage: round(ss.mean(rows.map((record) => record.Green_Coverage_Pct)), 2),
        Contrast: round(ss.mean(rows.map((record) => record.Contrast)), 2),
      };
    });

    const brightness = data.map((record) => record.Brightness);
    const greenCoverage = data.map((record) => record.Green_Coverage_Pct);
    const contrast = data.map((record) => record.Contrast);
    const exg = data.map((record) => record.Excess_Green_Index);

    const correlation = safeCorrelation(brightness, greenCoverage);

    return {
      model,
      classDistribution,
      barData,
      correlation: round(correlation, 4),
      avgBrightness: round(ss.mean(brightness), 2),
      avgContrast: round(ss.mean(contrast), 2),
      avgExg: round(ss.mean(exg), 2),
      sampleCount: data.length,
      featureCount: MODEL_FEATURE_FIELDS.length,
    };
  }, [data]);

  if (!analytics) {
    return (
      <Alert>
        <AlertTitle>No data loaded</AlertTitle>
        <AlertDescription>Upload the team metadata CSV to generate the DAV dashboard.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <Card className="overflow-hidden border-slate-200 bg-gradient-to-br from-white via-amber-50 to-rose-50">
        <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.8fr_1fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">
              <BookOpenText className="h-4 w-4" />
              Data Analytics & Visualization Lab
            </div>
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Pinnacle Project Analytics Dashboard</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                This dashboard analyzes plant deficiency metadata from the pinnacle project dataset, compares predictive
                models, and presents statistical evidence needed for the DAV end-sem practical examination.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <InfoStrip
                icon={Users}
                title="Team"
                body="Darshan and Joselet Mebel Glancy B"
              />
              <InfoStrip
                icon={FlaskConical}
                title="Guide"
                body="Dr. Sabireen H"
              />
              <InfoStrip
                icon={FileSpreadsheet}
                title="Dataset"
                body={`${filename} with ${analytics.sampleCount} labeled records`}
              />
              <InfoStrip
                icon={BookOpenText}
                title="Problem Statement"
                body="Build a DAV dashboard for plant deficiency analytics using metadata-driven statistical and predictive methods."
              />
            </div>
          </div>

          <div className="space-y-4 rounded-3xl border bg-white/80 p-5 shadow-sm">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Dataset Control</div>
              <div className="mt-1 text-sm text-slate-600">Upload the approved `metadata.csv` to refresh the analysis.</div>
            </div>

            <Label htmlFor="csv-upload" className="cursor-pointer">
              <div className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800">
                <Upload className="h-4 w-4" />
                Upload Metadata CSV
              </div>
              <Input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
            </Label>

            <div className="grid gap-3">
              <StatCard title="Best Model" value={analytics.model?.algorithmName ?? 'Not ready'} subtitle="Top benchmarked classifier" />
              <StatCard title="Accuracy" value={`${analytics.model?.accuracy ?? 0}%`} subtitle="Leave-one-out validation" />
              <StatCard title="Macro F1" value={`${analytics.model?.macroF1 ?? 0}%`} subtitle="Class-balanced model quality" />
              <StatCard
                title="Top F-Test Feature"
                value={analytics.model?.featureScores[0]?.label ?? 'N/A'}
                subtitle={`F = ${analytics.model?.featureScores[0]?.fScore ?? 0}`}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>CSV upload failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Records" value={String(analytics.sampleCount)} subtitle="Rows trained from metadata.csv" />
        <StatCard title="Classes" value={String(analytics.classDistribution.length)} subtitle="Deficiency categories found" />
        <StatCard title="Correlation r" value={analytics.correlation.toFixed(4)} subtitle="Brightness vs green coverage" />
        <StatCard title="Features" value={String(analytics.featureCount)} subtitle="Metadata attributes used" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          title="Class Distribution"
          description="Class balance inside the metadata dataset used for DAV analysis."
        >
          <PieChart>
            <Pie
              data={analytics.classDistribution}
              dataKey="value"
              nameKey="display"
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={112}
              paddingAngle={3}
              stroke="none"
            >
              {analytics.classDistribution.map((entry) => (
                <Cell key={entry.label} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" iconType="circle" />
          </PieChart>
        </ChartCard>

        <ChartCard
          title="Average Feature Trends by Class"
          description="Mean brightness, green coverage, and contrast for each deficiency category."
        >
          <BarChart data={analytics.barData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} height={72} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Brightness" fill="#0f766e" radius={[6, 6, 0, 0]} />
            <Bar dataKey="GreenCoverage" fill="#65a30d" radius={[6, 6, 0, 0]} />
            <Bar dataKey="Contrast" fill="#dc2626" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard
          title="Brightness vs Green Coverage"
          description="Scatter view used to examine separability between metadata-driven deficiency classes."
        >
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis type="number" dataKey="Brightness" name="Brightness" tick={{ fontSize: 12 }} />
            <YAxis type="number" dataKey="Green_Coverage_Pct" name="Green Coverage" tick={{ fontSize: 12 }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} />
            {analytics.classDistribution.map((entry) => (
              <Scatter
                key={entry.label}
                name={entry.display}
                data={data.filter((record) => record.Class_Label === entry.label)}
                fill={entry.fill}
                opacity={0.75}
              />
            ))}
          </ScatterChart>
        </ChartCard>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-slate-50/70">
            <CardTitle className="text-base">ANOVA F-Test Ranking</CardTitle>
            <CardDescription>
              Higher F-score means the feature separates deficiency groups more strongly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 p-6">
            {analytics.model?.featureScores.slice(0, 6).map((feature) => (
              <div key={feature.key} className="rounded-2xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium text-slate-900">{feature.label}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-500">ANOVA / F-test</div>
                  </div>
                  <div className="text-xl font-semibold text-slate-900">{feature.fScore.toFixed(3)}</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 bg-slate-50/60">
        <CardHeader>
          <CardTitle>Inference Snapshot</CardTitle>
          <CardDescription>Short DAV-oriented summary for project report and viva discussion.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <SummaryNote
            title="Statistical Finding"
            body={`Green coverage and excess green are among the strongest separating features, with the top F-test score at ${analytics.model?.featureScores[0]?.fScore ?? 0}.`}
          />
          <SummaryNote
            title="Best Predictive Model"
            body={`${analytics.model?.algorithmName ?? 'The trained model'} gave the best validation result on this metadata, with accuracy ${analytics.model?.accuracy ?? 0}% and macro F1 ${analytics.model?.macroF1 ?? 0}%.`}
          />
          <SummaryNote
            title="DAV Conclusion"
            body="The dataset is suitable for visual analytics and classical metadata-based classification, but exact image-level diagnosis would need a larger labeled image model in future work."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function InfoStrip({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border bg-white/80 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        <Icon className="h-4 w-4" />
        {title}
      </div>
      <div className="mt-2 text-sm leading-6 text-slate-700">{body}</div>
    </div>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{subtitle}</div>
    </div>
  );
}

function SummaryNote({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{body}</div>
    </div>
  );
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactElement;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-slate-50/70">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="h-[360px] p-6">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
