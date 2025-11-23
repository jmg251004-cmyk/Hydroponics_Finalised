
import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Camera, Loader2, Check, AlertTriangle, X } from 'lucide-react';
import { REMEDIAL_MEASURES } from "@/lib/mockData";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Import generated images
import healthyLeaf from '@assets/generated_images/close_up_of_a_healthy_green_plant_leaf.png';
import kDefLeaf from '@assets/generated_images/plant_leaf_showing_potassium_deficiency_symptoms.png';

export function ImageDiagnostics() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ class: string, confidence: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setSelectedImage(url);
      setResult(null); // Reset result
    }
  };

  const handleDemoImage = (img: string) => {
    setSelectedImage(img);
    setResult(null);
  };

  const analyzeImage = () => {
    if (!selectedImage) return;
    
    setIsAnalyzing(true);
    
    // Mock API Delay
    setTimeout(() => {
      setIsAnalyzing(false);
      // Simple mock logic based on which demo image is selected, or random if uploaded
      let predictedClass = 'Healthy';
      if (selectedImage === kDefLeaf) predictedClass = 'K Deficiency';
      else if (selectedImage === healthyLeaf) predictedClass = 'Healthy';
      else {
        // Default to "Healthy" more often, or pick a deficiency
        const roll = Math.random();
        if (roll > 0.7) { // 30% chance of finding a deficiency
           const classes = ['K Deficiency', 'N Deficiency', 'P Deficiency', 'FN'];
           predictedClass = classes[Math.floor(Math.random() * classes.length)];
        } else {
           predictedClass = 'Healthy';
        }
      }
      
      setResult({
        class: predictedClass,
        confidence: 0.85 + Math.random() * 0.14
      });
    }, 2000);
  };

  const remedial = result ? REMEDIAL_MEASURES[result.class as keyof typeof REMEDIAL_MEASURES] : null;

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Visual Plant Diagnostics</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Upload a leaf image or use our camera integration to detect deficiencies and diseases using our Convolutional Neural Network (CNN).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left: Upload Area */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Image Upload</CardTitle>
            <CardDescription>Supported formats: .jpg, .png</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div 
              className={`
                border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
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
                   <img src={selectedImage} alt="Preview" className="object-cover w-full h-full" />
                   <div className="absolute inset-0 bg-black/10" />
                </div>
              ) : (
                <div className="py-8 space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Click to upload image</p>
                    <p className="text-xs text-muted-foreground mt-1">or drag and drop here</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => handleDemoImage(healthyLeaf)}>
                Demo: Healthy
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDemoImage(kDefLeaf)}>
                Demo: K Def
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full" 
              size="lg" 
              onClick={analyzeImage} 
              disabled={!selectedImage || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing CNN...
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

        {/* Right: Results Area */}
        <div className="space-y-6">
          {isAnalyzing && (
            <Card className="border-primary/20">
              <CardContent className="py-10 space-y-4">
                <div className="flex justify-between text-sm font-medium mb-2">
                  <span>Analyzing Leaf Textures...</span>
                  <span className="text-muted-foreground">78%</span>
                </div>
                <Progress value={78} className="h-2" />
                <div className="grid grid-cols-3 gap-2 mt-4">
                   <div className="h-20 bg-muted rounded animate-pulse delay-75" />
                   <div className="h-20 bg-muted rounded animate-pulse delay-150" />
                   <div className="h-20 bg-muted rounded animate-pulse delay-300" />
                </div>
              </CardContent>
            </Card>
          )}

          {!isAnalyzing && result && remedial && (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-500">
              
              {/* Diagnosis Card */}
              <Card className="overflow-hidden border-l-4" style={{ 
                borderLeftColor: result.class === 'Healthy' ? '#22c55e' : '#ef4444'
              }}>
                <CardHeader className="bg-muted/30 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle>Diagnosis Result</CardTitle>
                    <Badge variant={result.class === 'Healthy' ? 'default' : 'destructive'} className="text-base px-4 py-1">
                      {(result.confidence * 100).toFixed(1)}% Match
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-full ${result.class === 'Healthy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {result.class === 'Healthy' ? <Check className="h-8 w-8" /> : <AlertTriangle className="h-8 w-8" />}
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold tracking-tight text-foreground">
                        {result.class}
                      </h3>
                      <p className="text-muted-foreground mt-1">
                        Detected via Convolutional Neural Network
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Remedial Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="bg-primary/10 p-1.5 rounded text-primary">
                      <Check className="h-4 w-4" />
                    </span>
                    Remedial Measures
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <h4 className="text-lg font-semibold text-foreground mb-3">{remedial.title}</h4>
                    <ul className="space-y-2">
                      {remedial.actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background text-xs font-medium">
                            {i + 1}
                          </span>
                          <span className="text-sm leading-6">{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {!isAnalyzing && !result && (
            <div className="h-full flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl text-muted-foreground">
              <Camera className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Ready for Analysis</p>
              <p className="text-sm">Upload an image to see diagnostic results</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
