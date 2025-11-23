
import { RootRotSeverity } from './mockData';

// Raw CSV Data from User
export const CSV_RAW_DATA = `Image_ID,Root_Rot_Severity,Soil_Moisture_Percent,Root_Zone_Temp_C,Substrate_EC_mS_cm,Substrate_pH,Days_Since_Planting
plant_0000_severity_1.jpg,1,65.43,22.38,1.8,5.83,8
plant_0001_severity_1.jpg,1,63.64,24.28,0.81,5.74,6
plant_0002_severity_2.jpg,2,81.4,20.26,1.17,4.71,23
plant_0003_severity_1.jpg,1,59.88,22.59,1.56,5.76,7
plant_0004_severity_2.jpg,2,83.93,21.82,1.84,5.5,12
plant_0005_severity_0.jpg,0,58.47,22.0,1.24,6.57,3
plant_0006_severity_1.jpg,1,70.21,25.34,1.48,6.23,7
plant_0007_severity_3.jpg,3,64.95,22.51,2.58,6.25,35
plant_0008_severity_2.jpg,2,65.43,25.6,0.91,5.09,15
plant_0009_severity_0.jpg,0,48.25,17.02,1.62,6.6,3
plant_0010_severity_3.jpg,3,90.35,24.45,2.35,6.2,34
plant_0011_severity_0.jpg,0,45.75,19.29,1.74,6.87,8
plant_0012_severity_3.jpg,3,72.94,26.44,2.14,4.42,35
plant_0013_severity_3.jpg,3,71.41,22.35,2.89,4.8,15
plant_0014_severity_0.jpg,0,52.72,17.08,2.08,7.34,1
plant_0015_severity_0.jpg,0,62.65,24.74,2.18,7.18,7
plant_0016_severity_0.jpg,0,55.66,21.48,2.0,6.46,4
plant_0017_severity_1.jpg,1,67.52,21.77,0.9,5.82,9
plant_0018_severity_2.jpg,2,70.16,22.47,1.36,6.75,14
plant_0019_severity_0.jpg,0,62.26,22.12,1.43,6.47,10
plant_0020_severity_0.jpg,0,53.79,19.61,2.28,7.5,2
plant_0021_severity_2.jpg,2,84.99,25.08,1.44,5.87,18
plant_0022_severity_3.jpg,3,76.51,24.92,2.05,4.19,11
plant_0023_severity_1.jpg,1,57.09,23.26,1.77,6.09,9
plant_0024_severity_1.jpg,1,74.1,20.82,2.11,5.65,9
plant_0025_severity_3.jpg,3,88.95,21.25,2.86,5.0,30
plant_0026_severity_0.jpg,0,54.49,20.98,2.12,6.69,5
plant_0027_severity_2.jpg,2,70.74,22.74,1.18,5.09,17
plant_0028_severity_1.jpg,1,66.23,22.55,1.32,5.97,11
plant_0029_severity_0.jpg,0,55.19,22.1,1.46,6.46,4
plant_0030_severity_2.jpg,2,74.49,22.48,1.07,4.58,16
plant_0031_severity_3.jpg,3,91.75,23.99,3.22,4.49,17
plant_0032_severity_1.jpg,1,78.72,21.37,1.33,4.88,9
plant_0033_severity_0.jpg,0,66.97,20.6,1.39,6.22,8
plant_0034_severity_3.jpg,3,65.6,24.66,2.47,4.96,16
plant_0035_severity_0.jpg,0,55.2,14.16,1.9,5.94,6
plant_0036_severity_0.jpg,0,58.07,16.11,1.7,6.11,2
plant_0037_severity_1.jpg,1,71.51,21.11,1.5,5.83,11
plant_0038_severity_1.jpg,1,61.73,20.62,1.67,5.63,7
plant_0039_severity_3.jpg,3,88.96,25.88,2.4,5.52,35
plant_0040_severity_1.jpg,1,56.97,18.72,1.29,6.24,6
plant_0041_severity_2.jpg,2,91.85,21.18,1.31,4.0,18
plant_0042_severity_2.jpg,2,76.56,19.03,0.5,5.9,21
plant_0043_severity_2.jpg,2,66.72,21.45,1.16,4.36,13
plant_0044_severity_3.jpg,3,80.94,22.38,1.73,4.52,26
plant_0045_severity_0.jpg,0,55.64,23.84,2.05,5.65,5
plant_0046_severity_0.jpg,0,51.25,19.39,1.86,6.76,8
plant_0047_severity_2.jpg,2,61.35,20.77,1.06,5.16,18
plant_0048_severity_1.jpg,1,69.2,22.32,1.44,6.57,9
plant_0049_severity_2.jpg,2,54.96,22.35,0.68,6.02,19
plant_0050_severity_0.jpg,0,55.15,18.91,2.06,6.91,8
plant_0051_severity_0.jpg,0,43.67,20.16,2.06,6.35,6
plant_0052_severity_3.jpg,3,73.29,22.64,2.19,5.4,35
plant_0053_severity_0.jpg,0,55.62,19.22,1.58,6.84,5
plant_0054_severity_2.jpg,2,62.57,26.85,1.31,5.05,14
plant_0055_severity_1.jpg,1,62.81,23.85,1.97,6.28,6
plant_0056_severity_2.jpg,2,76.45,26.68,0.5,5.07,6
plant_0057_severity_2.jpg,2,68.44,20.1,0.85,6.37,12
plant_0058_severity_1.jpg,1,79.94,21.07,1.31,6.81,7
plant_0059_severity_0.jpg,0,56.05,21.86,2.19,6.45,6
plant_0060_severity_0.jpg,0,63.41,21.94,1.46,6.55,5
plant_0061_severity_1.jpg,1,60.81,23.28,1.32,5.81,6
plant_0062_severity_2.jpg,2,69.77,19.75,1.79,6.13,15
plant_0063_severity_0.jpg,0,57.88,20.71,1.65,5.95,1
plant_0064_severity_2.jpg,2,76.95,27.47,0.96,6.39,9
plant_0065_severity_0.jpg,0,51.66,21.13,2.15,7.28,1
plant_0066_severity_1.jpg,1,68.62,21.12,2.79,6.81,3
plant_0067_severity_1.jpg,1,72.07,24.9,1.58,5.1,12
plant_0068_severity_0.jpg,0,63.31,15.92,1.53,6.01,8
plant_0069_severity_2.jpg,2,75.97,21.37,1.3,4.85,10
plant_0070_severity_3.jpg,3,81.5,22.31,2.05,4.76,32
plant_0071_severity_2.jpg,2,72.43,22.04,1.2,5.48,1
plant_0072_severity_0.jpg,0,49.15,18.98,1.61,5.52,6
plant_0073_severity_2.jpg,2,84.78,29.52,1.47,6.34,10
plant_0074_severity_2.jpg,2,76.76,26.25,1.24,5.15,14
plant_0075_severity_0.jpg,0,49.54,15.36,1.59,5.78,5
plant_0076_severity_0.jpg,0,54.67,21.43,1.78,6.33,4
plant_0077_severity_2.jpg,2,67.62,23.22,1.24,5.52,12
plant_0078_severity_3.jpg,3,96.35,24.36,2.17,4.64,20
plant_0079_severity_1.jpg,1,78.97,25.6,0.9,5.67,8
plant_0080_severity_0.jpg,0,58.95,21.12,1.93,5.35,3
plant_0081_severity_3.jpg,3,78.16,27.44,2.52,5.67,21
plant_0082_severity_3.jpg,3,83.92,20.65,2.07,5.22,14
plant_0083_severity_2.jpg,2,82.27,24.24,1.62,5.69,18
plant_0084_severity_2.jpg,2,84.59,24.25,1.5,6.73,11
plant_0085_severity_3.jpg,3,65.42,23.85,1.98,4.26,25
plant_0086_severity_3.jpg,3,71.59,26.75,1.51,4.0,29
plant_0087_severity_1.jpg,1,61.29,20.75,1.45,6.7,11
plant_0088_severity_2.jpg,2,65.48,23.13,1.23,6.06,16
plant_0089_severity_2.jpg,2,69.86,21.57,1.28,6.85,16
plant_0090_severity_3.jpg,3,74.08,23.23,2.93,4.59,16
plant_0091_severity_2.jpg,2,78.99,23.49,1.29,4.93,8
plant_0092_severity_2.jpg,2,67.53,22.72,1.62,5.61,27
plant_0093_severity_3.jpg,3,81.25,26.84,2.96,7.17,26
plant_0094_severity_2.jpg,2,78.34,25.34,1.4,6.83,19
plant_0095_severity_3.jpg,3,94.68,26.6,2.4,5.6,34
plant_0096_severity_1.jpg,1,55.06,24.85,2.0,5.77,3
plant_0097_severity_1.jpg,1,77.04,23.06,0.93,5.93,10
plant_0098_severity_3.jpg,3,76.92,25.09,2.41,5.7,23
plant_0099_severity_0.jpg,0,51.82,20.02,1.18,6.05,4
plant_0100_severity_2.jpg,2,82.79,20.9,0.68,6.0,23
plant_0101_severity_3.jpg,3,79.42,25.24,1.45,4.23,30
plant_0102_severity_2.jpg,2,77.99,22.57,0.94,6.06,17
plant_0103_severity_0.jpg,0,57.71,22.16,1.48,6.12,4
plant_0104_severity_3.jpg,3,73.31,22.83,3.05,4.37,25
plant_0105_severity_3.jpg,3,96.48,22.23,1.47,5.29,11
plant_0106_severity_1.jpg,1,56.9,22.49,1.64,6.04,7
plant_0107_severity_0.jpg,0,55.18,17.03,1.81,6.76,2
plant_0108_severity_3.jpg,3,88.87,26.07,1.63,5.35,21
plant_0109_severity_2.jpg,2,70.94,21.88,1.74,4.04,11
plant_0110_severity_3.jpg,3,68.59,22.98,3.15,4.59,13
plant_0111_severity_2.jpg,2,75.53,21.24,1.24,5.08,15
plant_0112_severity_0.jpg,0,62.42,17.99,2.15,6.22,11
plant_0113_severity_1.jpg,1,49.65,23.31,1.28,6.28,6
plant_0114_severity_2.jpg,2,62.7,20.05,0.98,4.18,23
plant_0115_severity_2.jpg,2,68.07,25.27,1.6,5.48,25
plant_0116_severity_2.jpg,2,75.2,20.2,1.44,5.36,10
plant_0117_severity_1.jpg,1,71.08,22.25,1.83,5.37,1
plant_0118_severity_3.jpg,3,90.06,24.69,1.81,5.66,35
plant_0119_severity_3.jpg,3,83.27,22.26,2.88,4.0,19
plant_0120_severity_0.jpg,0,52.69,16.89,1.38,6.44,6
plant_0121_severity_3.jpg,3,87.11,25.12,2.32,5.8,19
plant_0122_severity_2.jpg,2,74.37,24.94,2.02,6.16,25
plant_0123_severity_2.jpg,2,79.74,24.19,1.07,5.8,11
plant_0124_severity_1.jpg,1,59.55,20.61,0.51,5.54,2
plant_0125_severity_0.jpg,0,47.67,15.3,1.62,6.6,5
plant_0126_severity_0.jpg,0,51.62,18.4,1.98,6.08,3
plant_0127_severity_3.jpg,3,88.08,22.82,2.59,6.07,28
plant_0128_severity_3.jpg,3,99.0,20.3,2.42,5.03,28
plant_0129_severity_1.jpg,1,59.46,18.36,2.12,5.48,6
plant_0130_severity_3.jpg,3,81.3,25.6,2.37,5.23,35
plant_0131_severity_3.jpg,3,87.72,26.13,2.71,4.76,16
plant_0132_severity_1.jpg,1,66.08,20.14,1.93,5.03,2
plant_0133_severity_1.jpg,1,69.04,18.42,1.24,6.28,6
plant_0134_severity_1.jpg,1,61.48,22.86,2.38,5.4,7
plant_0135_severity_2.jpg,2,80.63,23.1,0.97,6.72,17
plant_0136_severity_2.jpg,2,66.54,19.83,1.16,4.52,11
plant_0137_severity_3.jpg,3,67.67,23.84,2.56,5.33,22
plant_0138_severity_0.jpg,0,57.5,20.46,1.63,6.79,5
plant_0139_severity_3.jpg,3,85.96,25.95,3.26,5.3,35
plant_0140_severity_2.jpg,2,85.23,22.17,1.33,5.85,15
plant_0141_severity_1.jpg,1,58.84,24.21,1.52,6.31,7
plant_0142_severity_0.jpg,0,52.39,19.15,2.09,7.13,1
plant_0143_severity_0.jpg,0,50.69,23.14,1.8,6.55,5
plant_0144_severity_0.jpg,0,50.9,24.22,2.23,7.24,1
plant_0145_severity_2.jpg,2,70.71,23.84,1.07,4.23,21
plant_0146_severity_0.jpg,0,61.09,19.04,2.17,6.37,5
plant_0147_severity_3.jpg,3,86.98,23.47,2.65,4.79,21
plant_0148_severity_3.jpg,3,69.14,23.76,3.11,5.78,28
plant_0149_severity_3.jpg,3,70.32,23.78,2.72,6.73,17
plant_0150_severity_0.jpg,0,55.04,17.57,2.02,6.5,5
plant_0151_severity_2.jpg,2,58.45,23.12,0.92,5.55,18
plant_0152_severity_2.jpg,2,79.39,21.7,1.16,5.01,21
plant_0153_severity_1.jpg,1,57.5,25.4,0.82,5.99,6
plant_0154_severity_0.jpg,0,53.78,18.54,1.78,6.48,1
plant_0155_severity_2.jpg,2,77.18,20.94,1.58,7.02,7
plant_0156_severity_3.jpg,3,77.12,27.4,2.28,4.7,23
plant_0157_severity_2.jpg,2,75.19,25.68,1.18,5.54,5
plant_0158_severity_3.jpg,3,66.29,24.51,3.02,5.29,21
plant_0159_severity_1.jpg,1,63.13,24.08,1.48,5.17,9
plant_0160_severity_1.jpg,1,58.04,22.48,1.48,5.71,9
plant_0161_severity_2.jpg,2,59.25,24.26,1.79,4.68,13
plant_0162_severity_1.jpg,1,68.27,18.36,1.6,5.84,3
plant_0163_severity_0.jpg,0,60.26,17.75,2.12,5.92,2
plant_0164_severity_2.jpg,2,84.84,25.64,1.15,5.29,21
plant_0165_severity_3.jpg,3,84.81,23.44,2.46,4.99,26
plant_0166_severity_3.jpg,3,62.95,23.87,2.52,4.12,31
plant_0167_severity_2.jpg,2,82.78,23.22,1.83,4.72,19
plant_0168_severity_1.jpg,1,63.47,25.3,1.41,5.68,12
plant_0169_severity_1.jpg,1,76.5,22.8,1.57,5.86,10
plant_0170_severity_2.jpg,2,72.35,26.85,0.8,5.34,13
plant_0171_severity_2.jpg,2,68.37,21.13,1.76,6.15,7
plant_0172_severity_1.jpg,1,56.47,24.38,2.1,6.03,13
plant_0173_severity_2.jpg,2,71.54,19.29,1.0,6.37,12
plant_0174_severity_0.jpg,0,53.64,25.41,1.81,6.42,9
plant_0175_severity_3.jpg,3,83.67,23.2,1.49,5.65,34
plant_0176_severity_1.jpg,1,72.87,20.4,1.22,6.66,11
plant_0177_severity_0.jpg,0,47.74,18.13,1.86,6.93,2
plant_0178_severity_0.jpg,0,56.21,23.26,1.73,5.66,4
plant_0179_severity_2.jpg,2,74.54,24.17,0.72,5.54,7
plant_0180_severity_3.jpg,3,84.69,24.78,2.33,4.0,31
plant_0181_severity_1.jpg,1,69.87,24.19,1.64,6.8,10
plant_0182_severity_1.jpg,1,64.58,23.48,2.09,6.18,6
plant_0183_severity_0.jpg,0,64.67,16.36,1.81,6.57,6
plant_0184_severity_0.jpg,0,63.45,20.42,1.8,6.95,1
plant_0185_severity_2.jpg,2,83.0,24.7,1.25,5.58,8
plant_0186_severity_3.jpg,3,89.96,24.4,1.55,4.83,28
plant_0187_severity_2.jpg,2,82.11,21.85,0.84,6.55,11
plant_0188_severity_0.jpg,0,54.38,22.47,1.48,6.86,6
plant_0189_severity_3.jpg,3,80.96,24.02,2.97,5.14,23
plant_0190_severity_2.jpg,2,67.17,18.2,0.55,6.08,19
plant_0191_severity_0.jpg,0,51.49,19.82,1.63,6.44,1
plant_0192_severity_2.jpg,2,83.01,25.2,1.04,5.1,11
plant_0193_severity_0.jpg,0,51.09,21.74,1.71,6.56,5
plant_0194_severity_0.jpg,0,52.36,17.15,1.3,6.65,8
plant_0195_severity_2.jpg,2,83.95,18.5,1.77,5.82,9
plant_0196_severity_0.jpg,0,59.94,19.0,1.92,6.42,9
plant_0197_severity_2.jpg,2,75.41,22.17,1.35,5.39,13
plant_0198_severity_2.jpg,2,72.98,23.76,0.96,4.6,16
plant_0199_severity_0.jpg,0,49.33,13.32,1.26,6.25,6
plant_0200_severity_2.jpg,2,82.81,22.48,1.52,5.41,15
plant_0201_severity_2.jpg,2,67.0,20.65,1.77,4.87,21
plant_0202_severity_0.jpg,0,53.04,24.01,1.37,5.87,2
plant_0203_severity_3.jpg,3,77.96,25.06,2.19,4.0,10
plant_0204_severity_2.jpg,2,73.14,22.66,1.67,6.42,18
plant_0205_severity_1.jpg,1,67.13,19.87,1.45,4.82,6
plant_0206_severity_2.jpg,2,71.66,26.78,0.71,6.33,3
plant_0207_severity_1.jpg,1,62.46,27.34,1.25,5.96,2
plant_0208_severity_3.jpg,3,87.64,22.36,2.31,4.0,27
plant_0209_severity_3.jpg,3,80.96,23.63,3.08,5.08,25
plant_0210_severity_1.jpg,1,72.33,20.31,1.94,5.3,10
plant_0211_severity_3.jpg,3,99.0,28.2,2.96,4.0,21
plant_0212_severity_0.jpg,0,59.2,18.15,1.82,6.29,10
plant_0213_severity_2.jpg,2,68.71,25.89,1.43,6.18,12
plant_0214_severity_1.jpg,1,72.53,23.67,1.58,5.73,8
plant_0215_severity_3.jpg,3,94.29,26.31,2.49,4.65,26
plant_0216_severity_3.jpg,3,95.53,26.15,2.99,4.3,19
plant_0217_severity_2.jpg,2,65.2,23.87,1.57,5.13,14
plant_0218_severity_3.jpg,3,98.26,24.04,2.16,5.31,27
plant_0219_severity_3.jpg,3,72.74,23.59,2.85,5.14,17
plant_0220_severity_2.jpg,2,73.04,23.21,1.39,5.1,10
plant_0221_severity_2.jpg,2,70.05,22.16,1.28,5.14,15
plant_0222_severity_0.jpg,0,56.2,17.55,2.06,7.0,2
plant_0223_severity_2.jpg,2,76.64,25.04,1.17,4.2,13
plant_0224_severity_2.jpg,2,73.04,21.44,1.49,5.56,14
plant_0225_severity_2.jpg,2,84.83,24.73,1.73,5.03,15
plant_0226_severity_0.jpg,0,58.18,20.26,2.12,6.97,3
plant_0227_severity_0.jpg,0,54.22,19.81,1.54,6.65,5
plant_0228_severity_0.jpg,0,51.75,19.81,1.76,6.06,1
plant_0229_severity_1.jpg,1,67.84,20.66,2.15,6.09,6
plant_0230_severity_0.jpg,0,46.07,21.81,2.19,7.5,9
plant_0231_severity_0.jpg,0,47.8,26.16,1.64,7.33,1
plant_0232_severity_2.jpg,2,75.39,25.34,2.0,5.81,20
plant_0233_severity_2.jpg,2,77.11,23.31,1.14,5.38,9
plant_0234_severity_0.jpg,0,61.33,25.53,1.62,6.36,6
plant_0235_severity_3.jpg,3,72.66,20.92,1.69,6.49,30
plant_0236_severity_3.jpg,3,90.47,25.27,2.79,4.72,22
plant_0237_severity_3.jpg,3,96.09,21.15,3.22,4.68,18`;

export const parseCSV = (csvText: string) => {
  const lines = csvText.trim().split('\\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: any = {};
    headers.forEach((header, index) => {
      const val = values[index];
      // Auto-convert numbers
      row[header] = isNaN(Number(val)) ? val : Number(val);
    });
    
    // Map severity 0-3 to string labels
    const severityMap: Record<number, RootRotSeverity> = {
      0: 'Healthy',
      1: 'Low',
      2: 'Moderate',
      3: 'Severe'
    };
    
    // Generate a mock "Yield" based on severity (Healthier = Higher Yield)
    // Healthy (0): 80-100
    // Low (1): 60-80
    // Moderate (2): 40-60
    // Severe (3): 10-40
    const severity = row['Root_Rot_Severity'];
    let yieldBase = 90;
    if (severity === 1) yieldBase = 70;
    if (severity === 2) yieldBase = 50;
    if (severity === 3) yieldBase = 25;
    
    row['Estimated_Yield'] = yieldBase + (Math.random() * 20 - 10);
    row['Severity_Label'] = severityMap[severity];
    
    return row;
  });
};

export const DEFAULT_PARSED_DATA = parseCSV(CSV_RAW_DATA);
