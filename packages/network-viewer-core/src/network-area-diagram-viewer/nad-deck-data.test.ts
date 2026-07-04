/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * SPDX-License-Identifier: MPL-2.0
 */

import { expect, test } from 'vitest';
import { getNadPath, getNadPosition, hasNadCoordinate, isNadDeckData, type NadDeckData } from './nad-deck-data';
import type { LayoutParametersMetadata, SvgParametersMetadata } from './diagram-metadata';

const deckData: NadDeckData = {
    schemaVersion: 1,
    layoutMode: 'GEOGRAPHICAL',
    renderCoordinates: ['DIAGRAM', 'GEO'],
    viewBox: { x: 0, y: 0, width: 100, height: 100 },
    parameters: {
        layout: {} as LayoutParametersMetadata,
        svg: {} as SvgParametersMetadata,
    },
    nodes: [],
    busNodes: [],
    nodeShapes: [],
    edges: [],
    injections: [],
    textNodes: [],
};

test('NadDeckData guard accepts schema v1 payload', () => {
    expect(isNadDeckData(deckData)).toBe(true);
    expect(isNadDeckData({ ...deckData, schemaVersion: 2 })).toBe(false);
});

test('NadDeckData helpers select diagram and geo coordinates', () => {
    expect(hasNadCoordinate(deckData, 'diagram')).toBe(true);
    expect(hasNadCoordinate(deckData, 'geo')).toBe(true);
    expect(
        getNadPosition(
            {
                diagram: { x: 1, y: 2 },
                geo: { lon: 3, lat: 4 },
            },
            'diagram'
        )
    ).toEqual([1, 2]);
    expect(
        getNadPosition(
            {
                diagram: { x: 1, y: 2 },
                geo: { lon: 3, lat: 4 },
            },
            'geo'
        )
    ).toEqual([3, 4]);
    expect(
        getNadPath(
            {
                diagram: [
                    { x: 1, y: 2 },
                    { x: 3, y: 4 },
                ],
                geo: [
                    { lon: 5, lat: 6 },
                    { lon: 7, lat: 8 },
                ],
            },
            'geo'
        )
    ).toEqual([
        [5, 6],
        [7, 8],
    ]);
});
