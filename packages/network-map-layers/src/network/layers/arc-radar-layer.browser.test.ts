/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { afterEach, test } from 'vitest';
import { expectElement, SCREENSHOT_OPTIONS, setupBrowserLayerRenderer } from '../../testUtils/browser-render';
import ArcRadarLayer from './arc-radar-layer';

const { renderLayers, cleanup } = setupBrowserLayerRenderer();

afterEach(cleanup);

test('arc-radar-layer-basic', async () => {
    const arcs = [
        {
            id: 's1',
            position: [2.35, 48.85] as [number, number],
            innerRadius: 250,
            outerRadius: 900,
            startAngle: 0,
            endAngle: Math.PI * 0.75,
            color: [107, 178, 40, 220],
        },
        {
            id: 's2',
            position: [2.37, 48.87] as [number, number],
            innerRadius: 350,
            outerRadius: 1100,
            startAngle: Math.PI * 1.5,
            endAngle: Math.PI * 0.25,
            color: [220, 90, 80, 220],
        },
    ];

    const canvas = await renderLayers([
        new ArcRadarLayer({
            id: 'arc-radar-layer',
            data: arcs,
            getPosition: (arc: (typeof arcs)[number]) => arc.position,
            getInnerRadius: (arc: (typeof arcs)[number]) => arc.innerRadius,
            getRadius: (arc: (typeof arcs)[number]) => arc.outerRadius,
            getStartAngle: (arc: (typeof arcs)[number]) => arc.startAngle,
            getEndAngle: (arc: (typeof arcs)[number]) => arc.endAngle,
            getFillColor: (arc: (typeof arcs)[number]) => arc.color,
            radiusMinPixels: 1,
            radiusMaxPixels: 120,
            stroked: false,
        } as never),
    ]);

    await expectElement(canvas).toMatchScreenshot('arc-radar-layer-basic', SCREENSHOT_OPTIONS);
});
