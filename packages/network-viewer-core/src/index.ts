/**
 * Copyright (c) 2024, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

// Network Area Diagram Viewer exports
export { NetworkAreaDiagramViewer } from './network-area-diagram-viewer/network-area-diagram-viewer';
export type { BranchState } from './network-area-diagram-viewer/network-area-diagram-viewer';
export type {
    BusNodeMetadata,
    DiagramMetadata,
    EdgeMetadata,
    LayoutParametersMetadata,
    NodeMetadata,
    SvgParametersMetadata,
    TextNodeMetadata,
} from './network-area-diagram-viewer/diagram-metadata';
export type {
    OnMoveNodeCallbackType,
    OnMoveTextNodeCallbackType,
    OnSelectNodeCallbackType,
    OnToggleNadHoverCallbackType,
    OnRightClickCallbackType,
    OnBendLineCallbackType,
    NadViewerParametersOptions,
    NadViewerParameters,
} from './network-area-diagram-viewer/nad-viewer-parameters';
export { LayoutParameters } from './network-area-diagram-viewer/layout-parameters';
export { SvgParameters } from './network-area-diagram-viewer/svg-parameters';
export {
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
} from './network-area-diagram-viewer/nad-deck-data';

// Single Line Diagram Viewer exports
export {
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
} from './single-line-diagram-viewer/single-line-diagram-viewer';
