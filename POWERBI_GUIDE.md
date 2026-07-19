# Power BI Guide

Use this project dataset in Power BI with the generated export pack.

## Generate the tables

Run:

```powershell
npm run export:powerbi -- "C:\Users\JOSELET MEBEL GLANCY\Downloads\metadata (1).csv"
```

This creates a `powerbi_exports` folder with:

- `fact_leaf_metadata.csv`
- `class_summary.csv`
- `feature_f_scores.csv`
- `model_benchmarks.csv`
- `confusion_matrix_best_model.csv`
- `dashboard_cards.csv`

## Recommended Power BI pages

1. Overview
   Use `dashboard_cards.csv` and `class_summary.csv`

2. Class Distribution
   Use `fact_leaf_metadata.csv`
   Visuals: donut chart, clustered bar chart

3. Statistical Analysis
   Use `feature_f_scores.csv`
   Visuals: sorted bar chart for F-test scores

4. Model Evaluation
   Use `model_benchmarks.csv` and `confusion_matrix_best_model.csv`
   Visuals: bar chart for accuracy, matrix for confusion matrix

5. Feature Relationships
   Use `fact_leaf_metadata.csv`
   Visuals: scatter plots for `Brightness`, `Green_Coverage_Pct`, `Contrast`, `Excess_Green_Index`

## Best model from this dataset

The export script benchmarks multiple classical models and records the best one in:

- `dashboard_cards.csv`
- `model_benchmarks.csv`

## Suggested report points

- Problem statement: classify nutrient deficiency / fungal infection from leaf metadata
- Dataset size: 208 samples
- Classes: Potassium Deficiency, Nitrogen Deficiency, Phosphorous Deficiency, Pythium / Fungal Infection
- Statistical method: ANOVA F-test feature ranking
- Predictive comparison: 1-NN, 3-NN, 5-NN, nearest centroid, Gaussian Naive Bayes
- Recommended model: highest validation accuracy from `model_benchmarks.csv`
