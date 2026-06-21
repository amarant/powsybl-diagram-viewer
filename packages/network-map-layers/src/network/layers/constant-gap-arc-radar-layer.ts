/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import type { Accessor, DefaultProps } from '@deck.gl/core';
import { ScatterplotLayer, type ScatterplotLayerProps } from '@deck.gl/layers';

const TWO_PI = Math.PI * 2;

type _ConstantGapArcRadarLayerProps<DataT = unknown> = {
    /** Inner radius accessor, expressed in the same units as ScatterplotLayer's getRadius accessor. */
    getInnerRadius: Accessor<DataT, number>;
    /** Arc start gap center angle in radians. Zero points east and positive values rotate counter-clockwise. */
    getStartAngle: Accessor<DataT, number>;
    /** Arc end gap center angle in radians. Values lower than the start angle wrap through 2 PI. */
    getEndAngle: Accessor<DataT, number>;
    /** Constant screen-space gap width around the start and end angles. */
    getGapWidthPixels: Accessor<DataT, number>;
};
export type ConstantGapArcRadarLayerProps<DataT = unknown> = _ConstantGapArcRadarLayerProps<DataT> &
    ScatterplotLayerProps<DataT>;

const defaultProps: DefaultProps<ConstantGapArcRadarLayerProps> = {
    getInnerRadius: { type: 'accessor', value: 0 },
    getStartAngle: { type: 'accessor', value: 0 },
    getEndAngle: { type: 'accessor', value: TWO_PI },
    getGapWidthPixels: { type: 'accessor', value: 0 },
};

const CONSTANT_GAP_ARC_RADAR_LAYER_VERTEX_SHADER = `\
#version 300 es
#define SHADER_NAME constant-gap-arc-radar-layer-vertex-shader

in vec3 positions;

in vec3 instancePositions;
in vec3 instancePositions64Low;
in float instanceRadius;
in float instanceLineWidths;
in vec4 instanceFillColors;
in vec4 instanceLineColors;
in vec3 instancePickingColors;
in vec2 instancePixelOffset;
in float instanceInnerRadius;
in float instanceStartAngle;
in float instanceEndAngle;
in float instanceGapWidthPixels;

out vec4 vFillColor;
out vec4 vLineColor;
out vec2 unitPosition;
out float innerUnitRadius;
out float outerRadiusPixels;
out float radarInnerRadiusPixels;
out float radarStartAngle;
out float radarEndAngle;
out float radarGapHalfWidthPixels;

void main(void) {
  geometry.worldPosition = instancePositions;

  outerRadiusPixels = clamp(
    project_size_to_pixel(scatterplot.radiusScale * instanceRadius, scatterplot.radiusUnits),
    scatterplot.radiusMinPixels,
    scatterplot.radiusMaxPixels
  );

  float lineWidthPixels = clamp(
    project_size_to_pixel(scatterplot.lineWidthScale * instanceLineWidths, scatterplot.lineWidthUnits),
    scatterplot.lineWidthMinPixels,
    scatterplot.lineWidthMaxPixels
  );

  outerRadiusPixels += scatterplot.stroked * lineWidthPixels / 2.0;
  float edgePadding = scatterplot.antialiasing ? (outerRadiusPixels + SMOOTH_EDGE_RADIUS) / outerRadiusPixels : 1.0;

  unitPosition = edgePadding * positions.xy;
  geometry.uv = unitPosition;
  geometry.pickingColor = instancePickingColors;

  innerUnitRadius = 1.0 - scatterplot.stroked * lineWidthPixels / outerRadiusPixels;
  radarInnerRadiusPixels = clamp(
    project_size_to_pixel(scatterplot.radiusScale * instanceInnerRadius, scatterplot.radiusUnits),
    0.0,
    outerRadiusPixels
  );
  radarStartAngle = instanceStartAngle;
  radarEndAngle = instanceEndAngle;
  radarGapHalfWidthPixels = max(instanceGapWidthPixels, 0.0) * 0.5;

  if (scatterplot.billboard) {
    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, vec3(0.0), geometry.position);
    DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
    vec3 offset = edgePadding * positions * outerRadiusPixels;
    offset.xy += instancePixelOffset;
    DECKGL_FILTER_SIZE(offset, geometry);
    gl_Position.xy += project_pixel_size_to_clipspace(offset.xy);
  } else {
    vec3 offset = edgePadding * positions * project_pixel_size(outerRadiusPixels);
    offset.xy += project_pixel_size(instancePixelOffset);
    DECKGL_FILTER_SIZE(offset, geometry);
    gl_Position = project_position_to_clipspace(instancePositions, instancePositions64Low, offset, geometry.position);
    DECKGL_FILTER_GL_POSITION(gl_Position, geometry);
  }

  vFillColor = vec4(instanceFillColors.rgb, instanceFillColors.a * layer.opacity);
  DECKGL_FILTER_COLOR(vFillColor, geometry);
  vLineColor = vec4(instanceLineColors.rgb, instanceLineColors.a * layer.opacity);
  DECKGL_FILTER_COLOR(vLineColor, geometry);
}
`;

const CONSTANT_GAP_ARC_RADAR_LAYER_FRAGMENT_SHADER = `\
#version 300 es
#define SHADER_NAME constant-gap-arc-radar-layer-fragment-shader

precision highp float;

const float PI = radians(180.0);
const float TWO_PI = 2.0 * PI;

in vec4 vFillColor;
in vec4 vLineColor;
in vec2 unitPosition;
in float innerUnitRadius;
in float outerRadiusPixels;
in float radarInnerRadiusPixels;
in float radarStartAngle;
in float radarEndAngle;
in float radarGapHalfWidthPixels;

out vec4 fragColor;

float lineDistancePixels(vec2 pointPixels, float angle) {
  vec2 direction = vec2(cos(angle), sin(angle));
  return abs(direction.x * pointPixels.y - direction.y * pointPixels.x);
}

void main(void) {
  geometry.uv = unitPosition;

  float distToCenter = length(unitPosition) * outerRadiusPixels;
  float inCircle = scatterplot.antialiasing ?
    smoothedge(distToCenter, outerRadiusPixels) :
    step(distToCenter, outerRadiusPixels);

  float angle = mod(atan(unitPosition.y, unitPosition.x) + TWO_PI, TWO_PI);
  float normalizedStartAngle = mod(radarStartAngle, TWO_PI);
  float normalizedEndAngle = mod(radarEndAngle, TWO_PI);
  normalizedStartAngle = normalizedStartAngle < 0.0 ? normalizedStartAngle + TWO_PI : normalizedStartAngle;
  normalizedEndAngle = normalizedEndAngle < 0.0 ? normalizedEndAngle + TWO_PI : normalizedEndAngle;
  float inAngle = abs(radarEndAngle - radarStartAngle) >= TWO_PI - 0.000001 ? 1.0 : (
    normalizedStartAngle <= normalizedEndAngle
    ? step(normalizedStartAngle, angle) * step(angle, normalizedEndAngle)
    : max(step(normalizedStartAngle, angle), step(angle, normalizedEndAngle))
  );

  vec2 pointPixels = unitPosition * outerRadiusPixels;
  float startGapDistancePixels = lineDistancePixels(pointPixels, radarStartAngle);
  float endGapDistancePixels = lineDistancePixels(pointPixels, radarEndAngle);
  float inStartGap = step(startGapDistancePixels, radarGapHalfWidthPixels);
  float inEndGap = step(endGapDistancePixels, radarGapHalfWidthPixels);

  if (
    inCircle == 0.0 ||
    distToCenter < radarInnerRadiusPixels ||
    inAngle == 0.0 ||
    inStartGap > 0.0 ||
    inEndGap > 0.0
  ) {
    discard;
  }

  if (scatterplot.stroked > 0.5) {
    float isLine = scatterplot.antialiasing ?
      smoothedge(innerUnitRadius * outerRadiusPixels, distToCenter) :
      step(innerUnitRadius * outerRadiusPixels, distToCenter);

    if (scatterplot.filled > 0.5) {
      fragColor = mix(vFillColor, vLineColor, isLine);
    } else {
      if (isLine == 0.0) {
        discard;
      }
      fragColor = vec4(vLineColor.rgb, vLineColor.a * isLine);
    }
  } else if (scatterplot.filled < 0.5) {
    discard;
  } else {
    fragColor = vFillColor;
  }

  fragColor.a *= inCircle;
  DECKGL_FILTER_COLOR(fragColor, geometry);
}
`;

const CONSTANT_GAP_ARC_RADAR_LAYER_SHADER_SOURCE = `\
// Main shaders

const PI: f32 = radians(180.0);
const TWO_PI: f32 = 2.0 * PI;

struct ScatterplotUniforms {
  radiusScale: f32,
  radiusMinPixels: f32,
  radiusMaxPixels: f32,
  lineWidthScale: f32,
  lineWidthMinPixels: f32,
  lineWidthMaxPixels: f32,
  stroked: f32,
  filled: i32,
  antialiasing: i32,
  billboard: i32,
  radiusUnits: i32,
  lineWidthUnits: i32,
};

struct ConstantAttributeUniforms {
 instancePositions: vec3<f32>,
 instancePositions64Low: vec3<f32>,
 instanceRadius: f32,
 instanceLineWidths: f32,
 instanceFillColors: vec4<f32>,
 instanceLineColors: vec4<f32>,
 instancePickingColors: vec3<f32>,
 instancePixelOffset: vec2<f32>,
 instanceInnerRadius: f32,
 instanceStartAngle: f32,
 instanceEndAngle: f32,
 instanceGapWidthPixels: f32,

 instancePositionsConstant: i32,
 instancePositions64LowConstant: i32,
 instanceRadiusConstant: i32,
 instanceLineWidthsConstant: i32,
 instanceFillColorsConstant: i32,
 instanceLineColorsConstant: i32,
 instancePickingColorsConstant: i32,
 instancePixelOffsetConstant: i32,
 instanceInnerRadiusConstant: i32,
 instanceStartAngleConstant: i32,
 instanceEndAngleConstant: i32,
 instanceGapWidthPixelsConstant: i32
};

@group(0) @binding(0) var<uniform> scatterplot: ScatterplotUniforms;

struct ConstantAttributes {
  instancePositions: vec3<f32>,
  instancePositions64Low: vec3<f32>,
  instanceRadius: f32,
  instanceLineWidths: f32,
  instanceFillColors: vec4<f32>,
  instanceLineColors: vec4<f32>,
  instancePickingColors: vec3<f32>,
  instancePixelOffset: vec2<f32>,
  instanceInnerRadius: f32,
  instanceStartAngle: f32,
  instanceEndAngle: f32,
  instanceGapWidthPixels: f32
};

const constants = ConstantAttributes(
  vec3<f32>(0.0),
  vec3<f32>(0.0),
  0.0,
  0.0,
  vec4<f32>(0.0, 0.0, 0.0, 1.0),
  vec4<f32>(0.0, 0.0, 0.0, 1.0),
  vec3<f32>(0.0),
  vec2<f32>(0.0),
  0.0,
  0.0,
  TWO_PI,
  0.0
);

struct Attributes {
  @builtin(instance_index) instanceIndex : u32,
  @builtin(vertex_index) vertexIndex : u32,
  @location(0) positions: vec3<f32>,
  @location(1) instancePositions: vec3<f32>,
  @location(2) instancePositions64Low: vec3<f32>,
  @location(3) instanceRadius: f32,
  @location(4) instanceLineWidths: f32,
  @location(5) instanceFillColors: vec4<f32>,
  @location(6) instanceLineColors: vec4<f32>,
  @location(7) instancePickingColors: vec3<f32>,
  @location(8) instancePixelOffset: vec2<f32>,
  @location(9) instanceInnerRadius: f32,
  @location(10) instanceStartAngle: f32,
  @location(11) instanceEndAngle: f32,
  @location(12) instanceGapWidthPixels: f32
};

struct Varyings {
  @builtin(position) position: vec4<f32>,
  @location(0) vFillColor: vec4<f32>,
  @location(1) vLineColor: vec4<f32>,
  @location(2) unitPosition: vec2<f32>,
  @location(3) innerUnitRadius: f32,
  @location(4) outerRadiusPixels: f32,
  @location(5) radarInnerRadiusPixels: f32,
  @location(6) radarStartAngle: f32,
  @location(7) radarEndAngle: f32,
  @location(8) radarGapHalfWidthPixels: f32,
  @location(9) pickingColor: vec3<f32>,
};

@vertex
fn vertexMain(attributes: Attributes) -> Varyings {
  var varyings: Varyings;

  geometry.worldPosition = attributes.instancePositions;

  varyings.outerRadiusPixels = clamp(
    project_unit_size_to_pixel(scatterplot.radiusScale * attributes.instanceRadius, scatterplot.radiusUnits),
    scatterplot.radiusMinPixels,
    scatterplot.radiusMaxPixels
  );

  let lineWidthPixels = clamp(
    project_unit_size_to_pixel(scatterplot.lineWidthScale * attributes.instanceLineWidths, scatterplot.lineWidthUnits),
    scatterplot.lineWidthMinPixels,
    scatterplot.lineWidthMaxPixels
  );

  varyings.outerRadiusPixels += scatterplot.stroked * lineWidthPixels / 2.0;
  let edgePadding = select(
    (varyings.outerRadiusPixels + SMOOTH_EDGE_RADIUS) / varyings.outerRadiusPixels,
    1.0,
    scatterplot.antialiasing != 0
  );

  varyings.unitPosition = edgePadding * attributes.positions.xy;
  geometry.uv = varyings.unitPosition;
  geometry.pickingColor = attributes.instancePickingColors;

  varyings.innerUnitRadius = 1.0 - scatterplot.stroked * lineWidthPixels / varyings.outerRadiusPixels;
  varyings.radarInnerRadiusPixels = clamp(
    project_unit_size_to_pixel(scatterplot.radiusScale * attributes.instanceInnerRadius, scatterplot.radiusUnits),
    0.0,
    varyings.outerRadiusPixels
  );
  varyings.radarStartAngle = attributes.instanceStartAngle;
  varyings.radarEndAngle = attributes.instanceEndAngle;
  varyings.radarGapHalfWidthPixels = max(attributes.instanceGapWidthPixels, 0.0) * 0.5;

  if (scatterplot.billboard != 0) {
    varyings.position = project_position_to_clipspace(attributes.instancePositions, attributes.instancePositions64Low, vec3<f32>(0.0));
    var offset = edgePadding * attributes.positions * varyings.outerRadiusPixels;
    offset = vec3<f32>(offset.xy + attributes.instancePixelOffset, offset.z);
    let clipPixels = project_pixel_size_to_clipspace(offset.xy);
    varyings.position = vec4<f32>(varyings.position.x + clipPixels.x, varyings.position.y + clipPixels.y, varyings.position.z, varyings.position.w);
  } else {
    var offset = edgePadding * attributes.positions * project_pixel_size_float(varyings.outerRadiusPixels);
    offset = vec3<f32>(offset.xy + project_pixel_size_vec2(attributes.instancePixelOffset), offset.z);
    varyings.position = project_position_to_clipspace(attributes.instancePositions, attributes.instancePositions64Low, offset);
  }

  varyings.vFillColor = vec4<f32>(attributes.instanceFillColors.rgb, attributes.instanceFillColors.a * layer.opacity);
  varyings.vLineColor = vec4<f32>(attributes.instanceLineColors.rgb, attributes.instanceLineColors.a * layer.opacity);
  varyings.pickingColor = attributes.instancePickingColors;

  return varyings;
}

fn lineDistancePixels(pointPixels: vec2<f32>, angle: f32) -> f32 {
  let direction = vec2<f32>(cos(angle), sin(angle));
  return abs(direction.x * pointPixels.y - direction.y * pointPixels.x);
}

@fragment
fn fragmentMain(varyings: Varyings) -> @location(0) vec4<f32> {
  let distToCenter = length(varyings.unitPosition) * varyings.outerRadiusPixels;
  let inCircle = select(
    smoothedge(distToCenter, varyings.outerRadiusPixels),
    step(distToCenter, varyings.outerRadiusPixels),
    scatterplot.antialiasing != 0
  );

  let angle = (atan2(varyings.unitPosition.y, varyings.unitPosition.x) + TWO_PI) % TWO_PI;
  var normalizedStartAngle = varyings.radarStartAngle % TWO_PI;
  var normalizedEndAngle = varyings.radarEndAngle % TWO_PI;
  normalizedStartAngle = select(normalizedStartAngle, normalizedStartAngle + TWO_PI, normalizedStartAngle < 0.0);
  normalizedEndAngle = select(normalizedEndAngle, normalizedEndAngle + TWO_PI, normalizedEndAngle < 0.0);
  let inAngle = select(
    select(
      max(step(normalizedStartAngle, angle), step(angle, normalizedEndAngle)),
      step(normalizedStartAngle, angle) * step(angle, normalizedEndAngle),
      normalizedStartAngle <= normalizedEndAngle
    ),
    1.0,
    abs(varyings.radarEndAngle - varyings.radarStartAngle) >= TWO_PI - 0.000001
  );

  let pointPixels = varyings.unitPosition * varyings.outerRadiusPixels;
  let startGapDistancePixels = lineDistancePixels(pointPixels, varyings.radarStartAngle);
  let endGapDistancePixels = lineDistancePixels(pointPixels, varyings.radarEndAngle);
  let inStartGap = step(startGapDistancePixels, varyings.radarGapHalfWidthPixels);
  let inEndGap = step(endGapDistancePixels, varyings.radarGapHalfWidthPixels);

  if (
    inCircle == 0.0 ||
    distToCenter < varyings.radarInnerRadiusPixels ||
    inAngle == 0.0 ||
    inStartGap > 0.0 ||
    inEndGap > 0.0
  ) {
    discard;
  }

  var fragColor: vec4<f32>;

  if (scatterplot.stroked != 0) {
    let isLine = select(
      smoothedge(varyings.innerUnitRadius * varyings.outerRadiusPixels, distToCenter),
      step(varyings.innerUnitRadius * varyings.outerRadiusPixels, distToCenter),
      scatterplot.antialiasing != 0
    );

    if (scatterplot.filled != 0) {
      fragColor = mix(varyings.vFillColor, varyings.vLineColor, isLine);
    } else {
      if (isLine == 0.0) {
        discard;
      }
      fragColor = vec4<f32>(varyings.vLineColor.rgb, varyings.vLineColor.a * isLine);
    }
  } else if (scatterplot.filled == 0) {
    discard;
  } else {
    fragColor = varyings.vFillColor;
  }

  fragColor.a *= inCircle;

  if (picking.isActive > 0.5) {
    if (!picking_isColorValid(varyings.pickingColor)) {
      discard;
    }
    return vec4<f32>(varyings.pickingColor, 1.0);
  }

  if (picking.isHighlightActive > 0.5) {
    let highlightedObjectColor = picking_normalizeColor(picking.highlightedObjectColor);
    if (picking_isColorZero(abs(varyings.pickingColor - highlightedObjectColor))) {
      let highLightAlpha = picking.highlightColor.a;
      let blendedAlpha = highLightAlpha + fragColor.a * (1.0 - highLightAlpha);
      if (blendedAlpha > 0.0) {
        let highLightRatio = highLightAlpha / blendedAlpha;
        fragColor = vec4<f32>(
          mix(fragColor.rgb, picking.highlightColor.rgb, highLightRatio),
          blendedAlpha
        );
      } else {
        fragColor = vec4<f32>(fragColor.rgb, 0.0);
      }
    }
  }

  fragColor = deckgl_premultiplied_alpha(fragColor);

  return fragColor;
}
`;

/**
 * A scatterplot-derived layer that draws annular sectors separated by constant screen-space gaps.
 *
 * The outer radius is the standard ScatterplotLayer getRadius accessor; the inner radius is getInnerRadius.
 * Start and end angles define the center lines of the gaps around each sector.
 */
export default class ConstantGapArcRadarLayer<DataT = unknown> extends ScatterplotLayer<
    DataT,
    Required<_ConstantGapArcRadarLayerProps<DataT>>
> {
    // noinspection JSUnusedGlobalSymbols -- it's dynamically get by deck.gl
    static readonly layerName = 'ConstantGapArcRadarLayer';
    // noinspection JSUnusedGlobalSymbols -- it's dynamically get by deck.gl
    static readonly defaultProps = defaultProps;

    override getShaders() {
        const shaders = super.getShaders();
        return {
            ...shaders,
            vs: CONSTANT_GAP_ARC_RADAR_LAYER_VERTEX_SHADER,
            fs: CONSTANT_GAP_ARC_RADAR_LAYER_FRAGMENT_SHADER,
            source: CONSTANT_GAP_ARC_RADAR_LAYER_SHADER_SOURCE,
        };
    }

    override initializeState() {
        super.initializeState();
        this.getAttributeManager()?.addInstanced({
            instanceInnerRadius: {
                size: 1,
                transition: true,
                accessor: 'getInnerRadius',
                type: 'float32',
                defaultValue: 0,
            },
            instanceStartAngle: {
                size: 1,
                transition: true,
                accessor: 'getStartAngle',
                type: 'float32',
                defaultValue: 0,
            },
            instanceEndAngle: {
                size: 1,
                transition: true,
                accessor: 'getEndAngle',
                type: 'float32',
                defaultValue: TWO_PI,
            },
            instanceGapWidthPixels: {
                size: 1,
                transition: true,
                accessor: 'getGapWidthPixels',
                type: 'float32',
                defaultValue: 0,
            },
        });
    }
}
