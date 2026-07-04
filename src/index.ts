/**
 * Copyright (c) 2022, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// Re-export all viewers from @powsybl/network-viewer-core (React-free)
export {
    NetworkAreaDiagramViewer,
    type BranchState,
    type BusNodeMetadata,
    type DiagramMetadata,
    type EdgeMetadata,
    type LayoutParametersMetadata,
    type NodeMetadata,
    type SvgParametersMetadata,
    type TextNodeMetadata,
    type OnMoveNodeCallbackType,
    type OnMoveTextNodeCallbackType,
    type OnSelectNodeCallbackType,
    type OnToggleNadHoverCallbackType,
    type OnRightClickCallbackType,
    type OnBendLineCallbackType,
    type NadViewerParametersOptions,
    type NadViewerParameters,
    getNadPath,
    getNadPosition,
    hasNadCoordinate,
    isNadDeckData,
    type NadBusNode,
    type NadComponent,
    type NadComponentType,
    type NadCoordinateMode,
    type NadDeckData,
    type NadDeckLayoutMode,
    type NadEdge,
    type NadEdgeInfo,
    type NadGeometry,
    type NadHalfEdge,
    type NadInjection,
    type NadLonLat,
    type NadNode,
    type NadPickingData,
    type NadPoint,
    type NadPosition,
    type NadProjection,
    type NadRenderCoordinate,
    type NadRenderStyle,
    type NadShape,
    type NadShapeType,
    type NadTextNode,
    type NadViewBox,
    LayoutParameters,
    SvgParameters,
    SingleLineDiagramViewer,
    type OnBreakerCallbackType,
    type OnBusCallbackType,
    type OnFeederCallbackType,
    type OnNextVoltageCallbackType,
    type OnToggleSldHoverCallbackType,
    type SLDMetadata,
    type SLDMetadataComponent,
    type SLDMetadataComponentSize,
    type SLDMetadataNode,
} from '@powsybl/network-viewer-core';

// Re-export from @powsybl/network-map-layers
export {
    GeoData,
    LineFlowColorMode,
    LineFlowMode,
    MapEquipments,
    NetworkAreaDiagramLayer,
    type GeoDataEquipment,
    type GeoDataLine,
    type GeoDataSubstation,
    type NetworkAreaDiagramLayerProps,
} from '@powsybl/network-map-layers';

export { default as NetworkMap } from './components/network-map-viewer/network/network-map';
export { default as NetworkAreaDiagramDeck } from './components/network-area-diagram-deck/network-area-diagram-deck';

export {
    type MenuClickFunction,
    type NetworkMapProps,
    type NetworkMapRef,
} from './components/network-map-viewer/network/network-map';
export {
    type NetworkAreaDiagramDeckMapLibrary,
    type NetworkAreaDiagramDeckProps,
    type NetworkAreaDiagramDeckRef,
    type NetworkAreaDiagramDeckRenderMode,
} from './components/network-area-diagram-deck/network-area-diagram-deck';

export { DRAW_MODES } from './components/network-map-viewer/network/draw-control';

export {
    Country,
    EQUIPMENT_TYPES,
    type Coordinate,
    type LonLat,
    type MapAnyLine,
    type MapAnyLineWithType,
    type MapEquipment,
    type MapHvdcLine,
    type MapHvdcLineWithType,
    type MapLine,
    type MapLineWithType,
    type MapSubstation,
    type MapTieLine,
    type MapTieLineWithType,
    type MapVoltageLevel,
} from '@powsybl/network-map-layers';
export { DRAW_EVENT } from './components/network-map-viewer/network/draw_event';
