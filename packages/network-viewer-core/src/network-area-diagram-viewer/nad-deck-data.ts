/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 */

import type { DiagramMetadata, LayoutParametersMetadata, SvgParametersMetadata } from './diagram-metadata';

export type NadCoordinateMode = 'diagram' | 'geo';
export type NadRenderCoordinate = 'DIAGRAM' | 'GEO';
export type NadDeckLayoutMode = 'FORCE' | 'GEOGRAPHICAL';

export type NadPoint = { x: number; y: number };
export type NadLonLat = { lon: number; lat: number };
export type NadPosition = [number, number];

export type NadGeometry<TDiagram, TGeo = unknown> = {
    diagram: TDiagram;
    geo?: TGeo | null;
};

export type NadViewBox = { x: number; y: number; width: number; height: number };
export type NadProjection = { type: 'NAD_WEB_MERCATOR'; scale: number; radiusFactor: number };

export type NadRenderStyle = {
    fillColor?: number[] | null;
    strokeColor?: number[] | null;
    textColor?: number[] | null;
    strokeWidth?: number | null;
    radius?: number | null;
    opacity?: number | null;
    dashArray?: number[] | null;
};

export type NadPickingData = {
    equipmentId?: string | null;
    svgId?: string | null;
    type?: string | null;
};

export type NadNode = {
    svgId: string;
    equipmentId?: string | null;
    name?: string | null;
    type: string;
    position: NadGeometry<NadPoint, NadLonLat>;
    fictitious?: boolean | null;
    invisible?: boolean | null;
    unknownBus?: boolean | null;
    legendSvgId?: string | null;
    legendEdgeSvgId?: string | null;
    legendHeader?: string[] | null;
    legendFooter?: string[] | null;
    classes?: string[] | null;
    style?: string | null;
    renderStyle?: NadRenderStyle | null;
};

export type NadBusNode = {
    svgId: string;
    equipmentId?: string | null;
    vlNode: string;
    index: number;
    nbNeighbours: number;
    busInnerRadius: number;
    busOuterRadius: number;
    voltageLevelRadius: number;
    legend?: string | null;
    classes?: string[] | null;
    style?: string | null;
    renderStyle?: NadRenderStyle | null;
};

export type NadShapeType = 'CIRCLE' | 'ANNULUS' | 'SEMICIRCLE';

export type NadShape = {
    id: string;
    type: NadShapeType;
    equipmentId?: string | null;
    node?: string | null;
    busNode?: string | null;
    center: NadGeometry<NadPoint, NadLonLat>;
    radius?: number | null;
    innerRadius?: number | null;
    startAngle?: number | null;
    endAngle?: number | null;
    classes?: string[] | null;
    style?: string | null;
    renderStyle?: NadRenderStyle | null;
    picking?: NadPickingData | null;
};

export type NadHalfEdge = {
    side: string;
    visible?: boolean | null;
    path: NadGeometry<NadPoint[], NadLonLat[]>;
    arrowPoint?: NadPoint | null;
    arrowAngle?: number | null;
    classes?: string[] | null;
    style?: string | null;
    renderStyle?: NadRenderStyle | null;
};

export type NadComponentType = 'TRANSFORMER_WINDING' | 'PST_ARROW' | 'HVDC_CONVERTER' | 'INJECTION';

export type NadComponent = {
    id: string;
    type: NadComponentType;
    side?: string | null;
    center?: NadGeometry<NadPoint, NadLonLat> | null;
    path?: NadGeometry<NadPoint[], NadLonLat[]> | null;
    radius?: number | null;
    angle?: number | null;
    classes?: string[] | null;
    style?: string | null;
    renderStyle?: NadRenderStyle | null;
};

export type NadEdgeInfo = {
    svgId: string;
    position?: string | null;
    infoTypeA?: string | null;
    infoTypeB?: string | null;
    direction?: string | null;
    directionA?: string | null;
    directionB?: string | null;
    labelA?: string | null;
    labelB?: string | null;
    componentType?: string | null;
    anchor?: NadGeometry<NadPoint, NadLonLat> | null;
    angle?: number | null;
    classes?: string[] | null;
    renderStyle?: NadRenderStyle | null;
};

export type NadEdge = {
    svgId: string;
    equipmentId?: string | null;
    name?: string | null;
    type: string;
    node1?: string | null;
    node2?: string | null;
    busNode1?: string | null;
    busNode2?: string | null;
    side?: string | null;
    bendingPoints?: NadPoint[] | null;
    invisible1?: boolean | null;
    invisible2?: boolean | null;
    halfEdges?: NadHalfEdge[] | null;
    components?: NadComponent[] | null;
    edgeInfos?: NadEdgeInfo[] | null;
    classes?: string[] | null;
    picking?: NadPickingData | null;
};

export type NadInjection = {
    svgId: string;
    equipmentId?: string | null;
    name?: string | null;
    componentType: string;
    busNodeId: string;
    vlNodeId: string;
    edge?: NadGeometry<NadPoint[], NadLonLat[]> | null;
    position?: NadGeometry<NadPoint, NadLonLat> | null;
    arrowPoint?: NadPoint | null;
    angle?: number | null;
    edgeInfo?: NadEdgeInfo | null;
    classes?: string[] | null;
    style?: string | null;
    renderStyle?: NadRenderStyle | null;
    picking?: NadPickingData | null;
};

export type NadTextNode = {
    svgId: string;
    equipmentId?: string | null;
    vlNode: string;
    position: NadGeometry<NadPoint, NadLonLat>;
    connection: NadGeometry<NadPoint, NadLonLat>;
    shiftX: number;
    shiftY: number;
    connectionShiftX: number;
    connectionShiftY: number;
    classes?: string[] | null;
    renderStyle?: NadRenderStyle | null;
    picking?: NadPickingData | null;
};

export type NadDeckData = {
    schemaVersion: 1;
    networkId?: string | null;
    layoutMode: NadDeckLayoutMode;
    renderCoordinates: NadRenderCoordinate[];
    viewBox: NadViewBox;
    projection?: NadProjection | null;
    parameters: {
        layout: LayoutParametersMetadata;
        svg: SvgParametersMetadata;
    };
    nodes: NadNode[];
    busNodes: NadBusNode[];
    nodeShapes: NadShape[];
    edges: NadEdge[];
    injections: NadInjection[];
    textNodes: NadTextNode[];
    rawMetadata?: DiagramMetadata | null;
};

export function isNadDeckData(value: unknown): value is NadDeckData {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const candidate = value as Partial<NadDeckData>;
    return (
        candidate.schemaVersion === 1 &&
        Array.isArray(candidate.renderCoordinates) &&
        Array.isArray(candidate.nodes) &&
        Array.isArray(candidate.edges) &&
        candidate.viewBox !== undefined
    );
}

export function hasNadCoordinate(data: NadDeckData, mode: NadCoordinateMode): boolean {
    return mode === 'diagram' || data.renderCoordinates.includes('GEO');
}

export function getNadPosition<TGeo extends NadLonLat | null | undefined>(
    geometry: NadGeometry<NadPoint, TGeo> | null | undefined,
    mode: NadCoordinateMode
): NadPosition | null {
    if (!geometry) {
        return null;
    }
    if (mode === 'geo') {
        const geo = geometry.geo;
        if (geo) {
            return [geo.lon, geo.lat];
        }
        return null;
    }
    return [geometry.diagram.x, geometry.diagram.y];
}

export function getNadPath(
    geometry: NadGeometry<NadPoint[], NadLonLat[]> | null | undefined,
    mode: NadCoordinateMode
): NadPosition[] {
    if (!geometry) {
        return [];
    }
    if (mode === 'geo') {
        return geometry.geo?.map((point) => [point.lon, point.lat]) ?? [];
    }
    return geometry.diagram.map((point) => [point.x, point.y]);
}
