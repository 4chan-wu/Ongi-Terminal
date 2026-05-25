"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  Compass,
  MapPin,
  Navigation,
  Sparkles,
} from "lucide-react";

interface KakaoLatLng {
  getLat: () => number;
  getLng: () => number;
}

interface KakaoMap {
  setCenter: (latLng: KakaoLatLng) => void;
  panTo: (latLng: KakaoLatLng) => void;
  setBounds: (bounds: KakaoLatLngBounds) => void;
}

interface KakaoMarker {
  setMap: (map: KakaoMap | null) => void;
  setPosition: (latLng: KakaoLatLng) => void;
}

interface KakaoInfoWindow {
  open: (map: KakaoMap, marker: KakaoMarker) => void;
  close: () => void;
}

interface KakaoPolyline {
  setMap: (map: KakaoMap | null) => void;
}

interface KakaoLatLngBounds {
  extend: (latLng: KakaoLatLng) => void;
  isEmpty: () => boolean;
}

interface KakaoGeocoderResult {
  x: string;
  y: string;
}

interface KakaoMapsNamespace {
  load: (callback: () => void) => void;
  Map: new (container: HTMLElement, options: Record<string, unknown>) => KakaoMap;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  LatLngBounds: new () => KakaoLatLngBounds;
  Marker: new (options: Record<string, unknown>) => KakaoMarker;
  InfoWindow: new (options: Record<string, unknown>) => KakaoInfoWindow;
  Polyline: new (options: Record<string, unknown>) => KakaoPolyline;
  MarkerImage: new (
    src: string,
    size: { width: number; height: number },
    options?: Record<string, unknown>,
  ) => unknown;
  Size: new (width: number, height: number) => { width: number; height: number };
  Point: new (x: number, y: number) => { x: number; y: number };
  event: {
    addListener: (target: KakaoMarker, eventName: string, handler: () => void) => void;
  };
  services: {
    Geocoder: new () => {
      addressSearch: (
        address: string,
        callback: (
          result: KakaoGeocoderResult[],
          status: string,
        ) => void,
      ) => void;
    };
    Status: {
      OK: string;
    };
  };
}

declare global {
  interface Window {
    kakao?: {
      maps?: KakaoMapsNamespace;
    };
  }
}

const DEFAULT_CENTER = {
  lat: 37.642662,
  lng: 127.106488,
};

const KAKAO_SCRIPT_ID = "kakao-maps-sdk";

export interface Terminal {
  id: string;
  name: string;
  address: string;
  sharingCount: number;
  capacity: string;
  status: "smooth" | "busy" | "full";
  desc: string;
  lat: number;
  lng: number;
  color: string;
  pinBg: string;
}

interface MapViewProps {
  selectedTerminalId: string | null;
  setSelectedTerminalId: (id: string | null) => void;
  setCurrentTab: (tab: string) => void;
}

interface TerminalApiItem {
  id: number;
  name: string;
  address: string;
  latitude: number | string | null;
  longitude: number | string | null;
  status: string;
}

const markerThemes = [
  { color: "#FF8A3D", pinBg: "bg-brand-orange" },
  { color: "#3BA36B", pinBg: "bg-brand-green" },
  { color: "#4F8FEB", pinBg: "bg-brand-blue" },
];

function getTerminalVisual(index: number) {
  return markerThemes[index % markerThemes.length];
}

function loadKakaoMaps(appKey: string) {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("window is unavailable"));
      return;
    }

    if (window.kakao?.maps) {
      window.kakao.maps.load(() => resolve());
      return;
    }

    const existingScript = document.getElementById(
      KAKAO_SCRIPT_ID,
    ) as HTMLScriptElement | null;

    if (existingScript) {
      existingScript.addEventListener("load", () => {
        window.kakao?.maps?.load(() => resolve());
      }, { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Kakao Maps SDK load failed")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = KAKAO_SCRIPT_ID;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=services`;
    script.async = true;
    script.onload = () => {
      if (!window.kakao?.maps) {
        reject(new Error("Kakao Maps namespace missing"));
        return;
      }
      window.kakao.maps.load(() => resolve());
    };
    script.onerror = () => reject(new Error("Kakao Maps SDK load failed"));
    document.head.appendChild(script);
  });
}

function buildMarkerImage(
  maps: KakaoMapsNamespace,
  color: string,
  isActive: boolean,
) {
  const size = isActive ? 34 : 28;
  const svg = encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 4}" fill="${color}" stroke="white" stroke-width="4" />
    </svg>
  `);
  return new maps.MarkerImage(
    `data:image/svg+xml;charset=UTF-8,${svg}`,
    new maps.Size(size, size),
    {
      offset: new maps.Point(size / 2, size / 2),
    },
  );
}

export default function MapView({
  selectedTerminalId,
  setSelectedTerminalId,
  setCurrentTab,
}: MapViewProps) {
  const appKey = process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? "";
  const [terminals, setTerminals] = useState<Terminal[]>([]);
  const [showAiPath, setShowAiPath] = useState(false);
  const [mapError, setMapError] = useState<string | null>(
    appKey ? null : "NEXT_PUBLIC_KAKAO_MAP_APP_KEY 환경변수가 필요합니다.",
  );
  const [isMapReady, setIsMapReady] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<KakaoMap | null>(null);
  const markersRef = useRef<Record<string, KakaoMarker>>({});
  const infoWindowsRef = useRef<Record<string, KakaoInfoWindow>>({});
  const pathRef = useRef<KakaoPolyline | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/terminals")
      .then((res) => res.json())
      .then((data: TerminalApiItem[]) => {
        const mapped = data.map((terminal, index) => {
          const visual = getTerminalVisual(index);
          return {
            id: String(terminal.id),
            name: terminal.name,
            address: terminal.address,
            sharingCount: 0,
            capacity: "여유",
            status: "smooth" as const,
            desc: terminal.address,
            lat: Number(terminal.latitude ?? 0),
            lng: Number(terminal.longitude ?? 0),
            color: visual.color,
            pinBg: visual.pinBg,
          };
        });

        setTerminals(mapped);
        if (!selectedTerminalId && mapped.length > 0) {
          setSelectedTerminalId(mapped[0].id);
        }
      })
      .catch(() => {
        setMapError("터미널 정보를 불러오지 못했습니다.");
      });
  }, [selectedTerminalId, setSelectedTerminalId]);

  const activeTerminal =
    terminals.find((terminal) => terminal.id === selectedTerminalId) ??
    terminals[0] ??
    null;

  useEffect(() => {
    if (!appKey) {
      return;
    }

    let cancelled = false;

    const initializeMap = async () => {
      try {
        await loadKakaoMaps(appKey);
        if (cancelled || !mapContainerRef.current || !window.kakao?.maps) {
          return;
        }

        const maps = window.kakao.maps;
        mapRef.current = new maps.Map(mapContainerRef.current, {
          center: new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
          level: 4,
        });
        setIsMapReady(true);
      } catch {
        if (!cancelled) {
          setMapError("카카오맵을 불러오지 못했습니다.");
        }
      }
    };

    initializeMap();

    return () => {
      cancelled = true;
    };
  }, [appKey]);

  useEffect(() => {
    if (!isMapReady || !mapRef.current || terminals.length === 0 || !window.kakao?.maps) {
      return;
    }

    let cancelled = false;
    const maps = window.kakao.maps;
    const mapInstance = mapRef.current;
    const geocoder = new maps.services.Geocoder();

    const geocodeAddress = (address: string) =>
      new Promise<{ lat: number; lng: number } | null>((resolve) => {
        geocoder.addressSearch(address, (result, status) => {
          if (status !== maps.services.Status.OK || result.length === 0) {
            resolve(null);
            return;
          }

          resolve({
            lat: Number(result[0].y),
            lng: Number(result[0].x),
          });
        });
      });

    const syncMarkers = async () => {
      const resolvedTerminals = await Promise.all(
        terminals.map(async (terminal) => {
          if (terminal.lat && terminal.lng) {
            return terminal;
          }

          const geocoded = await geocodeAddress(terminal.address);
          if (!geocoded) {
            return {
              ...terminal,
              lat: DEFAULT_CENTER.lat,
              lng: DEFAULT_CENTER.lng,
            };
          }

          return {
            ...terminal,
            lat: geocoded.lat,
            lng: geocoded.lng,
          };
        }),
      );

      if (cancelled) {
        return;
      }

      setTerminals((prev) => {
        let changed = false;
        const next = prev.map((terminal) => {
          const found = resolvedTerminals.find((item) => item.id === terminal.id);
          if (!found) return terminal;
          if (found.lat !== terminal.lat || found.lng !== terminal.lng) {
            changed = true;
            return found;
          }
          return terminal;
        });
        return changed ? next : prev;
      });

      const bounds = new maps.LatLngBounds();

      resolvedTerminals.forEach((terminal) => {
        const position = new maps.LatLng(terminal.lat, terminal.lng);
        bounds.extend(position);

        let marker = markersRef.current[terminal.id];
        if (!marker) {
          marker = new maps.Marker({
            position,
            map: mapInstance,
            title: terminal.name,
            image: buildMarkerImage(
              maps,
              terminal.color,
              activeTerminal?.id === terminal.id,
            ),
          });
          markersRef.current[terminal.id] = marker;

          const infoWindow = new maps.InfoWindow({
            content: `
              <div style="padding:12px 14px; min-width:180px;">
                <strong style="display:block; font-size:14px; color:#1f2937;">${terminal.name}</strong>
                <span style="display:block; margin-top:6px; font-size:12px; color:#6b7280;">${terminal.address}</span>
              </div>
            `,
          });
          infoWindowsRef.current[terminal.id] = infoWindow;

          maps.event.addListener(marker, "click", () => {
            setSelectedTerminalId(terminal.id);
          });
        } else {
          marker.setPosition(position);
          marker.setMap(mapInstance);
        }
      });

      if (!bounds.isEmpty()) {
        mapInstance.setBounds(bounds);
      } else {
        mapInstance.setCenter(
          new maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng),
        );
      }
    };

    syncMarkers();

    return () => {
      cancelled = true;
    };
  }, [activeTerminal?.id, isMapReady, setSelectedTerminalId, terminals]);

  useEffect(() => {
    if (!mapRef.current || !activeTerminal || !window.kakao?.maps) {
      return;
    }

    const maps = window.kakao.maps;
    const mapInstance = mapRef.current;
    const position = new maps.LatLng(
      activeTerminal.lat || DEFAULT_CENTER.lat,
      activeTerminal.lng || DEFAULT_CENTER.lng,
    );

    mapInstance.panTo(position);

    terminals.forEach((terminal) => {
      const marker = markersRef.current[terminal.id];
      if (!marker) return;
      marker.setPosition(new maps.LatLng(terminal.lat, terminal.lng));
      marker.setMap(mapInstance);
    });

    Object.values(infoWindowsRef.current).forEach((infoWindow) => {
      infoWindow.close();
    });

    const selectedInfoWindow = infoWindowsRef.current[activeTerminal.id];
    const selectedMarker = markersRef.current[activeTerminal.id];
    if (selectedInfoWindow && selectedMarker) {
      selectedInfoWindow.open(mapInstance, selectedMarker);
    }
  }, [activeTerminal, terminals]);

  useEffect(() => {
    if (!mapRef.current || !window.kakao?.maps) {
      return;
    }

    const maps = window.kakao.maps;
    const mapInstance = mapRef.current;

    if (pathRef.current) {
      pathRef.current.setMap(null);
      pathRef.current = null;
    }

    if (!showAiPath) {
      return;
    }

    const validTerminals = terminals.filter((terminal) => terminal.lat && terminal.lng);
    if (validTerminals.length < 2) {
      return;
    }

    pathRef.current = new maps.Polyline({
      map: mapInstance,
      path: [
        new maps.LatLng(validTerminals[0].lat, validTerminals[0].lng),
        new maps.LatLng(validTerminals[1].lat, validTerminals[1].lng),
      ],
      strokeWeight: 5,
      strokeColor: "#FF8A3D",
      strokeOpacity: 0.9,
      strokeStyle: "solid",
    });
  }, [showAiPath, terminals]);

  const handleSelectTerminal = (terminal: Terminal) => {
    setSelectedTerminalId(terminal.id);
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 md:px-12 animate-fade-in">
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold text-brand-dark md:text-4xl">
            주변 온기 터미널 확인하기
          </h2>
          <p className="max-w-xl text-brand-gray font-medium">
            동네 곳곳 유휴 공간에 설치된 따뜻한 자원 순환 정거장의 위치와 실시간
            보관함 및 수거 현황을 확인하세요.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowAiPath((prev) => !prev)}
            className={`flex h-12 items-center justify-center gap-2 rounded-full px-5 font-bold transition-all duration-300 ${
              showAiPath
                ? "bg-brand-orange text-white shadow-md shadow-brand-orange/20"
                : "bg-white border border-brand-orange-light text-brand-orange hover:bg-brand-orange-light/10"
            }`}
          >
            <Sparkles className="h-4.5 w-4.5" />
            AI 추천 최적동선 {showAiPath ? "켜짐" : "끄기"}
          </button>
        </div>
      </div>

      <div className="grid items-stretch gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <span className="pl-1 text-xs font-extrabold uppercase text-brand-gray">
              터미널 리스트
            </span>
            {terminals.map((terminal) => (
              <div
                key={terminal.id}
                onClick={() => handleSelectTerminal(terminal)}
                className={`cursor-pointer rounded-2xl border p-4 transition-all duration-300 ${
                  activeTerminal?.id === terminal.id
                    ? "border-brand-orange bg-white shadow-lg shadow-brand-orange/5"
                    : "border-zinc-100 bg-white hover:border-brand-orange-light"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-extrabold shadow-sm ${terminal.pinBg}`}
                  >
                    {terminal.id}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="truncate font-bold text-brand-dark">
                        {terminal.name}
                      </h4>
                      <span className="shrink-0 inline-flex items-center rounded-full bg-brand-green-light px-2 py-0.5 text-[10px] font-bold text-brand-green">
                        여유
                      </span>
                    </div>
                    <p className="truncate text-xs font-medium text-brand-gray">
                      {terminal.address}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-5 rounded-3xl border border-brand-orange-light bg-white p-6 shadow-xl shadow-brand-orange/5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl text-white font-extrabold ${activeTerminal?.pinBg ?? "bg-brand-orange"}`}
              >
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-brand-dark">
                  {activeTerminal?.name ?? "터미널 선택"}
                </h3>
                <span className="text-xs font-semibold text-brand-gray">
                  실시간 상태 및 가이드
                </span>
              </div>
            </div>

            <p className="text-sm font-medium leading-relaxed text-brand-gray">
              {activeTerminal?.desc ??
                "지도 또는 리스트에서 터미널을 선택하면 상세 안내를 볼 수 있습니다."}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl border border-brand-orange-light/40 bg-brand-orange-light/10 p-4">
                <span className="text-xs font-extrabold text-brand-gray">
                  보관 중인 나눔
                </span>
                <p className="mt-1 text-lg font-black text-brand-orange">
                  {activeTerminal?.sharingCount ?? 0}개 대기
                </p>
              </div>
              <div className="rounded-2xl border border-brand-green-light/40 bg-brand-green-light/10 p-4">
                <span className="text-xs font-extrabold text-brand-gray">
                  수거 칸 여유
                </span>
                <p className="mt-1 text-lg font-black text-brand-green">
                  {activeTerminal?.capacity ?? "여유"} 여유
                </p>
              </div>
            </div>

            <button
              onClick={() => setCurrentTab("sharing")}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-dark font-bold text-white transition-all hover:bg-brand-gray"
            >
              이 터미널의 나눔 보러 가기
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 flex min-h-[460px] flex-col justify-center">
          <div className="relative min-h-[500px] w-full overflow-hidden rounded-3xl border-2 border-brand-orange-light bg-brand-green-light shadow-xl shadow-brand-orange/5">
            <div
              ref={mapContainerRef}
              className="absolute inset-0 h-full w-full"
            />

            {showAiPath && (
              <div className="absolute right-6 top-6 z-20 flex flex-col gap-1 rounded-2xl bg-brand-orange px-4 py-3 text-xs font-bold text-white shadow-lg animate-fade-in">
                <span className="flex items-center gap-1 font-extrabold">
                  <Sparkles className="h-4 w-4" />
                  추천 순환 동선
                </span>
                <span className="text-[10px] font-semibold opacity-90">
                  첫 번째 터미널에서 두 번째 터미널까지 연결해 보여줍니다.
                </span>
              </div>
            )}

            {mapError && (
              <div className="absolute inset-6 z-30 flex items-center justify-center rounded-3xl border border-red-200 bg-white/95 p-6 text-center shadow-lg">
                <div className="space-y-2">
                  <p className="text-sm font-bold text-red-500">{mapError}</p>
                  <p className="text-xs font-medium text-brand-gray">
                    API 키 또는 Kakao Maps 스크립트 로딩 상태를 확인해 주세요.
                  </p>
                </div>
              </div>
            )}

            {!mapError && !isMapReady && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/55 backdrop-blur-sm">
                <div className="space-y-2 text-center">
                  <p className="text-sm font-bold text-brand-dark">
                    카카오맵을 불러오는 중입니다.
                  </p>
                  <p className="text-xs font-medium text-brand-gray">
                    잠시만 기다려 주세요.
                  </p>
                </div>
              </div>
            )}

            {activeTerminal && !mapError && (
              <div className="absolute bottom-6 right-6 z-20 flex items-center gap-2 rounded-2xl border border-brand-orange-light bg-white/90 px-4 py-3 shadow-md backdrop-blur-sm">
                <CheckCircle className="h-4.5 w-4.5 text-brand-orange" />
                <div className="space-y-0.5">
                  <p className="text-xs font-black text-brand-dark">
                    {activeTerminal.name}
                  </p>
                  <p className="text-[10px] font-medium text-brand-gray">
                    지도 중심이 선택된 터미널로 이동합니다.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
