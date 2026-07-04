/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { testLayer } from '@deck.gl/test-utils/vitest';
import {
    type LayoutParametersMetadata,
    type NadDeckData,
    type SvgParametersMetadata,
} from '@powsybl/network-viewer-core';
import { expect, test } from 'vitest';
import { NetworkAreaDiagramLayer } from './network-area-diagram-layer';

const deckData: NadDeckData = {
    schemaVersion: 1,
    networkId: 'n',
    layoutMode: 'FORCE',
    renderCoordinates: ['DIAGRAM'],
    viewBox: { x: -20, y: -20, width: 140, height: 80 },
    parameters: {
        layout: {} as LayoutParametersMetadata,
        svg: {} as SvgParametersMetadata,
    },
    nodes: [
        {
            svgId: 'vl1',
            equipmentId: 'VL1',
            type: 'VOLTAGE_LEVEL',
            position: { diagram: { x: 0, y: 0 } },
            legendHeader: ['VL1'],
        },
        {
            svgId: 'vl2',
            equipmentId: 'VL2',
            type: 'VOLTAGE_LEVEL',
            position: { diagram: { x: 100, y: 0 } },
            legendHeader: ['VL2'],
        },
    ],
    busNodes: [],
    nodeShapes: [
        {
            id: 'vl1-shape',
            type: 'CIRCLE',
            equipmentId: 'VL1',
            node: 'vl1',
            center: { diagram: { x: 0, y: 0 } },
            radius: 30,
            picking: { equipmentId: 'VL1', svgId: 'vl1', type: 'VOLTAGE_LEVEL' },
        },
    ],
    edges: [
        {
            svgId: 'line1',
            equipmentId: 'LINE1',
            type: 'LineEdge',
            node1: 'vl1',
            node2: 'vl2',
            halfEdges: [
                {
                    side: 'ONE',
                    visible: true,
                    path: {
                        diagram: [
                            { x: 30, y: 0 },
                            { x: 50, y: 0 },
                        ],
                    },
                },
                {
                    side: 'TWO',
                    visible: true,
                    path: {
                        diagram: [
                            { x: 70, y: 0 },
                            { x: 50, y: 0 },
                        ],
                    },
                },
            ],
            edgeInfos: [
                {
                    svgId: 'line1-info',
                    labelA: '10',
                    labelB: '-10',
                    anchor: { diagram: { x: 50, y: 0 } },
                    angle: 0,
                },
            ],
            picking: { equipmentId: 'LINE1', svgId: 'line1', type: 'LineEdge' },
        },
    ],
    injections: [],
    textNodes: [],
};

test('NetworkAreaDiagramLayer renders expected sublayers', () => {
    testLayer({
        Layer: NetworkAreaDiagramLayer,
        testCases: [
            {
                title: 'initializes NAD sublayers',
                props: {
                    id: 'nad-layer-under-test',
                    data: deckData,
                    coordinateMode: 'diagram',
                    pickable: true,
                },
                onAfterUpdate: ({ subLayers }: { subLayers: Array<{ id: string }> }) => {
                    expect(subLayers).toHaveLength(6);
                    expect(subLayers.some((subLayer) => subLayer.id.includes('nad-edges'))).toBe(true);
                    expect(subLayers.some((subLayer) => subLayer.id.includes('nad-node-shapes'))).toBe(true);
                    expect(subLayers.some((subLayer) => subLayer.id.includes('nad-labels'))).toBe(true);
                },
            },
        ],
    });
});
