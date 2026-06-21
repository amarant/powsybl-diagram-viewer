/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { LineLayer } from '@deck.gl/layers';
import { afterEach, test } from 'vitest';
import { expectElement, SCREENSHOT_OPTIONS, setupBrowserLayerRenderer } from '../../testUtils/browser-render';
import ConstantGapArcRadarLayer from './constant-gap-arc-radar-layer';

const { renderLayers, cleanup } = setupBrowserLayerRenderer();

afterEach(cleanup);

const CENTER = [2.36, 48.86] as [number, number];
const GAP_ANGLES = [0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2];

function createRingArcs(innerRadius: number, outerRadius: number, color: [number, number, number, number]) {
    return GAP_ANGLES.map((startAngle, index) => {
        let endAngle = GAP_ANGLES[(index + 1) % GAP_ANGLES.length];
        if (endAngle <= startAngle) {
            endAngle += Math.PI * 2;
        }
        return {
            id: `${innerRadius}-${index}`,
            position: CENTER,
            innerRadius,
            outerRadius,
            startAngle,
            endAngle,
            gapWidthPixels: 24,
            color,
        };
    });
}

test('constant-gap-arc-radar-layer-basic', async () => {
    const arcs = [
        ...createRingArcs(30, 58, [245, 144, 0, 235]),
        ...createRingArcs(70, 98, [245, 144, 0, 235]),
        ...createRingArcs(110, 142, [255, 185, 75, 235]),
    ];

    const lines = [
        {
            source: [2.32, CENTER[1]] as [number, number],
            target: [2.4, CENTER[1]] as [number, number],
        },
        {
            source: [CENTER[0], 48.82] as [number, number],
            target: [CENTER[0], 48.9] as [number, number],
        },
    ];

    const canvas = await renderLayers([
        new LineLayer({
            id: 'constant-gap-lines',
            data: lines,
            getSourcePosition: (line: (typeof lines)[number]) => line.source,
            getTargetPosition: (line: (typeof lines)[number]) => line.target,
            getColor: [230, 80, 0, 255],
            getWidth: 12,
            widthUnits: 'pixels',
        }),
        new ConstantGapArcRadarLayer({
            id: 'constant-gap-arc-radar-layer',
            data: arcs,
            radiusUnits: 'pixels',
            billboard: true,
            getPosition: (arc: (typeof arcs)[number]) => arc.position,
            getInnerRadius: (arc: (typeof arcs)[number]) => arc.innerRadius,
            getRadius: (arc: (typeof arcs)[number]) => arc.outerRadius,
            getStartAngle: (arc: (typeof arcs)[number]) => arc.startAngle,
            getEndAngle: (arc: (typeof arcs)[number]) => arc.endAngle,
            getGapWidthPixels: (arc: (typeof arcs)[number]) => arc.gapWidthPixels,
            getFillColor: (arc: (typeof arcs)[number]) => arc.color,
            stroked: false,
        } as never),
    ]);

    await expectElement(canvas).toMatchScreenshot('constant-gap-arc-radar-layer-basic', SCREENSHOT_OPTIONS);
});
