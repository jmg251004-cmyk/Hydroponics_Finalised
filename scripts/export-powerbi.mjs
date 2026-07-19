import fs from 'node:fs';
import path from 'node:path';

import Papa from 'papaparse';

const FEATURE_FIELDS = [
  ['Avg_Red', 'Avg_Red'],
  ['Avg_Green', 'Avg_Green'],
  ['Avg_Blue', 'Avg_Blue'],
  ['Brightness', 'Brightness'],
  ['Contrast', 'Contrast'],
  ['Green_Pixel_Ratio', 'Green_Pixel_Ratio'],
  ['Edge_Density', 'Edge_Density'],
  ['Aspect_Ratio', 'Aspect_Ratio'],
  ['Leaf_Area_Pixels', 'Leaf_Area_Pixels'],
];

const CLASS_MAP = {
  '-K': 'Potassium Deficiency',
  '-N': 'Nitrogen Deficiency',
  '-P': 'Phosphorous Deficiency',
  FN: 'Pythium / Fungal Infection',
  Healthy: 'Healthy',
};

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function variance(values) {
  if (values.length <= 1) return 0;
  const avg = mean(values);
  return values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / (values.length - 1);
}

function standardDeviation(values) {
  return Math.sqrt(variance(values));
}

function round(value, decimals = 4) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function toCsv(rows) {
  return Papa.unparse(rows, { quotes: false });
}

function inferLabel(row) {
  const raw = String(row.Class_Label ?? row.Source_Folder ?? row.File_Name ?? row.Image_ID ?? '').trim();
  return CLASS_MAP[raw] ?? raw;
}

function cleanRow(row) {
  const width = Number(row.Width ?? 0);
  const height = Number(row.Height ?? 0);
  const leafAreaPixels = Number(row.Leaf_Area_Pixels ?? 0);
  const greenRatio = Number(row.Green_Pixel_Ratio ?? 0);

  return {
    Image_ID: String(row.Image_ID ?? ''),
    File_Name: String(row.File_Name ?? ''),
    Class_Label: inferLabel(row),
    Source_Folder: String(row.Source_Folder ?? ''),
    Width: width,
    Height: height,
    Aspect_Ratio: Number(row.Aspect_Ratio ?? 0),
    Avg_Red: Number(row.Avg_Red ?? 0),
    Avg_Green: Number(row.Avg_Green ?? 0),
    Avg_Blue: Number(row.Avg_Blue ?? 0),
    Brightness: Number(row.Brightness ?? 0),
    Contrast: Number(row.Contrast ?? 0),
    Leaf_Area_Pixels: leafAreaPixels,
    Green_Pixel_Ratio: greenRatio,
    Green_Coverage_Pct: greenRatio * 100,
    Edge_Density: Number(row.Edge_Density ?? 0),
    Leaf_Area_Ratio: width > 0 && height > 0 ? leafAreaPixels / (width * height) : 0,
    Excess_Green_Index:
      2 * Number(row.Avg_Green ?? 0) - Number(row.Avg_Red ?? 0) - Number(row.Avg_Blue ?? 0),
  };
}

function normalizeRows(rows) {
  const stats = Object.fromEntries(
    FEATURE_FIELDS.map(([key]) => {
      const values = rows.map((row) => Number(row[key]));
      return [key, { mean: mean(values), deviation: standardDeviation(values) || 1 }];
    }),
  );

  return rows.map((row) => ({
    ...row,
    __values: Object.fromEntries(
      FEATURE_FIELDS.map(([key]) => [key, (Number(row[key]) - stats[key].mean) / stats[key].deviation]),
    ),
  }));
}

function distance(left, right) {
  return Math.sqrt(
    FEATURE_FIELDS.reduce((sum, [key]) => sum + (left[key] - right[key]) ** 2, 0),
  );
}

function predictKnn(trainRows, sample, k) {
  const neighbors = trainRows
    .map((row) => ({
      label: row.Class_Label,
      distance: distance(row.__values, sample.__values),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.min(k, trainRows.length));

  const votes = new Map();
  for (const neighbor of neighbors) {
    const weight = 1 / (neighbor.distance + 1e-6);
    votes.set(neighbor.label, (votes.get(neighbor.label) ?? 0) + weight);
  }

  return [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Unknown';
}

function centroidModel(trainRows) {
  const byClass = new Map();
  for (const row of trainRows) {
    if (!byClass.has(row.Class_Label)) byClass.set(row.Class_Label, []);
    byClass.get(row.Class_Label).push(row);
  }

  return [...byClass.entries()].map(([label, rows]) => ({
    label,
    centroid: Object.fromEntries(
      FEATURE_FIELDS.map(([key]) => [key, mean(rows.map((row) => row.__values[key]))]),
    ),
  }));
}

function predictCentroid(model, sample) {
  return model
    .map((entry) => ({
      label: entry.label,
      distance: distance(entry.centroid, sample.__values),
    }))
    .sort((a, b) => a.distance - b.distance)[0]?.label ?? 'Unknown';
}

function gaussianModel(trainRows) {
  const byClass = new Map();
  for (const row of trainRows) {
    if (!byClass.has(row.Class_Label)) byClass.set(row.Class_Label, []);
    byClass.get(row.Class_Label).push(row);
  }

  return [...byClass.entries()].map(([label, rows]) => ({
    label,
    prior: rows.length / trainRows.length,
    features: Object.fromEntries(
      FEATURE_FIELDS.map(([key]) => {
        const values = rows.map((row) => row.__values[key]);
        return [key, { mean: mean(values), variance: variance(values) || 1e-6 }];
      }),
    ),
  }));
}

function predictGaussian(model, sample) {
  return model
    .map((entry) => {
      let score = Math.log(entry.prior || 1e-9);
      for (const [key] of FEATURE_FIELDS) {
        const params = entry.features[key];
        const value = sample.__values[key];
        score += -0.5 * Math.log(2 * Math.PI * params.variance) - ((value - params.mean) ** 2) / (2 * params.variance);
      }
      return { label: entry.label, score };
    })
    .sort((a, b) => b.score - a.score)[0]?.label ?? 'Unknown';
}

function macroF1(expected, predicted) {
  const labels = [...new Set(expected)];
  const values = labels.map((label) => {
    let tp = 0;
    let fp = 0;
    let fn = 0;
    for (let i = 0; i < expected.length; i += 1) {
      if (predicted[i] === label && expected[i] === label) tp += 1;
      if (predicted[i] === label && expected[i] !== label) fp += 1;
      if (predicted[i] !== label && expected[i] === label) fn += 1;
    }
    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    return precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  });
  return mean(values);
}

function benchmarkModel(rows, mode) {
  const expected = [];
  const predicted = [];

  for (let i = 0; i < rows.length; i += 1) {
    const trainRows = rows.filter((_, index) => index !== i);
    const sample = rows[i];

    let prediction = 'Unknown';
    if (mode.type === 'knn') prediction = predictKnn(trainRows, sample, mode.k);
    if (mode.type === 'centroid') prediction = predictCentroid(centroidModel(trainRows), sample);
    if (mode.type === 'gaussian') prediction = predictGaussian(gaussianModel(trainRows), sample);

    expected.push(sample.Class_Label);
    predicted.push(prediction);
  }

  const accuracy = expected.reduce((sum, label, index) => sum + Number(label === predicted[index]), 0) / expected.length;
  return {
    expected,
    predicted,
    accuracy,
    macroF1: macroF1(expected, predicted),
  };
}

function featureScores(rows) {
  const labels = [...new Set(rows.map((row) => row.Class_Label))];
  return [
    ...FEATURE_FIELDS.map(([key]) => {
      const overall = mean(rows.map((row) => row[key]));
      let ssBetween = 0;
      let ssWithin = 0;

      for (const label of labels) {
        const classRows = rows.filter((row) => row.Class_Label === label);
        const values = classRows.map((row) => row[key]);
        const classMean = mean(values);
        ssBetween += values.length * (classMean - overall) ** 2;
        ssWithin += values.reduce((sum, value) => sum + (value - classMean) ** 2, 0);
      }

      const dfBetween = Math.max(labels.length - 1, 1);
      const dfWithin = Math.max(rows.length - labels.length, 1);
      const fScore = (ssBetween / dfBetween) / Math.max(ssWithin / dfWithin, 1e-9);

      return { Feature: key, F_Test_Score: round(fScore, 6) };
    }),
    {
      Feature: 'Excess_Green_Index',
      F_Test_Score: round((() => {
        const values = rows.map((row) => row.Excess_Green_Index);
        const overall = mean(values);
        const labelsLocal = [...new Set(rows.map((row) => row.Class_Label))];
        let ssBetween = 0;
        let ssWithin = 0;
        for (const label of labelsLocal) {
          const classRows = rows.filter((row) => row.Class_Label === label);
          const classValues = classRows.map((row) => row.Excess_Green_Index);
          const classMean = mean(classValues);
          ssBetween += classValues.length * (classMean - overall) ** 2;
          ssWithin += classValues.reduce((sum, value) => sum + (value - classMean) ** 2, 0);
        }
        const dfBetween = Math.max(labelsLocal.length - 1, 1);
        const dfWithin = Math.max(rows.length - labelsLocal.length, 1);
        return (ssBetween / dfBetween) / Math.max(ssWithin / dfWithin, 1e-9);
      })(), 6),
    },
    {
      Feature: 'Leaf_Area_Ratio',
      F_Test_Score: round((() => {
        const values = rows.map((row) => row.Leaf_Area_Ratio);
        const overall = mean(values);
        const labelsLocal = [...new Set(rows.map((row) => row.Class_Label))];
        let ssBetween = 0;
        let ssWithin = 0;
        for (const label of labelsLocal) {
          const classRows = rows.filter((row) => row.Class_Label === label);
          const classValues = classRows.map((row) => row.Leaf_Area_Ratio);
          const classMean = mean(classValues);
          ssBetween += classValues.length * (classMean - overall) ** 2;
          ssWithin += classValues.reduce((sum, value) => sum + (value - classMean) ** 2, 0);
        }
        const dfBetween = Math.max(labelsLocal.length - 1, 1);
        const dfWithin = Math.max(rows.length - labelsLocal.length, 1);
        return (ssBetween / dfBetween) / Math.max(ssWithin / dfWithin, 1e-9);
      })(), 6),
    },
    {
      Feature: 'Green_Coverage_Pct',
      F_Test_Score: round((() => {
        const values = rows.map((row) => row.Green_Coverage_Pct);
        const overall = mean(values);
        const labelsLocal = [...new Set(rows.map((row) => row.Class_Label))];
        let ssBetween = 0;
        let ssWithin = 0;
        for (const label of labelsLocal) {
          const classRows = rows.filter((row) => row.Class_Label === label);
          const classValues = classRows.map((row) => row.Green_Coverage_Pct);
          const classMean = mean(classValues);
          ssBetween += classValues.length * (classMean - overall) ** 2;
          ssWithin += classValues.reduce((sum, value) => sum + (value - classMean) ** 2, 0);
        }
        const dfBetween = Math.max(labelsLocal.length - 1, 1);
        const dfWithin = Math.max(rows.length - labelsLocal.length, 1);
        return (ssBetween / dfBetween) / Math.max(ssWithin / dfWithin, 1e-9);
      })(), 6),
    },
  ].sort((a, b) => b.F_Test_Score - a.F_Test_Score);
}

function confusionRows(labels, expected, predicted) {
  return labels.map((actual) => {
    const row = { Actual_Class: actual };
    for (const predictedLabel of labels) row[predictedLabel] = 0;
    for (let i = 0; i < expected.length; i += 1) {
      if (expected[i] === actual) row[predicted[i]] += 1;
    }
    return row;
  });
}

const inputPath = process.argv[2]
  ? path.resolve(process.argv[2])
  : path.resolve('client/src/lib/metadata.csv');
const outputDir = process.argv[3]
  ? path.resolve(process.argv[3])
  : path.resolve('powerbi_exports');

const csvText = fs.readFileSync(inputPath, 'utf8');
const parsed = Papa.parse(csvText.trim(), { header: true, dynamicTyping: true, skipEmptyLines: true });
const cleanedRows = parsed.data.map(cleanRow).filter((row) => row.Image_ID && row.Class_Label);
const normalizedRows = normalizeRows(cleanedRows);
const labels = [...new Set(cleanedRows.map((row) => row.Class_Label))];

const modelResults = [
  { name: '1-NN Metadata Classifier', type: 'knn', k: 1 },
  { name: '3-NN Metadata Classifier', type: 'knn', k: 3 },
  { name: '5-NN Metadata Classifier', type: 'knn', k: 5 },
  { name: 'Nearest Centroid', type: 'centroid' },
  { name: 'Gaussian Naive Bayes', type: 'gaussian' },
].map((model) => ({
  model,
  metrics: benchmarkModel(normalizedRows, model),
}));

const bestModel = modelResults.reduce((best, current) =>
  current.metrics.accuracy > best.metrics.accuracy ? current : best,
);

const classSummary = labels.map((label) => {
  const rows = cleanedRows.filter((row) => row.Class_Label === label);
  return {
    Class_Label: label,
    Sample_Count: rows.length,
    Avg_Brightness: round(mean(rows.map((row) => row.Brightness)), 4),
    Avg_Contrast: round(mean(rows.map((row) => row.Contrast)), 4),
    Avg_Green_Coverage_Pct: round(mean(rows.map((row) => row.Green_Coverage_Pct)), 4),
    Avg_Excess_Green_Index: round(mean(rows.map((row) => row.Excess_Green_Index)), 4),
    Avg_Edge_Density: round(mean(rows.map((row) => row.Edge_Density)), 6),
  };
});

const benchmarkRows = modelResults.map(({ model, metrics }) => ({
  Model_Name: model.name,
  Accuracy_Pct: round(metrics.accuracy * 100, 4),
  Macro_F1_Pct: round(metrics.macroF1 * 100, 4),
}));

const cardRows = [
  { Metric: 'Dataset Rows', Value: cleanedRows.length },
  { Metric: 'Distinct Classes', Value: labels.length },
  { Metric: 'Best Model', Value: bestModel.model.name },
  { Metric: 'Best Accuracy (%)', Value: round(bestModel.metrics.accuracy * 100, 4) },
  { Metric: 'Best Macro F1 (%)', Value: round(bestModel.metrics.macroF1 * 100, 4) },
  { Metric: 'Top F-Test Feature', Value: featureScores(cleanedRows)[0]?.Feature ?? '' },
];

const factRows = cleanedRows.map((row) => ({
  ...row,
  Recommended_Model: bestModel.model.name,
}));

const confusionMatrix = confusionRows(labels, bestModel.metrics.expected, bestModel.metrics.predicted);

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'fact_leaf_metadata.csv'), toCsv(factRows));
fs.writeFileSync(path.join(outputDir, 'class_summary.csv'), toCsv(classSummary));
fs.writeFileSync(path.join(outputDir, 'feature_f_scores.csv'), toCsv(featureScores(cleanedRows)));
fs.writeFileSync(path.join(outputDir, 'model_benchmarks.csv'), toCsv(benchmarkRows));
fs.writeFileSync(path.join(outputDir, 'confusion_matrix_best_model.csv'), toCsv(confusionMatrix));
fs.writeFileSync(path.join(outputDir, 'dashboard_cards.csv'), toCsv(cardRows));

console.log(`Power BI export pack created in ${outputDir}`);
console.log(`Best model: ${bestModel.model.name}`);
console.log(`Accuracy: ${round(bestModel.metrics.accuracy * 100, 2)}%`);
