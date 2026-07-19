export type HydroponicClassLabel =
  | 'Healthy'
  | 'K Deficiency'
  | 'N Deficiency'
  | 'P Deficiency'
  | 'Fungal Infection'
  | 'Unknown';

export const CLASS_DISPLAY_NAMES: Record<HydroponicClassLabel, string> = {
  Healthy: 'Healthy',
  'K Deficiency': 'Potassium Deficiency',
  'N Deficiency': 'Nitrogen Deficiency',
  'P Deficiency': 'Phosphorous Deficiency',
  'Fungal Infection': 'Pythium / Fungal Infection',
  Unknown: 'Unknown',
};

export interface HydroponicImageRecord {
  Image_ID: string;
  Source_Path: string;
  Class_Label: HydroponicClassLabel;
  Class_Index: number;
  Mean_R: number;
  Mean_G: number;
  Mean_B: number;
  Brightness: number;
  Hue_Deg: number;
  Saturation_Pct: number;
  Green_Coverage_Pct: number;
  Excess_Green_Index: number;
  Contrast: number;
  Edge_Density: number;
  Leaf_Area_Ratio: number;
}

const CLASS_KEYWORDS: Array<{ label: HydroponicClassLabel; index: number; keywords: string[] }> = [
  { label: 'Healthy', index: 0, keywords: ['healthy'] },
  { label: 'K Deficiency', index: 1, keywords: ['k deficiency', 'k_def', 'potassium', 'kdef', ' k '] },
  { label: 'N Deficiency', index: 2, keywords: ['n deficiency', 'n_def', 'nitrogen', 'ndef', ' n '] },
  { label: 'P Deficiency', index: 3, keywords: ['p deficiency', 'p_def', 'phosphorus', 'pdef', ' p '] },
  { label: 'Fungal Infection', index: 4, keywords: ['fn', 'fungal', 'fungus', 'disease', 'infection', 'necrosis', 'pythium', 'root rot'] },
];

function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toHsv(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === rn) hue = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) hue = 60 * ((bn - rn) / delta + 2);
    else hue = 60 * ((rn - gn) / delta + 4);
  }

  if (hue < 0) hue += 360;

  const saturation = max === 0 ? 0 : (delta / max) * 100;
  const value = max * 100;

  return { hue, saturation, value };
}

export function inferClassLabel(pathOrName: string) {
  const raw = pathOrName.toLowerCase().replace(/\\/g, '/');
  const segments = raw
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean);

  // Prefer exact folder/file tokens before fuzzy keyword matching.
  for (const segment of segments) {
    if (segment === '-k' || segment === 'k' || segment.startsWith('k_') || segment.includes('potassium')) {
      return { label: 'K Deficiency' as const, index: 1 };
    }
    if (segment === '-n' || segment === 'n' || segment.startsWith('n_') || segment.includes('nitrogen')) {
      return { label: 'N Deficiency' as const, index: 2 };
    }
    if (segment === '-p' || segment === 'p' || segment.startsWith('p_') || segment.includes('phosphorus')) {
      return { label: 'P Deficiency' as const, index: 3 };
    }
    if (
      segment === 'fn' ||
      segment.startsWith('fn_') ||
      segment.includes('fungal') ||
      segment.includes('fungus') ||
      segment.includes('necrosis') ||
      segment.includes('pythium') ||
      segment.includes('rootrot') ||
      segment.includes('root_rot')
    ) {
      return { label: 'Fungal Infection' as const, index: 4 };
    }
    if (segment === 'healthy' || segment.startsWith('healthy_')) {
      return { label: 'Healthy' as const, index: 0 };
    }
  }

  const normalized = ` ${raw.replace(/[_-]+/g, ' ')} `;

  for (const entry of CLASS_KEYWORDS) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return { label: entry.label, index: entry.index };
    }
  }

  return { label: 'Unknown' as const, index: 5 };
}

export function getClassDisplayName(label: HydroponicClassLabel) {
  return CLASS_DISPLAY_NAMES[label] ?? label;
}

export function recordsToCSV(records: HydroponicImageRecord[]) {
  const headers = [
    'Image_ID',
    'Source_Path',
    'Class_Label',
    'Class_Index',
    'Mean_R',
    'Mean_G',
    'Mean_B',
    'Brightness',
    'Hue_Deg',
    'Saturation_Pct',
    'Green_Coverage_Pct',
    'Excess_Green_Index',
    'Contrast',
    'Edge_Density',
    'Leaf_Area_Ratio',
  ];

  const rows = records.map((record) =>
    headers
      .map((header) => {
        const value = record[header as keyof HydroponicImageRecord];
        const serialized = String(value ?? '');
        return serialized.includes(',') ? `"${serialized.replace(/"/g, '""')}"` : serialized;
      })
      .join(','),
  );

  return [headers.join(','), ...rows].join('\n');
}

export function parseHydroponicCSV(csvText: string): HydroponicImageRecord[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((header) => header.trim());
  const numericHeaders = new Set([
    'Class_Index',
    'Mean_R',
    'Mean_G',
    'Mean_B',
    'Brightness',
    'Hue_Deg',
    'Saturation_Pct',
    'Green_Coverage_Pct',
    'Excess_Green_Index',
    'Contrast',
    'Edge_Density',
    'Leaf_Area_Ratio',
  ]);

  return lines
    .slice(1)
    .map((line) => {
      const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) ?? [];
      const row: Record<string, string | number> = {};

      headers.forEach((header, index) => {
        const rawValue = (values[index] ?? '').replace(/^"|"$/g, '').replace(/""/g, '"');
        row[header] = numericHeaders.has(header) ? Number(rawValue) : rawValue;
      });

      const inferred = inferClassLabel(String(row.Class_Label ?? row.Image_ID ?? ''));

      return {
        Image_ID: String(row.Image_ID ?? ''),
        Source_Path: String(row.Source_Path ?? row.Image_ID ?? ''),
        Class_Label: (row.Class_Label as HydroponicClassLabel) || inferred.label,
        Class_Index: Number.isFinite(row.Class_Index) ? Number(row.Class_Index) : inferred.index,
        Mean_R: Number(row.Mean_R ?? 0),
        Mean_G: Number(row.Mean_G ?? 0),
        Mean_B: Number(row.Mean_B ?? 0),
        Brightness: Number(row.Brightness ?? 0),
        Hue_Deg: Number(row.Hue_Deg ?? 0),
        Saturation_Pct: Number(row.Saturation_Pct ?? 0),
        Green_Coverage_Pct: Number(row.Green_Coverage_Pct ?? 0),
        Excess_Green_Index: Number(row.Excess_Green_Index ?? 0),
        Contrast: Number(row.Contrast ?? 0),
        Edge_Density: Number(row.Edge_Density ?? 0),
        Leaf_Area_Ratio: Number(row.Leaf_Area_Ratio ?? 0),
      };
    })
    .filter((record) => record.Image_ID);
}

function createSyntheticRecord(index: number, label: HydroponicClassLabel): HydroponicImageRecord {
  const profiles: Record<HydroponicClassLabel, Omit<HydroponicImageRecord, 'Image_ID' | 'Source_Path' | 'Class_Label' | 'Class_Index'>> = {
    Healthy: {
      Mean_R: 86 + Math.random() * 18,
      Mean_G: 132 + Math.random() * 30,
      Mean_B: 66 + Math.random() * 14,
      Brightness: 106 + Math.random() * 18,
      Hue_Deg: 102 + Math.random() * 16,
      Saturation_Pct: 52 + Math.random() * 18,
      Green_Coverage_Pct: 64 + Math.random() * 22,
      Excess_Green_Index: 82 + Math.random() * 30,
      Contrast: 26 + Math.random() * 8,
      Edge_Density: 0.18 + Math.random() * 0.08,
      Leaf_Area_Ratio: 0.62 + Math.random() * 0.2,
    },
    'K Deficiency': {
      Mean_R: 126 + Math.random() * 22,
      Mean_G: 136 + Math.random() * 16,
      Mean_B: 72 + Math.random() * 16,
      Brightness: 118 + Math.random() * 16,
      Hue_Deg: 78 + Math.random() * 18,
      Saturation_Pct: 46 + Math.random() * 14,
      Green_Coverage_Pct: 40 + Math.random() * 18,
      Excess_Green_Index: 26 + Math.random() * 20,
      Contrast: 30 + Math.random() * 10,
      Edge_Density: 0.22 + Math.random() * 0.1,
      Leaf_Area_Ratio: 0.54 + Math.random() * 0.16,
    },
    'N Deficiency': {
      Mean_R: 136 + Math.random() * 18,
      Mean_G: 146 + Math.random() * 18,
      Mean_B: 78 + Math.random() * 16,
      Brightness: 128 + Math.random() * 14,
      Hue_Deg: 68 + Math.random() * 18,
      Saturation_Pct: 38 + Math.random() * 14,
      Green_Coverage_Pct: 34 + Math.random() * 16,
      Excess_Green_Index: 12 + Math.random() * 18,
      Contrast: 24 + Math.random() * 10,
      Edge_Density: 0.2 + Math.random() * 0.08,
      Leaf_Area_Ratio: 0.58 + Math.random() * 0.14,
    },
    'P Deficiency': {
      Mean_R: 118 + Math.random() * 18,
      Mean_G: 112 + Math.random() * 16,
      Mean_B: 92 + Math.random() * 18,
      Brightness: 110 + Math.random() * 16,
      Hue_Deg: 56 + Math.random() * 26,
      Saturation_Pct: 44 + Math.random() * 18,
      Green_Coverage_Pct: 29 + Math.random() * 14,
      Excess_Green_Index: -8 + Math.random() * 18,
      Contrast: 31 + Math.random() * 10,
      Edge_Density: 0.26 + Math.random() * 0.1,
      Leaf_Area_Ratio: 0.49 + Math.random() * 0.16,
    },
    'Fungal Infection': {
      Mean_R: 96 + Math.random() * 20,
      Mean_G: 108 + Math.random() * 18,
      Mean_B: 72 + Math.random() * 16,
      Brightness: 98 + Math.random() * 16,
      Hue_Deg: 84 + Math.random() * 20,
      Saturation_Pct: 34 + Math.random() * 14,
      Green_Coverage_Pct: 26 + Math.random() * 18,
      Excess_Green_Index: 2 + Math.random() * 18,
      Contrast: 36 + Math.random() * 12,
      Edge_Density: 0.31 + Math.random() * 0.12,
      Leaf_Area_Ratio: 0.42 + Math.random() * 0.18,
    },
    Unknown: {
      Mean_R: 110,
      Mean_G: 110,
      Mean_B: 110,
      Brightness: 110,
      Hue_Deg: 0,
      Saturation_Pct: 0,
      Green_Coverage_Pct: 0,
      Excess_Green_Index: 0,
      Contrast: 0,
      Edge_Density: 0,
      Leaf_Area_Ratio: 0,
    },
  };

  const classInfo = inferClassLabel(label);
  const profile = profiles[label];
  const imageId = `hydro_leaf_${String(index).padStart(3, '0')}.png`;

  return {
    Image_ID: imageId,
    Source_Path: `demo/${label.toLowerCase().replace(/\s+/g, '_')}/${imageId}`,
    Class_Label: label,
    Class_Index: classInfo.index,
    Mean_R: round(profile.Mean_R),
    Mean_G: round(profile.Mean_G),
    Mean_B: round(profile.Mean_B),
    Brightness: round(profile.Brightness),
    Hue_Deg: round(profile.Hue_Deg),
    Saturation_Pct: round(profile.Saturation_Pct),
    Green_Coverage_Pct: round(profile.Green_Coverage_Pct),
    Excess_Green_Index: round(profile.Excess_Green_Index),
    Contrast: round(profile.Contrast),
    Edge_Density: round(profile.Edge_Density, 3),
    Leaf_Area_Ratio: round(profile.Leaf_Area_Ratio, 3),
  };
}

export function createDefaultHydroponicDataset() {
  const labels: HydroponicClassLabel[] = [
    ...Array(18).fill('Healthy'),
    ...Array(12).fill('K Deficiency'),
    ...Array(12).fill('N Deficiency'),
    ...Array(12).fill('P Deficiency'),
    ...Array(10).fill('Fungal Infection'),
  ] as HydroponicClassLabel[];

  return labels.map((label, index) => createSyntheticRecord(index + 1, label));
}

function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error('Failed to load image for metadata extraction.'));
    };
    image.src = imageUrl;
  });
}

export async function extractMetadataFromImageBlob(
  blob: Blob,
  imageId: string,
  sourcePath: string,
): Promise<HydroponicImageRecord> {
  const image = await blobToImage(blob);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });

  if (!context) {
    throw new Error('Canvas context is unavailable in this browser.');
  }

  const maxSide = 160;
  const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
  canvas.width = Math.max(24, Math.round(image.width * scale));
  canvas.height = Math.max(24, Math.round(image.height * scale));
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const totalPixels = canvas.width * canvas.height;

  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumBrightness = 0;
  let sumHue = 0;
  let sumSaturation = 0;
  let sumExg = 0;
  let leafPixels = 0;
  let greenPixels = 0;

  const brightnessMap = new Array<number>(totalPixels).fill(0);

  for (let index = 0; index < pixels.length; index += 4) {
    const pixelIndex = index / 4;
    const r = pixels[index];
    const g = pixels[index + 1];
    const b = pixels[index + 2];
    const alpha = pixels[index + 3] / 255;

    const brightness = (0.299 * r + 0.587 * g + 0.114 * b) * alpha;
    const hsv = toHsv(r, g, b);
    const exg = 2 * g - r - b;
    const channelSpread = Math.max(r, g, b) - Math.min(r, g, b);
    const isLeafLike = alpha > 0.2 && brightness < 245 && channelSpread > 12;
    const isGreenPixel = isLeafLike && g > r * 0.95 && g > b * 1.05 && g > 45;

    sumR += r;
    sumG += g;
    sumB += b;
    sumBrightness += brightness;
    sumHue += hsv.hue;
    sumSaturation += hsv.saturation;
    sumExg += exg;
    brightnessMap[pixelIndex] = brightness;

    if (isLeafLike) leafPixels++;
    if (isGreenPixel) greenPixels++;
  }

  let varianceAccumulator = 0;
  const meanBrightness = sumBrightness / totalPixels;

  for (const brightness of brightnessMap) {
    varianceAccumulator += (brightness - meanBrightness) ** 2;
  }

  let edgeCount = 0;
  const edgeThreshold = 24;

  for (let y = 0; y < canvas.height - 1; y++) {
    for (let x = 0; x < canvas.width - 1; x++) {
      const current = brightnessMap[y * canvas.width + x];
      const right = brightnessMap[y * canvas.width + (x + 1)];
      const below = brightnessMap[(y + 1) * canvas.width + x];

      if (Math.abs(current - right) + Math.abs(current - below) > edgeThreshold) {
        edgeCount++;
      }
    }
  }

  const classInfo = inferClassLabel(sourcePath || imageId);

  return {
    Image_ID: imageId,
    Source_Path: sourcePath,
    Class_Label: classInfo.label,
    Class_Index: classInfo.index,
    Mean_R: round(sumR / totalPixels),
    Mean_G: round(sumG / totalPixels),
    Mean_B: round(sumB / totalPixels),
    Brightness: round(meanBrightness),
    Hue_Deg: round(sumHue / totalPixels),
    Saturation_Pct: round(sumSaturation / totalPixels),
    Green_Coverage_Pct: round((greenPixels / totalPixels) * 100),
    Excess_Green_Index: round(sumExg / totalPixels),
    Contrast: round(Math.sqrt(varianceAccumulator / totalPixels)),
    Edge_Density: round(edgeCount / totalPixels, 3),
    Leaf_Area_Ratio: round(clamp(leafPixels / totalPixels, 0, 1), 3),
  };
}
