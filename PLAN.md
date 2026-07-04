# Deck.gl Network Area Diagram Rendering Plan

## Summary
Add a JSON-first NAD export in the Java backend and a deck.gl NAD renderer in the frontend. The backend will keep the existing NAD graph/layout/style pipeline, but serialize render-ready geometry instead of SVG. The frontend will support both diagram-space rendering and geographic map overlay, with v1 limited to view, hover, selection, and context menu interactions.

## Backend Changes
- Add `com.powsybl.nad.deckgl` DTOs and APIs:
  - `NadDeckData NetworkAreaDiagram.getDeckData(Network, NadParameters, Predicate<VoltageLevel>, NadDeckParameters)`
  - `void NetworkAreaDiagram.drawDeckJson(Network, Writer, NadParameters, Predicate<VoltageLevel>, NadDeckParameters)`
  - `NadDeckParameters` with `layoutMode: FORCE | GEOGRAPHICAL`, `includeGeoCoordinates`, `includeRawMetadata`, `curveSampleCount`.
- Reuse the existing flow: build graph, run layout, apply `StyleProvider`, run `EdgeRouting`, then serialize. Do not write SVG just to compute edge points.
- For `layoutMode=GEOGRAPHICAL`, use `GeographicalLayoutFactory`; emit both NAD x/y coordinates and WGS84 coordinates derived from the same projection. For `FORCE`, emit diagram coordinates only.
- Preserve existing `DiagramMetadata` compatibility by embedding `rawMetadata` optionally and carrying fields such as `svgId`, `equipmentId`, `classes`, `style`, and future `bendingPoints`.

## JSON Contract
Transfer one `NadDeckData` payload:

```ts
type NadDeckData = {
  schemaVersion: 1;
  networkId?: string;
  layoutMode: 'FORCE' | 'GEOGRAPHICAL';
  renderCoordinates: Array<'DIAGRAM' | 'GEO'>;
  viewBox: { x: number; y: number; width: number; height: number };
  projection?: { type: 'NAD_WEB_MERCATOR'; scale: number; radiusFactor: number };
  parameters: { layout: LayoutParametersMetadata; svg: SvgParametersMetadata };
  nodes: NadNode[];
  busNodes: NadBusNode[];
  nodeShapes: NadShape[];
  edges: NadEdge[];
  injections: NadInjection[];
  textNodes: NadTextNode[];
  rawMetadata?: DiagramMetadata;
};

type NadGeometry<T> = { diagram: T; geo?: T };
type NadPoint = { x: number; y: number };
type NadLonLat = { lon: number; lat: number };
```

- `nodes`: voltage-level, 3-winding, and boundary nodes with `svgId`, `equipmentId`, `type`, `position`, optional `geoPosition`, `fictitious`, `invisible`, `unknownBus`, `classes`, `style`, labels/legend fields.
- `busNodes`: `svgId`, `equipmentId`, `vlNode`, `index`, `nbNeighbours`, `legend`, `classes`, `style`, and computed radii.
- `nodeShapes`: render-ready primitives for deck.gl, using polygons/circles for bus rings, annulus fragments, unknown-bus halos, and boundary semicircles.
- `edges`: `svgId`, `equipmentId`, `type`, endpoints, bus endpoints, optional `bendingPoints`, per-side half-edge paths, visibility, classes/style, transformer/HVDC center components, arrows, labels, and middle/side edge-info data.
- `injections` and `textNodes`: component type, owning node/bus ids, edge geometry, label data, classes/style.
- Every render primitive includes `renderStyle` with RGBA fill/stroke/text colors, stroke width, dash/opacity where known, plus original `classes` and `style` for custom frontend resolution.

## Frontend Changes
- Add shared TypeScript types and validation helpers for `NadDeckData`, preferably in `network-viewer-core`; export them from the root package.
- Add `NetworkAreaDiagramLayer` in `network-map-layers` and export it from `packages/network-map-layers/src/index.ts`.
  - Use `PathLayer` for branch/injection/text edges.
  - Use `SolidPolygonLayer`/`ScatterplotLayer` for bus shapes, transformer windings, unknown bus halos, and converter stations.
  - Use `TextLayer` for node labels, legends, and edge info labels.
  - Use a small custom/icon layer for NAD arrows and PST arrow symbols.
- Add a React wrapper, e.g. `NetworkAreaDiagramDeck`, with `renderMode: 'diagram' | 'map'`.
  - `diagram`: deck.gl `OrthographicView`, fit to `viewBox`.
  - `map`: existing Mapbox/MapLibre overlay style, only enabled when `renderCoordinates` contains `GEO`.
- Implement v1 interactions only: hover cursor, tooltip payload, left-click select, right-click context menu, and picking objects carrying `{ equipmentId, svgId, type }`.

## Tests
- Java: snapshot-style JSON tests for IEEE/simple networks, loop edges, transformers, HVDC, injections, text nodes, and geographical mode.
- Java: verify existing SVG tests still pass and deck JSON generation does not require SVG writing.
- TypeScript: type/normalization tests for `NadDeckData`; layer lifecycle tests asserting expected deck sublayers.
- Browser tests: nonblank diagram render, nonblank map overlay render with geographical fixture, picking returns the expected equipment id/type.
- Run `mvn -pl network-area-diagram test`, `npm run check`, `npm run test:unit`, and focused browser tests.

## Assumptions
- V1 intentionally excludes drag, text-node move, and line-bending edition; the JSON keeps ids and `bendingPoints` compatibility for a later editing phase.
- Map overlay requires backend generation with `layoutMode=GEOGRAPHICAL`; otherwise the frontend reports unavailable geo coordinates instead of guessing.
- Unknown/custom NAD CSS classes fall back to default deck styles unless the app provides a frontend style resolver.
