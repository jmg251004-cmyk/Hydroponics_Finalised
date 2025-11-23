
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FolderArchive, BarChart3 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';

export function BatchImageTraining() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isTrained, setIsTrained] = useState(false);

  const handleUpload = () => {
    setIsUploading(true);
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setIsUploading(false);
        setIsTrained(true);
      }
    }, 100);
  };

  // Mock Data for "Generated Dashboard" after training
  const classDistribution = [
    { name: 'K Deficiency', count: 65 },
    { name: 'N Deficiency', count: 58 },
    { name: 'P Deficiency', count: 62 },
    { name: 'FN Deficiency', count: 70 },
    { name: 'Healthy', count: 60 },
  ];

  const COLORS = ['#eab308', '#3b82f6', '#a855f7', '#ef4444', '#22c55e'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Batch Image Processing</h2>
          <p className="text-muted-foreground">Upload ZIP archive containing categorized images (K, N, P, FN, Healthy).</p>
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
              <p className="text-sm text-muted-foreground">Expected format: .zip with subfolders for each class</p>
            </div>
            
            {isUploading ? (
              <div className="w-full max-w-xs space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-muted-foreground">Training CNN model... {progress}%</p>
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
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-green-900">Model Successfully Retrained</p>
                <p className="text-sm text-green-700">Processed 315 images across 5 categories. Validation Accuracy: 94.2%</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Class Distribution</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classDistribution}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} angle={-15} textAnchor="end" height={60} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8884d8">
                      {classDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Proportion Analysis</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={classDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="count"
                    >
                      {classDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
