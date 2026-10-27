import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { TILE_CONFIG } from '../map/tileConfig';
import type { School } from '../types/school';
import { Layers, RefreshCw, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface SchoolMapProps {
  schools: School[];
  selectedSchoolCode: string | null;
  selectedDistrict: string;
  onSelectSchool: (school: School) => void;
  onSelectDistrict?: (district: string) => void;
  isMapTabActive?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  일반고: '#2563eb', // Blue
  자사고: '#7c3aed', // Violet
  특목고: '#d97706', // Amber
  영재고: '#e11d48', // Rose
  특성화고: '#059669', // Emerald
  학력인정고: '#475569', // Slate
  기타: '#64748b', // Slate
};

function getGenderSymbol(genderType: string): string {
  if (genderType === '남학교') return '남';
  if (genderType === '여학교') return '여';
  if (genderType === '남녀공학') return '공';
  return '고';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const SchoolMap: React.FC<SchoolMapProps> = ({
  schools,
  selectedSchoolCode,
  selectedDistrict,
  onSelectSchool,
  onSelectDistrict,
  isMapTabActive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const districtLayerRef = useRef<L.GeoJSON | null>(null);
  const eduOfficeLayerRef = useRef<L.GeoJSON | null>(null);
  const markersMapRef = useRef<Map<string, L.Marker>>(new Map());
  const districtPolygonsRef = useRef<Map<string, L.Polygon>>(new Map());

  // UI state
  const [isMapReady, setIsMapReady] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [showDistricts, setShowDistricts] = useState(true);
  const [showEduOffices, setShowEduOffices] = useState(false);
  const [hasGeoJsonError, setHasGeoJsonError] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // StrictMode duplicate check

    const seoulBounds = L.latLngBounds(
      [37.413, 126.734], // SW
      [37.715, 127.269]  // NE
    );

    const maxBounds = L.latLngBounds(
      [37.25, 126.55],
      [37.85, 127.45]
    );

    const map = L.map(mapContainerRef.current, {
      center: [37.5665, 126.9780],
      zoom: 11,
      minZoom: 10,
      maxBounds: maxBounds,
      maxBoundsViscosity: 0.7,
      attributionControl: true,
      zoomControl: false,
    });

    // Custom panes for proper layer stacking
    map.createPane('boundariesPane');
    const boundariesPane = map.getPane('boundariesPane');
    if (boundariesPane) {
      boundariesPane.style.zIndex = '350';
    }

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Tile Layer
    let consecutiveErrors = 0;
    const tileLayer = L.tileLayer(TILE_CONFIG.url, {
      attribution: TILE_CONFIG.attribution,
      maxZoom: TILE_CONFIG.maxZoom,
    });

    tileLayer.on('tileerror', () => {
      consecutiveErrors++;
      if (consecutiveErrors >= 4) {
        setTileError(true);
      }
    });

    tileLayer.on('tileload', () => {
      consecutiveErrors = 0;
      setTileError(false);
    });

    tileLayer.addTo(map);
    tileLayerRef.current = tileLayer;

    // Cluster Group
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 42,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
    });
    map.addLayer(clusterGroup);
    clusterGroupRef.current = clusterGroup;

    // Initial fit to Seoul
    map.fitBounds(seoulBounds, { padding: [16, 16] });
    mapInstanceRef.current = map;
    setIsMapReady(true);

    // Load GeoJSON asynchronously
    loadGeoJsonData(map);

    // ResizeObserver to handle container size changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Invalidate size when map tab becomes active or resized
  useEffect(() => {
    if (isMapTabActive && mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isMapTabActive]);

  // Load Seoul boundary GeoJSON with fallback
  const loadGeoJsonData = async (map: L.Map) => {
    const urls = [
      '/data/seoul-gu.geojson',
      'https://highmap.labbitory.com/data/seoul-gu.geojson',
    ];

    let geoJsonData: GeoJSON.FeatureCollection | null = null;

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) continue;
        const data = await res.json() as GeoJSON.FeatureCollection;
        if (
          data &&
          data.type === 'FeatureCollection' &&
          Array.isArray(data.features) &&
          data.features.filter((f) => f.properties?.kind === 'district').length === 25
        ) {
          geoJsonData = data;
          break;
        }
      } catch (err) {
        console.warn(`GeoJSON load failed from ${url}:`, err);
      }
    }

    if (!geoJsonData || !mapInstanceRef.current) {
      setHasGeoJsonError(true);
      return;
    }

    try {
      // 1. District features (kind === 'district')
      const districtFeatures = geoJsonData.features.filter(
        (f) => f.properties?.kind === 'district'
      );

      const districtLayer = L.geoJSON(
        { type: 'FeatureCollection', features: districtFeatures } as GeoJSON.FeatureCollection,
        {
          pane: 'boundariesPane',
          style: {
            color: '#64748b',
            weight: 1.2,
            opacity: 0.8,
            fillColor: '#3b82f6',
            fillOpacity: 0.02,
          },
          onEachFeature: (feature, layer) => {
            const districtName = feature.properties?.name || '';
            if (districtName) {
              districtPolygonsRef.current.set(districtName, layer as L.Polygon);

              // Center label for each district
              layer.bindTooltip(escapeHtml(districtName), {
                permanent: true,
                direction: 'center',
                className: 'district-boundary-label',
                interactive: false,
              });

              // Allow clicking district to filter
              layer.on('click', () => {
                if (onSelectDistrict) {
                  onSelectDistrict(districtName);
                }
              });

              layer.on('mouseover', () => {
                (layer as L.Path).setStyle({
                  weight: 2,
                  color: '#2563eb',
                  fillOpacity: 0.08,
                });
              });

              layer.on('mouseout', () => {
                (layer as L.Path).setStyle({
                  weight: 1.2,
                  color: '#64748b',
                  fillOpacity: 0.02,
                });
              });
            }
          },
        }
      );

      districtLayerRef.current = districtLayer;
      districtLayer.addTo(map);

      // 2. EduOffice features (kind === 'eduOffice')
      const eduFeatures = geoJsonData.features.filter(
        (f) => f.properties?.kind === 'eduOffice'
      );

      if (eduFeatures.length > 0) {
        const eduLayer = L.geoJSON(
          { type: 'FeatureCollection', features: eduFeatures } as GeoJSON.FeatureCollection,
          {
            pane: 'boundariesPane',
            style: {
              color: '#1d4ed8',
              weight: 2.8,
              opacity: 0.9,
              dashArray: '4, 4',
            },
          }
        );
        eduOfficeLayerRef.current = eduLayer;
        // EduOffice layer initial visibility off (controlled by state)
      }
    } catch (err) {
      console.error('Error parsing Seoul GeoJSON boundaries:', err);
      setHasGeoJsonError(true);
    }
  };

  // Toggle boundary visibility
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (districtLayerRef.current) {
      if (showDistricts && !map.hasLayer(districtLayerRef.current)) {
        map.addLayer(districtLayerRef.current);
      } else if (!showDistricts && map.hasLayer(districtLayerRef.current)) {
        map.removeLayer(districtLayerRef.current);
      }
    }

    if (eduOfficeLayerRef.current) {
      if (showEduOffices && !map.hasLayer(eduOfficeLayerRef.current)) {
        map.addLayer(eduOfficeLayerRef.current);
      } else if (!showEduOffices && map.hasLayer(eduOfficeLayerRef.current)) {
        map.removeLayer(eduOfficeLayerRef.current);
      }
    }
  }, [showDistricts, showEduOffices]);

  // Create custom DivIcon for a school
  const createSchoolIcon = useCallback((school: School, isSelected: boolean) => {
    const typeColor = TYPE_COLORS[school.schoolType] || TYPE_COLORS['기타'];
    const genderSymbol = getGenderSymbol(school.genderType);

    const foundationClass =
      school.foundationType === '사립'
        ? 'school-marker-private'
        : school.foundationType === '국립'
        ? 'school-marker-national'
        : 'school-marker-public';

    const selectedClass = isSelected ? 'school-marker-selected' : '';

    return L.divIcon({
      className: `custom-school-marker ${foundationClass} ${selectedClass}`,
      html: `<div class="school-marker-inner" style="background-color: ${typeColor}">${genderSymbol}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -14],
    });
  }, []);

  // Update Markers when schools list changes
  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    if (!clusterGroup) return;

    clusterGroup.clearLayers();
    markersMapRef.current.clear();

    const markersToAdd: L.Marker[] = [];

    schools.forEach((school) => {
      if (!school.hasLocation || school.latitude === null || school.longitude === null) {
        return; // Schools without coordinates are not drawn on map
      }

      const isSelected = school.schoolCode === selectedSchoolCode;
      const marker = L.marker([school.latitude, school.longitude], {
        icon: createSchoolIcon(school, isSelected),
        title: school.schoolName,
      });

      // Secure popup construction
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-1 min-w-[200px] text-slate-800';
      popupDiv.innerHTML = `
        <div class="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
          <span class="font-medium text-blue-700">${escapeHtml(school.schoolType)}</span>
          <span>·</span>
          <span>${escapeHtml(school.district)}</span>
          <span>·</span>
          <span>${escapeHtml(school.genderType)}</span>
        </div>
        <div class="font-bold text-sm text-slate-900 mb-1.5 leading-snug">${escapeHtml(school.schoolName)}</div>
        <div class="text-xs text-slate-600 mb-2 leading-relaxed">${escapeHtml(school.address || '주소 정보 없음')}</div>
        <div class="flex items-center justify-between border-t border-slate-100 pt-1.5 text-xs">
          <span class="text-slate-500">${escapeHtml(school.foundationType)}</span>
          <button id="btn-popup-${school.schoolCode}" class="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer">
            상세정보 보기 &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupDiv);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-popup-${school.schoolCode}`);
        if (btn) {
          btn.onclick = () => onSelectSchool(school);
        }
      });

      marker.on('click', () => {
        onSelectSchool(school);
      });

      markersMapRef.current.set(school.schoolCode, marker);
      markersToAdd.push(marker);
    });

    clusterGroup.addLayers(markersToAdd);
  }, [schools, onSelectSchool, createSchoolIcon]);

  // Synchronize Selected School from outside (e.g. list item click)
  useEffect(() => {
    if (!selectedSchoolCode) return;
    const marker = markersMapRef.current.get(selectedSchoolCode);
    const clusterGroup = clusterGroupRef.current;
    const map = mapInstanceRef.current;

    if (marker && clusterGroup && map) {
      clusterGroup.zoomToShowLayer(marker, () => {
        marker.openPopup();
        marker.setZIndexOffset(1000);
      });
    }
  }, [selectedSchoolCode]);

  // Zoom to District when district filter changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (selectedDistrict && selectedDistrict !== '전체') {
      const polygon = districtPolygonsRef.current.get(selectedDistrict);
      if (polygon) {
        map.fitBounds(polygon.getBounds(), { padding: [32, 32], maxZoom: 14 });
      } else {
        // Fallback: fit to schools within this district
        const districtSchools = schools.filter(
          (s) => s.district === selectedDistrict && s.hasLocation && s.latitude && s.longitude
        );
        if (districtSchools.length > 0) {
          const latLngs = districtSchools.map((s) => [s.latitude!, s.longitude!] as [number, number]);
          map.fitBounds(L.latLngBounds(latLngs), { padding: [32, 32], maxZoom: 14 });
        }
      }
    } else if (selectedDistrict === '전체') {
      // Reset to whole Seoul
      map.fitBounds([
        [37.413, 126.734],
        [37.715, 127.269],
      ], { padding: [20, 20] });
    }
  }, [selectedDistrict, schools]);

  // Handle tile reload
  const handleRetryTiles = () => {
    if (tileLayerRef.current) {
      tileLayerRef.current.redraw();
      setTileError(false);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[420px] overflow-hidden bg-slate-100 flex flex-col">
      {/* Map loading spinner */}
      {!isMapReady && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/80 backdrop-blur-xs">
          <div className="flex items-center gap-2.5 text-sm font-medium text-slate-700 bg-white px-4 py-2.5 rounded-lg shadow-sm border border-slate-200">
            <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            <span>지도를 준비하고 있습니다…</span>
          </div>
        </div>
      )}

      {/* Tile load error alert */}
      {tileError && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] max-w-md w-11/12 bg-amber-50 border border-amber-300 text-amber-900 px-3.5 py-2 rounded-lg shadow-md flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>배경지도를 불러오지 못했습니다. 인터넷 연결을 확인해 주세요.</span>
          </div>
          <button
            onClick={handleRetryTiles}
            className="ml-2 font-semibold text-amber-800 hover:text-amber-950 underline cursor-pointer shrink-0"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Layer Toggles & Map Controls Overlay */}
      <div className="absolute top-3 left-3 z-[900] flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-lg p-1.5 shadow-sm text-xs">
        <div className="flex items-center gap-1 text-slate-500 px-1 font-medium">
          <Layers className="w-3.5 h-3.5" />
          <span>경계:</span>
        </div>
        <button
          onClick={() => setShowDistricts(!showDistricts)}
          disabled={hasGeoJsonError}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
            showDistricts
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {showDistricts ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>구 경계</span>
        </button>
        <button
          onClick={() => setShowEduOffices(!showEduOffices)}
          disabled={hasGeoJsonError}
          className={`flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
            showEduOffices
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {showEduOffices ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          <span>교육지원청</span>
        </button>
        {hasGeoJsonError && (
          <span className="text-[11px] text-amber-600 pl-1">경계 데이터 없음</span>
        )}
      </div>

      {/* Map Legend Overlay (Bottom-left, avoiding OSM attribution at bottom-right) */}
      <div className="absolute bottom-6 left-3 z-[900] bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-lg p-2.5 shadow-sm max-w-xs text-xs">
        <div className="font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
          <span>마커 범례</span>
          <span className="text-[10px] text-slate-400 font-normal">유형별 색상</span>
        </div>
        <div className="grid grid-cols-3 gap-x-2 gap-y-1 mb-2 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS['일반고'] }}></span>
            <span className="text-slate-600">일반고</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS['자사고'] }}></span>
            <span className="text-slate-600">자사고</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS['특목고'] }}></span>
            <span className="text-slate-600">특목고</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS['영재고'] }}></span>
            <span className="text-slate-600">영재고</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS['특성화고'] }}></span>
            <span className="text-slate-600">특성화고</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS['기타'] }}></span>
            <span className="text-slate-600">기타</span>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-1.5 flex items-center justify-between text-[10px] text-slate-500">
          <span>표기: 남 / 여 / 공</span>
          <span>금색 테두리: 사립</span>
        </div>
      </div>

      {/* Actual Map Div Container */}
      <div ref={mapContainerRef} className="w-full h-full flex-1" style={{ height: '100%', minHeight: '360px' }} />
    </div>
  );
};
