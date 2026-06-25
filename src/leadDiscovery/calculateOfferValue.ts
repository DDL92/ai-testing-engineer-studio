import fs = require('fs');
import path = require('path');

interface ValueScenario {
  name: string;
  leadsDelivered: number;
  conversionRate: number;
  averageBookingValue: number;
  potentialBookings: number;
  potentialRevenue: number;
}

interface OfferValueEstimate {
  generatedAt: string;
  client: string;
  assumptionsOnly: true;
  assumptions: string[];
  scenarios: ValueScenario[];
  revenueRange: {
    low: number;
    high: number;
  };
  safetyNotes: string[];
}

const clientName = 'Flora and Fauna Foods';
const outputDir = path.join(process.cwd(), 'output', 'client-offer');
const markdownPath = path.join(outputDir, 'value-estimate.md');
const jsonPath = path.join(outputDir, 'value-estimate.json');

export function calculateOfferValue(now = new Date()): OfferValueEstimate {
  const scenarios = [
    scenario('Conservative pilot', 10, 0.05, 4000),
    scenario('Expected pilot', 15, 0.1, 7000),
    scenario('Growth monthly', 40, 0.12, 8000),
  ];
  const estimate: OfferValueEstimate = {
    generatedAt: now.toISOString(),
    client: clientName,
    assumptionsOnly: true,
    assumptions: [
      'No external data is used.',
      'Conversion rates are illustrative assumptions only.',
      'Average booking values are planning assumptions only.',
      'Client performs outreach and sales follow-up.',
      'Potential revenue is not guaranteed.',
    ],
    scenarios,
    revenueRange: {
      low: Math.min(...scenarios.map((item) => item.potentialRevenue)),
      high: Math.max(...scenarios.map((item) => item.potentialRevenue)),
    },
    safetyNotes: [
      'This value model is directional only.',
      'No sales, bookings, replies, meetings, or revenue are guaranteed.',
      'Use actual Flora sales outcomes to replace assumptions after the pilot.',
    ],
  };

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(markdownPath, renderValueEstimate(estimate), 'utf8');
  fs.writeFileSync(jsonPath, `${JSON.stringify(estimate, null, 2)}\n`, 'utf8');

  return estimate;
}

function scenario(name: string, leadsDelivered: number, conversionRate: number, averageBookingValue: number): ValueScenario {
  const potentialBookings = round(leadsDelivered * conversionRate);
  return {
    name,
    leadsDelivered,
    conversionRate,
    averageBookingValue,
    potentialBookings,
    potentialRevenue: round(potentialBookings * averageBookingValue),
  };
}

function renderValueEstimate(estimate: OfferValueEstimate): string {
  return `# Flora Offer Value Estimate

Generated: ${estimate.generatedAt}

This estimate uses assumptions only. No external data is used.

## Assumptions

${estimate.assumptions.map((assumption) => `- ${assumption}`).join('\n')}

## Scenarios

| Scenario | Leads delivered | Estimated conversion rate | Potential bookings | Average booking value | Potential revenue |
| --- | ---: | ---: | ---: | ---: | ---: |
${estimate.scenarios.map((item) => `| ${item.name} | ${item.leadsDelivered} | ${(item.conversionRate * 100).toFixed(1)}% | ${item.potentialBookings.toFixed(1)} | $${item.averageBookingValue.toFixed(0)} | $${item.potentialRevenue.toFixed(0)} |`).join('\n')}

## Potential Revenue Range

- Low: $${estimate.revenueRange.low.toFixed(0)}
- High: $${estimate.revenueRange.high.toFixed(0)}

## Safety Notes

${estimate.safetyNotes.map((note) => `- ${note}`).join('\n')}
`;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

if (require.main === module) {
  calculateOfferValue();
  console.log(`Generated offer value estimate: ${path.relative(process.cwd(), markdownPath)}, ${path.relative(process.cwd(), jsonPath)}`);
}
