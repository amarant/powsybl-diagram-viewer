/**
 * Copyright (c) 2026, RTE (http://www.rte-france.com)
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import {
    Deck,
    OrthographicView,
    type DeckProps,
    type Layer,
    type OrthographicViewState,
    type PickingInfo,
} from '@deck.gl/core';
import { MapboxOverlay, type MapboxOverlayProps } from '@deck.gl/mapbox';
import { NetworkAreaDiagramLayer } from '@powsybl/network-map-layers';
import {
    getNadPosition,
    hasNadCoordinate,
    type NadCoordinateMode,
    type NadDeckData,
    type NadPickingData,
} from '@powsybl/network-viewer-core';
import mapboxgl from 'mapbox-gl';
import maplibregl from 'maplibre-gl';
import {
    forwardRef,
    memo,
    type CSSProperties,
    type ReactNode,
    useCallback,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Map, type MapProps, type MapRef, useControl } from 'react-map-gl/mapbox-legacy';

import 'mapbox-gl/dist/mapbox-gl.css';
import 'maplibre-gl/dist/maplibre-gl.css';

const DEFAULT_MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json';
const FALLBACK_MAPBOX_TOKEN =
    'pk.eyJ1IjoiZ2VvZmphbWciLCJhIjoiY2pwbnRwcm8wMDYzMDQ4b2pieXd0bDMxNSJ9.Q4aL20nBo5CzGkrWtxroug';

const DeckGLOverlay = forwardRef<MapboxOverlay, MapboxOverlayProps>((props, ref) => {
    const overlay = useControl<MapboxOverlay>(() => new MapboxOverlay(props));
    overlay.setProps(props);
    useImperativeHandle(ref, () => overlay, [overlay]);
    return null;
});

export type NetworkAreaDiagramDeckRenderMode = 'diagram' | 'map';
export type NetworkAreaDiagramDeckMapLibrary = 'maplibre' | 'mapbox';

export type NetworkAreaDiagramDeckProps = {
    data: NadDeckData;
    renderMode?: NetworkAreaDiagramDeckRenderMode;
    labelsVisible?: boolean;
    edgeInfosVisible?: boolean;
    mapLibrary?: NetworkAreaDiagramDeckMapLibrary;
    mapStyle?: string;
    mapBoxToken?: string;
    style?: CSSProperties;
    className?: string;
    unavailableGeoFallback?: ReactNode;
    onSelect?: (picking: NadPickingData, info: PickingInfo) => void;
    onContextMenu?: (picking: NadPickingData, event: MouseEvent) => void;
    onHover?: (picking: NadPickingData | null, info: PickingInfo) => void;
};

export type NetworkAreaDiagramDeckRef = {
    resetView: () => void;
    pickObject: (x: number, y: number) => PickingInfo | null;
};

function getPickingData(info: PickingInfo | null | undefined): NadPickingData | null {
    const object = info?.object as { picking?: NadPickingData | null } | null | undefined;
    return object?.picking ?? null;
}

function getInitialDiagramViewState(data: NadDeckData): OrthographicViewState {
    return {
        target: [data.viewBox.x + data.viewBox.width / 2, data.viewBox.y + data.viewBox.height / 2, 0],
        zoom: 0,
    };
}

function getInitialMapViewState(data: NadDeckData): NonNullable<MapProps['initialViewState']> {
    const positions = data.nodes
        .map((node) => getNadPosition(node.position, 'geo'))
        .filter((position): position is [number, number] => position !== null);
    if (positions.length === 0) {
        return { longitude: 0, latitude: 0, zoom: 2 };
    }
    const [lonSum, latSum] = positions.reduce(([lonAcc, latAcc], [lon, lat]) => [lonAcc + lon, latAcc + lat], [0, 0]);
    return {
        longitude: lonSum / positions.length,
        latitude: latSum / positions.length,
        zoom: 5,
        pitch: 0,
        bearing: 0,
    };
}

function createLayers(
    data: NadDeckData,
    coordinateMode: NadCoordinateMode,
    labelsVisible: boolean,
    edgeInfosVisible: boolean,
    onHover?: NetworkAreaDiagramDeckProps['onHover']
): Layer[] {
    return [
        new NetworkAreaDiagramLayer({
            id: 'network-area-diagram-deck-layer',
            data,
            coordinateMode,
            labelsVisible,
            edgeInfosVisible,
            pickable: true,
            onHover: (info) => {
                onHover?.(getPickingData(info), info);
            },
        }),
    ];
}

const NetworkAreaDiagramDeck = forwardRef<NetworkAreaDiagramDeckRef, NetworkAreaDiagramDeckProps>((rawProps, ref) => {
    const {
        data,
        renderMode = 'diagram',
        labelsVisible = true,
        edgeInfosVisible = true,
        mapLibrary = 'maplibre',
        mapStyle = DEFAULT_MAP_STYLE,
        mapBoxToken = FALLBACK_MAPBOX_TOKEN,
        style,
        className,
        unavailableGeoFallback = 'Geographic NAD data unavailable',
        onSelect,
        onContextMenu,
        onHover,
    } = rawProps;

    const containerRef = useRef<HTMLDivElement>(null);
    const deckRef = useRef<Deck<OrthographicView> | null>(null);
    const overlayRef = useRef<MapboxOverlay>(null);
    const mapRef = useRef<MapRef>(null);
    const [diagramViewState, setDiagramViewState] = useState<OrthographicViewState>(() =>
        getInitialDiagramViewState(data)
    );

    useEffect(() => {
        setDiagramViewState(getInitialDiagramViewState(data));
    }, [data]);

    const diagramLayers = useMemo(
        () => createLayers(data, 'diagram', labelsVisible, edgeInfosVisible, onHover),
        [data, labelsVisible, edgeInfosVisible, onHover]
    );
    const mapLayers = useMemo(
        () => createLayers(data, 'geo', labelsVisible, edgeInfosVisible, onHover),
        [data, labelsVisible, edgeInfosVisible, onHover]
    );

    const onClick = useCallback<NonNullable<DeckProps<OrthographicView>['onClick']>>(
        (info) => {
            const picking = getPickingData(info);
            if (picking) {
                onSelect?.(picking, info);
            }
            return Boolean(picking);
        },
        [onSelect]
    );

    useEffect(() => {
        if (renderMode !== 'diagram' || !containerRef.current) {
            return;
        }
        deckRef.current ??= new Deck({
            parent: containerRef.current,
            views: new OrthographicView({ id: 'diagram' }),
            controller: true,
        });
        return () => {
            deckRef.current?.finalize();
            deckRef.current = null;
        };
    }, [renderMode]);

    useEffect(() => {
        if (renderMode !== 'diagram' || !deckRef.current) {
            return;
        }
        deckRef.current.setProps({
            views: new OrthographicView({ id: 'diagram' }),
            viewState: diagramViewState,
            onViewStateChange: ({ viewState }) => setDiagramViewState(viewState as OrthographicViewState),
            layers: diagramLayers,
            onClick,
        });
    }, [diagramLayers, diagramViewState, onClick, renderMode]);

    const onDiagramContextMenu = useCallback(
        (event: React.MouseEvent<HTMLDivElement>) => {
            if (!deckRef.current || !onContextMenu) {
                return;
            }
            event.preventDefault();
            const rect = event.currentTarget.getBoundingClientRect();
            const info = deckRef.current.pickObject({
                x: event.clientX - rect.left,
                y: event.clientY - rect.top,
                radius: 5,
            });
            const picking = getPickingData(info);
            if (picking) {
                onContextMenu(picking, event.nativeEvent);
            }
        },
        [onContextMenu]
    );

    const onMapContextMenu = useCallback<NonNullable<MapProps['onContextMenu']>>(
        (event) => {
            if (!onContextMenu) {
                return;
            }
            const info = overlayRef.current?.pickObject({
                x: event.point.x,
                y: event.point.y,
                radius: 5,
            });
            const picking = getPickingData(info);
            if (picking) {
                onContextMenu(picking, event.originalEvent);
            }
        },
        [onContextMenu]
    );

    useImperativeHandle(
        ref,
        () => ({
            resetView() {
                if (renderMode === 'diagram') {
                    setDiagramViewState(getInitialDiagramViewState(data));
                } else {
                    const initialViewState = getInitialMapViewState(data);
                    mapRef.current?.flyTo({
                        center: [initialViewState.longitude ?? 0, initialViewState.latitude ?? 0],
                        zoom: initialViewState.zoom,
                        duration: 0,
                    });
                }
            },
            pickObject(x: number, y: number) {
                if (renderMode === 'diagram') {
                    return deckRef.current?.pickObject({ x, y, radius: 5 }) ?? null;
                }
                return overlayRef.current?.pickObject({ x, y, radius: 5 }) ?? null;
            },
        }),
        [data, renderMode]
    );

    if (renderMode === 'map' && !hasNadCoordinate(data, 'geo')) {
        return (
            <div className={className} style={style}>
                {unavailableGeoFallback}
            </div>
        );
    }

    if (renderMode === 'map') {
        const mapLib =
            mapLibrary === 'mapbox'
                ? { mapLib: mapboxgl, mapboxAccessToken: mapBoxToken }
                : { mapLib: maplibregl, mapboxAccessToken: undefined };
        return (
            <Map
                ref={mapRef}
                className={className}
                style={style}
                mapStyle={mapStyle}
                initialViewState={getInitialMapViewState(data)}
                // @ts-expect-error mapbox-gl/maplibre-gl type families are intentionally selected at runtime.
                mapLib={mapLib.mapLib}
                mapboxAccessToken={mapLib.mapboxAccessToken}
                onContextMenu={onMapContextMenu}
                doubleClickZoom={false}
            >
                <DeckGLOverlay
                    ref={overlayRef}
                    layers={mapLayers}
                    onClick={(info) => {
                        const picking = getPickingData(info);
                        if (picking) {
                            onSelect?.(picking, info);
                        }
                    }}
                />
            </Map>
        );
    }

    return (
        <div
            ref={containerRef}
            className={className}
            style={{ position: 'relative', ...style }}
            onContextMenu={onDiagramContextMenu}
        />
    );
});

export default memo(NetworkAreaDiagramDeck);
