# Forecast Pulse Dashboard

A Next.js App Router implementation of the NAP pre-launch market intelligence dashboard. The application uses TypeScript, Tailwind CSS, Chart.js, ECharts, the repository's `NAP mock data.xlsx` workbook, and the Compass Pro Data Agent backend for authenticated chat.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Start the Compass Pro Data Agent backend on `http://localhost:8001`, then open `http://localhost:3000` for the Executive Summary or `http://localhost:3000/key-market-indicators` for the detailed indicators.

The backend must include the dashboard origin in `CORS_ALLOWED_ORIGINS` because authentication uses an HttpOnly cookie and credentialed cross-origin requests. Its `FRONTEND_URL` must point to this frontend when Microsoft SSO should return here.

## Project structure

- `src/app`: routes, shared layout, theme, loading, and error states
- `src/components/dashboard`: reusable dashboard layout and UI primitives
- `src/components/executive`: Executive Summary feature composition
- `src/components/indicators`: Key Market Indicators feature composition
- `src/components/charts`: Chart.js setup and Executive Summary charts
- `src/components/chat`: responsive chat panel and structured answer renderers
- `src/context`: authentication and startup chat-context providers
- `src/hooks`: chat orchestration and streaming state
- `src/utils/dashboard/workbook.ts`: server-only Excel reader and validation
- `src/utils/dashboard/selectors.ts`: derived metrics and aggregations
- `src/utils/chat`: Compass, orchestrator, DAE, and document API contracts

## Updating data

Replace or edit `NAP mock data.xlsx` while keeping the existing worksheet headers. The server checks the file modification time and reloads it when it changes.

The displayed product name is read from the worksheet named `Source of <product> starts`. It is not duplicated in UI constants.

Product mix, prescriber breadth/depth, and compliance data are read from workbook worksheets rather than frontend constants.

## Chat integration

The app authenticates through the Data Agent backend before showing the dashboard. Once authenticated it preloads disease areas, datasources, and the full `diseasearea_documents` catalog. The configured disease area defaults to `CVD`; all available document content is selected automatically by the backend bridge, so no study-selection modal is shown.

Each question is sent to `/orchestrate/classify`, then routed to the Compass commercial-data stream or the DAE/BR document stream. The panel supports streaming text and processing steps, backend-generated charts, result tables, citations, source document previews, SQL, and confidence metadata without React Query.

## Changing the client theme

Edit the semantic color tokens in `src/app/globals.css`. Components use Tailwind classes such as `bg-primary`, `text-content`, and `border-border`; Chart.js reads from the same CSS variables.

## Validation

```bash
npm run lint
npm run build
```
