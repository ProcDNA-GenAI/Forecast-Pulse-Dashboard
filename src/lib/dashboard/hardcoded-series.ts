export type ProductMixSeries = {
  label: string;
  colorToken: "accent" | "pink" | "teal" | "violet" | "orange";
  values: number[];
};

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const productMixLabels = [
  ...monthNames.map((month) => `${month} '25`),
  ...monthNames.map((month) => `${month} '26`),
];

function interpolateQuarterly(values: number[]): number[] {
  const result: number[] = [];

  for (let month = 0; month < 24; month += 1) {
    if (month >= 21) {
      result.push(values[7]);
      continue;
    }

    const interval = Math.floor(month / 3);
    const progress = (month - interval * 3) / 3;
    const value = values[interval] + (values[interval + 1] - values[interval]) * progress;
    result.push(Number(value.toFixed(2)));
  }

  return result;
}

export function getProductMixSeries(productName: string): ProductMixSeries[] {
  return [
    { label: "Ezetimibe", colorToken: "accent", values: interpolateQuarterly([46, 45, 44, 43, 42, 40, 37, 34]) },
    { label: "Bempedoic", colorToken: "pink", values: interpolateQuarterly([18, 18, 17, 17, 16, 15, 14, 13]) },
    { label: "Repatha", colorToken: "teal", values: interpolateQuarterly([24, 24, 25, 25, 26, 26, 25, 24]) },
    { label: "Leqvio", colorToken: "violet", values: interpolateQuarterly([12, 13, 14, 15, 16, 17, 17, 17]) },
    { label: productName, colorToken: "orange", values: interpolateQuarterly([0, 0, 0, 0, 0, 3, 7, 12]) },
  ];
}

export const productMixPatientPool = interpolateQuarterly([0.9, 0.93, 0.96, 0.99, 1.02, 1.05, 1.08, 1.11]);

export const prescriberBreadthDepth = [
  { specialty: "Cardiology", writers: 3200, prescriptionsPerWriter: 6.1 },
  { specialty: "Primary care", writers: 2600, prescriptionsPerWriter: 3.4 },
  { specialty: "Lipid spec.", writers: 900, prescriptionsPerWriter: 9.2 },
];
