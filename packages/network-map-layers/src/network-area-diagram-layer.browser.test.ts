/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Deck, OrthographicView } from '@deck.gl/core';
import {
    type LayoutParametersMetadata,
    type NadDeckData,
    type SvgParametersMetadata,
} from '@powsybl/network-viewer-core';
import { afterEach, expect, test } from 'vitest';
import { expectElement, SCREENSHOT_OPTIONS } from './testUtils/browser-render';
import { NetworkAreaDiagramLayer } from './network-area-diagram-layer';

const deckData: NadDeckData = {
    schemaVersion: 1,
    networkId: 'n',
    layoutMode: 'GEOGRAPHICAL',
    renderCoordinates: ['DIAGRAM', 'GEO'],
    viewBox: { x: -50, y: -50, width: 180, height: 100 },
    projection: { type: 'NAD_WEB_MERCATOR', scale: 150000, radiusFactor: 150 },
    parameters: {
        layout: {} as LayoutParametersMetadata,
        svg: {} as SvgParametersMetadata,
    },
    nodes: [
        {
            svgId: 'vl1',
            equipmentId: 'VL1',
            type: 'VOLTAGE_LEVEL',
            position: { diagram: { x: 0, y: 0 }, geo: { lon: 2.36, lat: 48.86 } },
            legendHeader: ['VL1'],
        },
        {
            svgId: 'vl2',
            equipmentId: 'VL2',
            type: 'VOLTAGE_LEVEL',
            position: { diagram: { x: 100, y: 0 }, geo: { lon: 2.365, lat: 48.86 } },
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
            center: { diagram: { x: 0, y: 0 }, geo: { lon: 2.36, lat: 48.86 } },
            radius: 30,
            renderStyle: {
                fillColor: [255, 255, 255, 255],
                strokeColor: [0, 0, 0, 255],
                strokeWidth: 3,
            },
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
                        geo: [
                            { lon: 2.3615, lat: 48.86 },
                            { lon: 2.3625, lat: 48.86 },
                        ],
                    },
                    renderStyle: { strokeColor: [0, 0, 0, 255], strokeWidth: 3 },
                },
                {
                    side: 'TWO',
                    visible: true,
                    path: {
                        diagram: [
                            { x: 70, y: 0 },
                            { x: 50, y: 0 },
                        ],
                        geo: [
                            { lon: 2.3635, lat: 48.86 },
                            { lon: 2.3625, lat: 48.86 },
                        ],
                    },
                    renderStyle: { strokeColor: [0, 0, 0, 255], strokeWidth: 3 },
                },
            ],
            picking: { equipmentId: 'LINE1', svgId: 'line1', type: 'LineEdge' },
        },
    ],
    injections: [],
    textNodes: [],
};

let currentDeck: Deck | null = null;
let currentContainer: HTMLDivElement | null = null;

afterEach(() => {
    currentDeck?.finalize();
    currentDeck = null;
    currentContainer?.remove();
    currentContainer = null;
});

function createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.width = '1000px';
    container.style.height = '1000px';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    document.body.append(container);
    return container;
}

async function renderDeck(deck: Deck): Promise<HTMLCanvasElement> {
    deck.redraw(true);
    await new Promise<void>((resolve) => setTimeout(resolve, 250));

    const canvas = currentContainer?.querySelector('canvas');
    if (!(canvas instanceof HTMLCanvasElement)) {
        throw new Error('Unable to find deck.gl canvas');
    }
    return canvas;
}

function expectCanvasNonBlank(canvas: HTMLCanvasElement): void {
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    if (!gl) {
        throw new Error('Unable to read deck.gl WebGL context');
    }

    const pixels = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    let paintedPixels = 0;
    for (let index = 0; index < pixels.length; index += 4) {
        if (pixels[index + 3] > 0 && (pixels[index] > 0 || pixels[index + 1] > 0 || pixels[index + 2] > 0)) {
            paintedPixels += 1;
        }
    }

    expect(paintedPixels).toBeGreaterThan(0);
}

test('NetworkAreaDiagramLayer renders diagram coordinates and exposes picking data', async () => {
    currentContainer = createContainer();
    currentDeck = new Deck({
        parent: currentContainer,
        width: 1000,
        height: 1000,
        useDevicePixels: false,
        glOptions: { preserveDrawingBuffer: true },
        views: [new OrthographicView({ id: 'diagram' })],
        initialViewState: { target: [0, 0, 0], zoom: 3 },
        controller: false,
        layers: [
            new NetworkAreaDiagramLayer({
                id: 'nad-diagram',
                data: deckData,
                coordinateMode: 'diagram',
                pickable: true,
            }),
        ],
    });

    const canvas = await renderDeck(currentDeck);
    expectCanvasNonBlank(canvas);
    await expectElement(canvas).toMatchScreenshot('network-area-diagram-layer-diagram', SCREENSHOT_OPTIONS);

    const picked = currentDeck.pickObject({ x: 500, y: 500, radius: 20 });
    expect(picked?.object?.picking).toEqual({ equipmentId: 'VL1', svgId: 'vl1', type: 'VOLTAGE_LEVEL' });
});

test('NetworkAreaDiagramLayer renders geo coordinates', async () => {
    currentContainer = createContainer();
    currentDeck = new Deck({
        parent: currentContainer,
        width: 1000,
        height: 1000,
        useDevicePixels: false,
        glOptions: { preserveDrawingBuffer: true },
        initialViewState: {
            longitude: 2.36,
            latitude: 48.86,
            zoom: 13,
            pitch: 0,
            bearing: 0,
        },
        controller: false,
        layers: [
            new NetworkAreaDiagramLayer({
                id: 'nad-geo',
                data: deckData,
                coordinateMode: 'geo',
                pickable: true,
            }),
        ],
    });

    const canvas = await renderDeck(currentDeck);
    expectCanvasNonBlank(canvas);
    await expectElement(canvas).toMatchScreenshot('network-area-diagram-layer-geo', SCREENSHOT_OPTIONS);
});
