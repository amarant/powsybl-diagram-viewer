/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    COORDINATE_SYSTEM,
    type Color,
    CompositeLayer,
    type CompositeLayerProps,
    type DefaultProps,
    type Layer,
} from '@deck.gl/core';
import { PathLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type {
    NadComponent,
    NadCoordinateMode,
    NadDeckData,
    NadEdge,
    NadEdgeInfo,
    NadHalfEdge,
    NadNode,
    NadPickingData,
    NadPosition,
    NadRenderStyle,
    NadShape,
    NadTextNode,
} from '@powsybl/network-viewer-core';

const DEFAULT_NODE_FILL: Color = [245, 245, 245, 255];
const DEFAULT_STROKE: Color = [40, 40, 40, 255];
const DEFAULT_TEXT: Color = [40, 40, 40, 255];

type EdgePathDatum = {
    edge: NadEdge;
    halfEdge: NadHalfEdge;
    picking?: NadPickingData | null;
};

type ComponentPathDatum = {
    component: NadComponent;
    picking?: NadPickingData | null;
};

type LabelDatum = {
    id: string;
    text: string;
    position: NadPosition;
    angle?: number | null;
    renderStyle?: NadRenderStyle | null;
    picking?: NadPickingData | null;
};

type ArrowDatum = {
    id: string;
    text: string;
    position: NadPosition;
    angle?: number | null;
    renderStyle?: NadRenderStyle | null;
    picking?: NadPickingData | null;
};

type _NetworkAreaDiagramLayerProps = {
    data?: NadDeckData | null;
    coordinateMode?: NadCoordinateMode;
    labelsVisible?: boolean;
    edgeInfosVisible?: boolean;
    nodeRadiusScale?: number;
    lineWidthScale?: number;
    getNodeLabel?: (node: NadNode) => string;
};

export type NetworkAreaDiagramLayerProps = _NetworkAreaDiagramLayerProps & CompositeLayerProps;

function color(value: number[] | null | undefined, fallback: Color): Color {
    if (!value || value.length < 3) {
        return fallback;
    }
    return [value[0], value[1], value[2], value[3] ?? 255];
}

function strokeColor(style: NadRenderStyle | null | undefined): Color {
    return color(style?.strokeColor, DEFAULT_STROKE);
}

function fillColor(style: NadRenderStyle | null | undefined): Color {
    return color(style?.fillColor, DEFAULT_NODE_FILL);
}

function textColor(style: NadRenderStyle | null | undefined): Color {
    return color(style?.textColor, DEFAULT_TEXT);
}

function lineWidth(style: NadRenderStyle | null | undefined, scale: number) {
    return Math.max((style?.strokeWidth ?? 2) * scale, 1);
}

function radius(style: NadRenderStyle | null | undefined, fallback: number, scale: number) {
    return Math.max((style?.radius ?? fallback) * scale, 1);
}

function getNodeText(node: NadNode) {
    return node.legendHeader?.[0] ?? node.name ?? node.equipmentId ?? node.svgId;
}

function hasCoordinate(data: NadDeckData, mode: NadCoordinateMode): boolean {
    return mode === 'diagram' || data.renderCoordinates.includes('GEO');
}

function getPosition(
    geometry: { diagram: { x: number; y: number }; geo?: { lon: number; lat: number } | null } | null | undefined,
    mode: NadCoordinateMode
): NadPosition | null {
    if (!geometry) {
        return null;
    }
    if (mode === 'geo') {
        return geometry.geo ? [geometry.geo.lon, geometry.geo.lat] : null;
    }
    return [geometry.diagram.x, geometry.diagram.y];
}

function getPath(
    geometry:
        | { diagram: Array<{ x: number; y: number }>; geo?: Array<{ lon: number; lat: number }> | null }
        | null
        | undefined,
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

export class NetworkAreaDiagramLayer extends CompositeLayer<Required<_NetworkAreaDiagramLayerProps>> {
    static readonly layerName = 'NetworkAreaDiagramLayer';

    static readonly defaultProps: DefaultProps<NetworkAreaDiagramLayerProps> = {
        data: undefined,
        coordinateMode: 'diagram',
        labelsVisible: true,
        edgeInfosVisible: true,
        nodeRadiusScale: 1,
        lineWidthScale: 1,
        getNodeLabel: { type: 'accessor', value: getNodeText },
    };

    override renderLayers(): Layer[] {
        const data = this.props.data;
        if (!data || !hasCoordinate(data, this.props.coordinateMode)) {
            return [];
        }

        const coordinateSystem =
            this.props.coordinateMode === 'diagram' ? COORDINATE_SYSTEM.CARTESIAN : COORDINATE_SYSTEM.LNGLAT;
        const radiusUnits = this.props.coordinateMode === 'diagram' ? 'common' : 'pixels';

        const edgePaths = this.getEdgePaths(data);
        const componentPaths = this.getComponentPaths(data);
        const componentCircles = this.getComponentCircles(data);
        const labels = this.getLabels(data);
        const arrows = this.getArrows(data);

        return [
            new PathLayer(
                this.getSubLayerProps({
                    id: 'nad-edges',
                    data: edgePaths,
                    coordinateSystem,
                    getPath: (datum: EdgePathDatum) => getPath(datum.halfEdge.path, this.props.coordinateMode),
                    getColor: (datum: EdgePathDatum) => strokeColor(datum.halfEdge.renderStyle),
                    getWidth: (datum: EdgePathDatum) =>
                        lineWidth(datum.halfEdge.renderStyle, this.props.lineWidthScale),
                    widthUnits: 'pixels',
                    pickable: this.props.pickable,
                })
            ),
            new PathLayer(
                this.getSubLayerProps({
                    id: 'nad-component-paths',
                    data: componentPaths,
                    coordinateSystem,
                    getPath: (datum: ComponentPathDatum) => getPath(datum.component.path, this.props.coordinateMode),
                    getColor: (datum: ComponentPathDatum) => strokeColor(datum.component.renderStyle),
                    getWidth: (datum: ComponentPathDatum) =>
                        lineWidth(datum.component.renderStyle, this.props.lineWidthScale),
                    widthUnits: 'pixels',
                    pickable: this.props.pickable,
                })
            ),
            new ScatterplotLayer(
                this.getSubLayerProps({
                    id: 'nad-node-shapes',
                    data: data.nodeShapes,
                    coordinateSystem,
                    getPosition: (shape: NadShape) => getPosition(shape.center, this.props.coordinateMode) ?? [0, 0],
                    getFillColor: (shape: NadShape) => fillColor(shape.renderStyle),
                    getLineColor: (shape: NadShape) => strokeColor(shape.renderStyle),
                    getLineWidth: (shape: NadShape) => lineWidth(shape.renderStyle, this.props.lineWidthScale),
                    getRadius: (shape: NadShape) =>
                        radius(shape.renderStyle, shape.radius ?? 8, this.props.nodeRadiusScale),
                    radiusUnits,
                    stroked: true,
                    filled: true,
                    pickable: this.props.pickable,
                })
            ),
            new ScatterplotLayer(
                this.getSubLayerProps({
                    id: 'nad-component-circles',
                    data: componentCircles,
                    coordinateSystem,
                    getPosition: (component: NadComponent) =>
                        getPosition(component.center, this.props.coordinateMode) ?? [0, 0],
                    getFillColor: (component: NadComponent) => fillColor(component.renderStyle),
                    getLineColor: (component: NadComponent) => strokeColor(component.renderStyle),
                    getLineWidth: (component: NadComponent) =>
                        lineWidth(component.renderStyle, this.props.lineWidthScale),
                    getRadius: (component: NadComponent) =>
                        radius(component.renderStyle, component.radius ?? 8, this.props.nodeRadiusScale),
                    radiusUnits,
                    stroked: true,
                    filled: true,
                    pickable: this.props.pickable,
                })
            ),
            new TextLayer(
                this.getSubLayerProps({
                    id: 'nad-labels',
                    data: labels,
                    coordinateSystem,
                    getPosition: (label: LabelDatum) => label.position,
                    getText: (label: LabelDatum) => label.text,
                    getColor: (label: LabelDatum) => textColor(label.renderStyle),
                    getSize: 12,
                    getAngle: (label: LabelDatum) => label.angle ?? 0,
                    getTextAnchor: 'middle',
                    getAlignmentBaseline: 'center',
                    visible: this.props.labelsVisible,
                    pickable: false,
                })
            ),
            new TextLayer(
                this.getSubLayerProps({
                    id: 'nad-arrows',
                    data: arrows,
                    coordinateSystem,
                    getPosition: (arrow: ArrowDatum) => arrow.position,
                    getText: (arrow: ArrowDatum) => arrow.text,
                    getColor: (arrow: ArrowDatum) => textColor(arrow.renderStyle),
                    getSize: 12,
                    getAngle: (arrow: ArrowDatum) => arrow.angle ?? 0,
                    getTextAnchor: 'middle',
                    getAlignmentBaseline: 'center',
                    visible: this.props.edgeInfosVisible,
                    pickable: false,
                })
            ),
        ];
    }

    private getEdgePaths(data: NadDeckData): EdgePathDatum[] {
        return data.edges.flatMap((edge) =>
            (edge.halfEdges ?? [])
                .filter((halfEdge) => halfEdge.visible !== false)
                .map((halfEdge) => ({ edge, halfEdge, picking: edge.picking }))
        );
    }

    private getComponentPaths(data: NadDeckData): ComponentPathDatum[] {
        return data.edges.flatMap((edge) =>
            (edge.components ?? [])
                .filter((component) => component.path)
                .map((component) => ({ component, picking: edge.picking }))
        );
    }

    private getComponentCircles(data: NadDeckData): NadComponent[] {
        return data.edges.flatMap((edge) => edge.components ?? []).filter((component) => component.center);
    }

    private getLabels(data: NadDeckData): LabelDatum[] {
        const nodeLabels = data.nodes
            .filter((node) => !node.invisible)
            .map((node): LabelDatum | null => {
                const position = getPosition(node.position, this.props.coordinateMode);
                if (!position) {
                    return null;
                }
                return {
                    id: node.svgId,
                    text: this.props.getNodeLabel(node),
                    position,
                    renderStyle: node.renderStyle,
                    picking: { equipmentId: node.equipmentId, svgId: node.svgId, type: node.type },
                };
            })
            .filter((label): label is LabelDatum => label !== null);

        const edgeLabels = data.edges.flatMap((edge) =>
            (edge.edgeInfos ?? [])
                .map((info) => this.getEdgeInfoLabel(edge, info))
                .filter((label): label is LabelDatum => label !== null)
        );

        const textNodeLabels = data.textNodes
            .map((textNode) => this.getTextNodeLabel(textNode))
            .filter((label): label is LabelDatum => label !== null);

        return [...nodeLabels, ...edgeLabels, ...textNodeLabels];
    }

    private getEdgeInfoLabel(edge: NadEdge, edgeInfo: NadEdgeInfo): LabelDatum | null {
        if (!this.props.edgeInfosVisible) {
            return null;
        }
        const position = getPosition(edgeInfo.anchor, this.props.coordinateMode);
        const text = [edgeInfo.labelB, edgeInfo.labelA].filter(Boolean).join(' / ');
        if (!position || !text) {
            return null;
        }
        return {
            id: edgeInfo.svgId,
            text,
            position,
            angle: edgeInfo.angle,
            renderStyle: edgeInfo.renderStyle,
            picking: edge.picking,
        };
    }

    private getTextNodeLabel(textNode: NadTextNode): LabelDatum | null {
        const position = getPosition(textNode.position, this.props.coordinateMode);
        if (!position || !textNode.equipmentId) {
            return null;
        }
        return {
            id: textNode.svgId,
            text: textNode.equipmentId,
            position,
            renderStyle: textNode.renderStyle,
            picking: textNode.picking,
        };
    }

    private getArrows(data: NadDeckData): ArrowDatum[] {
        return data.edges.flatMap((edge) =>
            (edge.edgeInfos ?? [])
                .map((edgeInfo) => this.getArrow(edge, edgeInfo))
                .filter((arrow): arrow is ArrowDatum => arrow !== null)
        );
    }

    private getArrow(edge: NadEdge, edgeInfo: NadEdgeInfo): ArrowDatum | null {
        const direction = edgeInfo.direction ?? edgeInfo.directionB ?? edgeInfo.directionA;
        const position = getPosition(edgeInfo.anchor, this.props.coordinateMode);
        if (!direction || !position) {
            return null;
        }
        return {
            id: edgeInfo.svgId + '-arrow',
            text: direction === 'IN' ? '<' : '>',
            position,
            angle: edgeInfo.angle,
            renderStyle: edgeInfo.renderStyle,
            picking: edge.picking,
        };
    }
}
