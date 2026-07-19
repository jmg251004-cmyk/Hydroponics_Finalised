import * as ss from 'simple-statistics';

import { type HydroponicClassLabel, type HydroponicImageRecord } from './hydroponicMetadata';

export const MODEL_FEATURE_FIELDS = [
  { key: 'Mean_R', label: 'Red Channel Mean' },
  { key: 'Mean_G', label: 'Green Channel Mean' },
  { key: 'Mean_B', label: 'Blue Channel Mean' },
  { key: 'Brightness', label: 'Brightness' },
  { key: 'Hue_Deg', label: 'Hue' },
  { key: 'Saturation_Pct', label: 'Saturation' },
  { key: 'Green_Coverage_Pct', label: 'Green Coverage %' },
  { key: 'Excess_Green_Index', label: 'Excess Green Index' },
  { key: 'Contrast', label: 'Contrast' },
  { key: 'Edge_Density', label: 'Edge Density' },
  { key: 'Leaf_Area_Ratio', label: 'Leaf Area Ratio' },
] as const;

export type ModelFeatureKey = (typeof MODEL_FEATURE_FIELDS)[number]['key'];

type AlgorithmKind = 'knn' | 'centroid' | 'gaussian_nb';

interface NormalizedSample {
  label: HydroponicClassLabel;
  raw: HydroponicImageRecord;
  values: Record<ModelFeatureKey, number>;
}

interface KNNAlgorithm {
  kind: 'knn';
  name: string;
  k: number;
}

interface CentroidAlgorithm {
  kind: 'centroid';
  name: string;
}

interface GaussianNBAlgorithm {
  kind: 'gaussian_nb';
  name: string;
}

type PlantAlgorithm = KNNAlgorithm | CentroidAlgorithm | GaussianNBAlgorithm;

export interface ModelBenchmark {
  name: string;
  kind: AlgorithmKind;
  accuracy: number;
  macroF1: number;
}

export interface ConfusionRow {
  actual: HydroponicClassLabel;
  values: Record<HydroponicClassLabel, number>;
}

export interface FeatureScore {
  key: ModelFeatureKey;
  label: string;
  fScore: number;
}

export interface PlantModel {
  algorithmName: string;
  featureStats: Record<ModelFeatureKey, { mean: number; deviation: number }>;
  featureScores: FeatureScore[];
  samples: NormalizedSample[];
  benchmarks: ModelBenchmark[];
  confusionMatrix: ConfusionRow[];
  accuracy: number;
  macroF1: number;
  k: number;
  classCentroids: Array<{
    label: HydroponicClassLabel;
    centroid: Record<ModelFeatureKey, number>;
  }>;
  classifier: PlantAlgorithm;
}

interface GaussianNBModel {
  priors: Record<HydroponicClassLabel, number>;
  params: Record<HydroponicClassLabel, Record<ModelFeatureKey, { mean: number; variance: number }>>;
}

const MODEL_CANDIDATES: PlantAlgorithm[] = [
  { kind: 'knn', name: '1-NN Metadata Classifier', k: 1 },
  { kind: 'knn', name: '3-NN Metadata Classifier', k: 3 },
  { kind: 'knn', name: '5-NN Metadata Classifier', k: 5 },
  { kind: 'centroid', name: 'Nearest Centroid', k: 0 } as CentroidAlgorithm & { k: 0 },
  { kind: 'gaussian_nb', name: 'Gaussian Naive Bayes' },
];

export function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function normalizeValue(value: number, mean: number, deviation: number) {
  if (!Number.isFinite(value)) return 0;
  if (!Number.isFinite(deviation) || deviation === 0) return value - mean;
  return (value - mean) / deviation;
}

function computeDistance(
  left: Record<ModelFeatureKey, number>,
  right: Record<ModelFeatureKey, number>,
) {
  return Math.sqrt(
    MODEL_FEATURE_FIELDS.reduce((sum, { key }) => sum + (left[key] - right[key]) ** 2, 0),
  );
}

function voteNeighbors(neighbors: Array<{ label: HydroponicClassLabel; distance: number }>) {
  return Array.from(
    neighbors.reduce((map, neighbor) => {
      const weight = 1 / (neighbor.distance + 1e-6);
      map.set(neighbor.label, (map.get(neighbor.label) ?? 0) + weight);
      return map;
    }, new Map<HydroponicClassLabel, number>()),
  ).sort((a, b) => b[1] - a[1]);
}

function predictWithKNN(
  samples: NormalizedSample[],
  input: Record<ModelFeatureKey, number>,
  k: number,
) {
  const neighbors = samples
    .map((sample) => ({
      label: sample.label,
      distance: computeDistance(input, sample.values),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, Math.min(k, samples.length));

  const votes = voteNeighbors(neighbors);
  const bestLabel = votes[0]?.[0] ?? 'Unknown';
  const totalVote = votes.reduce((sum, [, value]) => sum + value, 0);
  const confidence = totalVote > 0 ? round(((votes[0]?.[1] ?? 0) / totalVote) * 100, 1) : 0;

  return {
    bestLabel,
    neighbors,
    confidence,
    matchCount: neighbors.filter((neighbor) => neighbor.label === bestLabel).length,
  };
}

function computeCentroids(samples: NormalizedSample[]) {
  const grouped = samples.reduce((map, sample) => {
    if (!map.has(sample.label)) map.set(sample.label, []);
    map.get(sample.label)?.push(sample);
    return map;
  }, new Map<HydroponicClassLabel, NormalizedSample[]>());

  return Array.from(grouped.entries()).map(([label, group]) => ({
    label,
    centroid: Object.fromEntries(
      MODEL_FEATURE_FIELDS.map(({ key }) => [key, ss.mean(group.map((sample) => sample.values[key]))]),
    ) as Record<ModelFeatureKey, number>,
  }));
}

function predictWithCentroid(
  centroids: Array<{ label: HydroponicClassLabel; centroid: Record<ModelFeatureKey, number> }>,
  input: Record<ModelFeatureKey, number>,
) {
  const ranked = centroids
    .map((entry) => ({
      label: entry.label,
      distance: computeDistance(input, entry.centroid),
    }))
    .sort((a, b) => a.distance - b.distance);

  const best = ranked[0];
  const totalInverseDistance = ranked.reduce((sum, entry) => sum + 1 / (entry.distance + 1e-6), 0);
  const confidence = totalInverseDistance > 0 && best
    ? round(((1 / (best.distance + 1e-6)) / totalInverseDistance) * 100, 1)
    : 0;

  return {
    bestLabel: best?.label ?? 'Unknown',
    neighbors: ranked,
    confidence,
    matchCount: 1,
  };
}

function fitGaussianNB(samples: NormalizedSample[]): GaussianNBModel {
  const labels = Array.from(new Set(samples.map((sample) => sample.label))) as HydroponicClassLabel[];
  const priors = {} as Record<HydroponicClassLabel, number>;
  const params = {} as Record<HydroponicClassLabel, Record<ModelFeatureKey, { mean: number; variance: number }>>;

  labels.forEach((label) => {
    const classSamples = samples.filter((sample) => sample.label === label);
    priors[label] = classSamples.length / samples.length;
    params[label] = Object.fromEntries(
      MODEL_FEATURE_FIELDS.map(({ key }) => {
        const values = classSamples.map((sample) => sample.values[key]);
        return [key, { mean: ss.mean(values), variance: ss.variance(values) || 1e-6 }];
      }),
    ) as Record<ModelFeatureKey, { mean: number; variance: number }>;
  });

  return { priors, params };
}

function predictWithGaussianNB(model: GaussianNBModel, input: Record<ModelFeatureKey, number>) {
  const scores = Object.entries(model.params)
    .map(([label, featureMap]) => {
      let logProbability = Math.log(model.priors[label as HydroponicClassLabel] || 1e-9);

      MODEL_FEATURE_FIELDS.forEach(({ key }) => {
        const { mean, variance } = featureMap[key];
        const value = input[key];
        logProbability += -0.5 * Math.log(2 * Math.PI * variance) - ((value - mean) ** 2) / (2 * variance);
      });

      return { label: label as HydroponicClassLabel, score: logProbability };
    })
    .sort((a, b) => b.score - a.score);

  const best = scores[0];
  const maxScore = best?.score ?? 0;
  const normalized = scores.map((entry) => Math.exp(entry.score - maxScore));
  const total = normalized.reduce((sum, value) => sum + value, 0);
  const confidence = total > 0 ? round((normalized[0] / total) * 100, 1) : 0;

  return {
    bestLabel: best?.label ?? 'Unknown',
    neighbors: scores.map((entry) => ({ label: entry.label, distance: -entry.score })),
    confidence,
    matchCount: 1,
  };
}

function computeMacroF1(expected: HydroponicClassLabel[], predicted: HydroponicClassLabel[]) {
  const labels = Array.from(new Set(expected)) as HydroponicClassLabel[];
  const scores = labels.map((label) => {
    let tp = 0;
    let fp = 0;
    let fn = 0;

    expected.forEach((expectedLabel, index) => {
      const predictedLabel = predicted[index];
      if (predictedLabel === label && expectedLabel === label) tp += 1;
      if (predictedLabel === label && expectedLabel !== label) fp += 1;
      if (predictedLabel !== label && expectedLabel === label) fn += 1;
    });

    const precision = tp + fp === 0 ? 0 : tp / (tp + fp);
    const recall = tp + fn === 0 ? 0 : tp / (tp + fn);
    return precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
  });

  return scores.length ? ss.mean(scores) : 0;
}

function computeFeatureScores(labeledData: HydroponicImageRecord[]) {
  const grouped = Array.from(
    labeledData.reduce((map, record) => {
      if (!map.has(record.Class_Label)) map.set(record.Class_Label, []);
      map.get(record.Class_Label)?.push(record);
      return map;
    }, new Map<HydroponicClassLabel, HydroponicImageRecord[]>()),
  );

  return MODEL_FEATURE_FIELDS.map(({ key, label }) => {
    const allValues = labeledData.map((record) => Number(record[key]));
    const grandMean = ss.mean(allValues);

    const ssBetween = grouped.reduce((sum, [, rows]) => {
      const values = rows.map((record) => Number(record[key]));
      const mean = ss.mean(values);
      return sum + values.length * (mean - grandMean) ** 2;
    }, 0);

    const ssWithin = grouped.reduce((sum, [, rows]) => {
      const values = rows.map((record) => Number(record[key]));
      const mean = ss.mean(values);
      return sum + values.reduce((accumulator, value) => accumulator + (value - mean) ** 2, 0);
    }, 0);

    const dfBetween = Math.max(grouped.length - 1, 1);
    const dfWithin = Math.max(labeledData.length - grouped.length, 1);
    const msBetween = ssBetween / dfBetween;
    const msWithin = ssWithin / dfWithin;
    const fScore = msWithin === 0 ? 0 : msBetween / msWithin;

    return { key, label, fScore: round(fScore, 3) };
  }).sort((a, b) => b.fScore - a.fScore);
}

function benchmarkAlgorithm(samples: NormalizedSample[], algorithm: PlantAlgorithm) {
  const expected: HydroponicClassLabel[] = [];
  const predicted: HydroponicClassLabel[] = [];
  const labelSet = Array.from(new Set(samples.map((sample) => sample.label))) as HydroponicClassLabel[];
  const confusionTemplate = Object.fromEntries(
    labelSet.map((label) => [label, 0]),
  ) as Record<HydroponicClassLabel, number>;
  const confusionMap = Object.fromEntries(
    labelSet.map((label) => [label, { ...confusionTemplate }]),
  ) as Record<HydroponicClassLabel, Record<HydroponicClassLabel, number>>;

  samples.forEach((sample, index) => {
    const trainSamples = samples.filter((_, sampleIndex) => sampleIndex !== index);
    let label: HydroponicClassLabel = 'Unknown';

    if (algorithm.kind === 'knn') {
      label = predictWithKNN(trainSamples, sample.values, algorithm.k).bestLabel as HydroponicClassLabel;
    } else if (algorithm.kind === 'centroid') {
      label = predictWithCentroid(computeCentroids(trainSamples), sample.values).bestLabel as HydroponicClassLabel;
    } else {
      label = predictWithGaussianNB(fitGaussianNB(trainSamples), sample.values).bestLabel as HydroponicClassLabel;
    }

    expected.push(sample.label);
    predicted.push(label);
    confusionMap[sample.label][label] += 1;
  });

  const correct = expected.reduce((sum, label, index) => sum + Number(label === predicted[index]), 0);

  return {
    benchmark: {
      name: algorithm.name,
      kind: algorithm.kind,
      accuracy: round((correct / samples.length) * 100, 1),
      macroF1: round(computeMacroF1(expected, predicted) * 100, 1),
    } satisfies ModelBenchmark,
    confusionMatrix: labelSet.map((label) => ({
      actual: label,
      values: confusionMap[label],
    })),
  };
}

export function buildPlantModel(data: HydroponicImageRecord[]): PlantModel | null {
  const labeledData = data.filter(
    (record) =>
      record.Class_Label !== 'Unknown' &&
      MODEL_FEATURE_FIELDS.every(({ key }) => Number.isFinite(Number(record[key]))),
  );

  if (labeledData.length < 5) return null;

  const featureStats = Object.fromEntries(
    MODEL_FEATURE_FIELDS.map(({ key }) => {
      const series = labeledData.map((record) => Number(record[key]));
      return [key, { mean: ss.mean(series), deviation: ss.standardDeviation(series) || 1 }];
    }),
  ) as Record<ModelFeatureKey, { mean: number; deviation: number }>;

  const samples = labeledData.map((record) => ({
    label: record.Class_Label,
    raw: record,
    values: Object.fromEntries(
      MODEL_FEATURE_FIELDS.map(({ key }) => [
        key,
        normalizeValue(Number(record[key]), featureStats[key].mean, featureStats[key].deviation),
      ]),
    ) as Record<ModelFeatureKey, number>,
  }));

  const evaluated = MODEL_CANDIDATES.map((candidate) => ({
    candidate,
    ...benchmarkAlgorithm(samples, candidate),
  }));

  const best = evaluated.reduce((winner, current) => {
    if (
      current.benchmark.accuracy > winner.benchmark.accuracy ||
      (
        current.benchmark.accuracy === winner.benchmark.accuracy &&
        current.benchmark.macroF1 > winner.benchmark.macroF1
      )
    ) {
      return current;
    }

    return winner;
  });

  const classCentroids = Array.from(
    labeledData.reduce((map, record) => {
      if (!map.has(record.Class_Label)) map.set(record.Class_Label, []);
      map.get(record.Class_Label)?.push(record);
      return map;
    }, new Map<HydroponicClassLabel, HydroponicImageRecord[]>()),
  ).map(([label, records]) => ({
    label,
    centroid: Object.fromEntries(
      MODEL_FEATURE_FIELDS.map(({ key }) => [key, ss.mean(records.map((record) => Number(record[key])))]),
    ) as Record<ModelFeatureKey, number>,
  }));

  return {
    algorithmName: best.benchmark.name,
    featureStats,
    featureScores: computeFeatureScores(labeledData),
    samples,
    benchmarks: evaluated
      .map((entry) => entry.benchmark)
      .sort((a, b) => b.accuracy - a.accuracy || b.macroF1 - a.macroF1),
    confusionMatrix: best.confusionMatrix,
    accuracy: best.benchmark.accuracy,
    macroF1: best.benchmark.macroF1,
    k: best.candidate.kind === 'knn' ? best.candidate.k : 0,
    classCentroids,
    classifier: best.candidate,
  };
}

export function predictPlantLabel(
  input: Record<ModelFeatureKey, number>,
  model: PlantModel,
) {
  if (model.classifier.kind === 'knn') {
    return predictWithKNN(model.samples, input, model.classifier.k);
  }

  if (model.classifier.kind === 'centroid') {
    return predictWithCentroid(
      model.classCentroids.map((entry) => ({
        label: entry.label,
        centroid: Object.fromEntries(
          MODEL_FEATURE_FIELDS.map(({ key }) => [
            key,
            normalizeValue(entry.centroid[key], model.featureStats[key].mean, model.featureStats[key].deviation),
          ]),
        ) as Record<ModelFeatureKey, number>,
      })),
      input,
    );
  }

  return predictWithGaussianNB(fitGaussianNB(model.samples), input);
}
