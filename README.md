# Forecast Pulse Dashboard

A Next.js App Router implementation of the NAP pre-launch market intelligence dashboard. The application uses TypeScript, Tailwind CSS, Chart.js, and the repository's `NAP mock data.xlsx` workbook.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` for the Executive Summary or `http://localhost:3000/key-market-indicators` for the detailed indicators.

## Project structure

- `src/app`: routes, shared layout, theme, loading, and error states
- `src/components/dashboard`: reusable dashboard layout and UI primitives
- `src/components/executive`: Executive Summary feature composition
- `src/components/indicators`: Key Market Indicators feature composition
- `src/components/charts`: Chart.js setup and Executive Summary charts
- `src/lib/dashboard/workbook.ts`: server-only Excel reader and validation
- `src/lib/dashboard/selectors.ts`: derived metrics and aggregations
- `src/lib/dashboard/hardcoded-series.ts`: the two datasets intentionally retained from the original HTML

## Updating data

Replace or edit `NAP mock data.xlsx` while keeping the existing worksheet headers. The server checks the file modification time and reloads it when it changes.

The displayed product name is read from the worksheet named `Source of <product> starts`. It is not duplicated in UI constants.

The product-mix history and specialty breadth/depth visualization remain hardcoded by design because those series are not present in the workbook. They are isolated in `src/lib/dashboard/hardcoded-series.ts` so they can be replaced easily later.

## Changing the client theme

Edit the semantic color tokens in `src/app/globals.css`. Components use Tailwind classes such as `bg-primary`, `text-content`, and `border-border`; Chart.js reads from the same CSS variables.

## Validation

```bash
npm run lint
npm run build
```
