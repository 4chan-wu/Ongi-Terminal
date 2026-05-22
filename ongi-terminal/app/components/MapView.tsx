"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Info, ArrowRight, Sparkles, Navigation, Layers, Compass, CheckCircle } from "lucide-react";

export interface Terminal {
  id: string;
  name: string;
  address: string;
  sharingCount: number;
  capacity: string;
  status: "smooth" | "busy" | "full";
  desc: string;
  lat: number; // For relative positioning
  lng: number; // For relative positioning
  color: string;
  pinBg: string;
}

interface MapViewProps {
  selectedTerminalId: string | null;
  setSelectedTerminalId: (id: string | null) => void;
  setCurrentTab: (tab: string) => void;
}

export default function MapView({
  selectedTerminalId,
  setSelectedTerminalId,
  setCurrentTab,
}: MapViewProps) {
  const terminals: Terminal[] = [
    {
      id: "1",
      name: "카페 앞 터미널 (1호기)",
      address: "서울시 온기구 햇살동 14-2 햇살카페 골목 입구",
      sharingCount: 5,
      capacity: "90%",
      status: "smooth",
      desc: "카페 고객분들과 이웃 주민분들이 가장 활발히 사용하는 감성 가득 터미널입니다.",
      lat: 25,
      lng: 75,
      color: "#FF8A3D",
      pinBg: "bg-brand-orange"
    },
    {
      id: "2",
      name: "주민센터 터미널 (2호기)",
      address: "서울시 온기구 햇살동 주민자치센터 정문 우측 자원 거점",
      sharingCount: 8,
      capacity: "40%",
      status: "busy",
      desc: "지자체에서 공식 관리하며 재활용 수거 용량이 가장 큰 메인 터미널입니다.",
      lat: 75,
      lng: 25,
      color: "#3BA36B",
      pinBg: "bg-brand-green"
    },
    {
      id: "3",
      name: "지하철역 터미널 (3호기)",
      address: "서울시 온기구 온기역 3번 출구 자전거 보관소 앞",
      sharingCount: 5,
      capacity: "75%",
      status: "smooth",
      desc: "출퇴근길 직장인분들과 등하교 학생분들이 오가며 빠르게 순환시키는 터미널입니다.",
      lat: 60,
      lng: 60,
      color: "#4F8FEB",
      pinBg: "bg-brand-blue"
    }
  ];

  const [activeTerminal, setActiveTerminal] = useState<Terminal>(terminals[0]);
  const [showAiPath, setShowAiPath] = useState(false);

  useEffect(() => {
    if (selectedTerminalId) {
      const found = terminals.find(t => t.id === selectedTerminalId);
      if (found) {
        setActiveTerminal(found);
      }
    }
  }, [selectedTerminalId]);

  const handleSelectTerminal = (t: Terminal) => {
    setActiveTerminal(t);
    setSelectedTerminalId(t.id);
  };

  const handleToggleAiPath = () => {
    setShowAiPath(!showAiPath);
    if (!showAiPath) {
      alert("🤖 AI가 최적의 자원 순환 동선을 분석했습니다:\n\n'카페 앞 터미널'에서 나눔을 수령하신 후, 도보 3분 거리의 '주민센터 터미널'에 들러 페트병을 배출하시는 동선이 가장 효율적입니다!");
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 md:px-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold text-brand-dark md:text-4xl">
            주변 온기 터미널 확인하기
          </h2>
          <p className="max-w-xl text-brand-gray font-medium">
            동네 곳곳 유휴 공간에 설치된 따뜻한 자원 순환 정거장의 위치와 실시간 보관함 및 수거 현황을 확인하세요.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleToggleAiPath}
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

      <div className="grid gap-8 lg:grid-cols-12 items-stretch">
        
        <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
          <div className="space-y-3">
            <span className="text-xs font-extrabold text-brand-gray uppercase pl-1">터미널 리스트</span>
            {terminals.map((t) => (
              <div
                key={t.id}
                onClick={() => handleSelectTerminal(t)}
                className={`flex items-start gap-4 rounded-2xl border p-4 transition-all duration-300 cursor-pointer ${
                  activeTerminal.id === t.id
                    ? "bg-white border-brand-orange shadow-lg shadow-brand-orange/5"
                    : "bg-white border-zinc-100 hover:border-brand-orange-light"
                }`}
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white font-extrabold shadow-sm ${t.pinBg}`}>
                  {t.id}
                </div>
                
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-brand-dark truncate">{t.name}</h4>
                    {t.status === "smooth" ? (
                      <span className="shrink-0 inline-flex items-center rounded-full bg-brand-green-light px-2 py-0.5 text-[10px] font-bold text-brand-green">
                        여유
                      </span>
                    ) : (
                      <span className="shrink-0 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                        포화
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-brand-gray truncate font-medium">{t.address}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl bg-white border border-brand-orange-light p-6 shadow-xl shadow-brand-orange/5 space-y-5">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white font-extrabold ${activeTerminal.pinBg}`}>
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-brand-dark">{activeTerminal.name}</h3>
                <span className="text-xs font-semibold text-brand-gray">실시간 상태 및 가이드</span>
              </div>
            </div>

            <p className="text-sm font-medium leading-relaxed text-brand-gray">
              {activeTerminal.desc}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-2xl bg-brand-orange-light/10 border border-brand-orange-light/40 p-4">
                <span className="text-xs font-extrabold text-brand-gray">보관 중인 나눔</span>
                <p className="text-lg font-black text-brand-orange mt-1">{activeTerminal.sharingCount}개 대기</p>
              </div>
              <div className="rounded-2xl bg-brand-green-light/10 border border-brand-green-light/40 p-4">
                <span className="text-xs font-extrabold text-brand-gray">수거 칸 여유</span>
                <p className="text-lg font-black text-brand-green mt-1">{activeTerminal.capacity} 여유</p>
              </div>
            </div>

            <button
              onClick={() => setCurrentTab("sharing")}
              className="w-full h-12 rounded-xl bg-brand-dark text-white font-bold hover:bg-brand-gray transition-all flex items-center justify-center gap-2"
            >
              이 터미널의 나눔 보러 가기
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col justify-center min-h-[460px]">
          <div className="relative h-full w-full rounded-3xl bg-brand-green-light border-2 border-brand-orange-light overflow-hidden shadow-xl shadow-brand-orange/5 min-h-[500px]">
            
            <div className="absolute inset-0 bg-[#E8F8EE] opacity-70"></div>
            
            <div className="absolute top-1/4 left-0 w-full h-16 bg-white border-y border-brand-green-light transform -rotate-6"></div>
            <div className="absolute top-0 left-1/4 w-20 h-full bg-white border-x border-brand-green-light transform rotate-30"></div>
            <div className="absolute top-1/2 left-2/3 w-16 h-full bg-white border-x border-brand-green-light transform -rotate-45"></div>
            <div className="absolute bottom-1/4 left-0 w-full h-12 bg-white border-y border-brand-green-light transform rotate-12"></div>
            
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-[#CCEED6] filter blur-xl opacity-80"></div>
            <div className="absolute bottom-10 right-10 w-44 h-44 rounded-full bg-[#CCEED6] filter blur-2xl opacity-60"></div>

            {showAiPath && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none select-none z-10">
                <path
                  d="M 330 140 C 290 190, 160 260, 120 370"
                  fill="none"
                  stroke="#FF8A3D"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray="10, 15"
                  className="animate-pulse"
                />
                <circle cx="330" cy="140" r="10" fill="#FF8A3D" opacity="0.3" className="animate-ping" />
                <circle cx="120" cy="370" r="10" fill="#3BA36B" opacity="0.3" className="animate-ping" />
              </svg>
            )}

            <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-sm border border-brand-orange-light p-3 rounded-2xl flex items-center gap-2 shadow-sm z-20">
              <Compass className="h-5 w-5 text-brand-orange animate-spin-slow" />
              <span className="text-xs font-black text-brand-dark tracking-wider">MAP VIEW</span>
            </div>

            {terminals.map((t) => {
              const isActive = activeTerminal.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTerminal(t)}
                  style={{ top: `${t.lat}%`, left: `${t.lng}%` }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 cursor-pointer z-20 transition-all duration-300 ${
                    isActive ? "scale-110" : "hover:scale-105"
                  }`}
                >
                  {isActive && (
                    <div
                      className="absolute -top-1 -left-1 h-12 w-12 rounded-full animate-ping opacity-25"
                      style={{ backgroundColor: t.color }}
                    ></div>
                  )}
                  
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-extrabold shadow-lg transition-transform ${
                      isActive ? "ring-4 ring-white shadow-xl" : ""
                    }`}
                    style={{ backgroundColor: t.color }}
                  >
                    {t.id}
                  </div>

                  <div
                    className={`rounded-xl border bg-white px-3 py-1.5 shadow-md flex items-center gap-1.5 transition-all ${
                      isActive
                        ? "border-brand-orange translate-x-1"
                        : "border-zinc-200 opacity-90 group-hover:opacity-100"
                    }`}
                  >
                    <span className="text-xs font-black text-brand-dark whitespace-nowrap">
                      {t.name.split(" ")[0]}
                    </span>
                    {isActive && <CheckCircle className="h-3.5 w-3.5 text-brand-orange" />}
                  </div>
                </div>
              );
            })}

            <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-20">
              <div className="bg-brand-dark/80 backdrop-blur-sm text-white px-4 py-2 rounded-2xl text-xs font-bold shadow flex items-center gap-1.5">
                <Navigation className="h-4 w-4 text-brand-orange" />
                <span>나의 위치: 햇살동 사거리</span>
              </div>
            </div>
            
            {showAiPath && (
              <div className="absolute top-6 right-6 bg-brand-orange text-white px-4 py-3 rounded-2xl text-xs font-bold shadow-lg animate-fade-in flex flex-col gap-1 z-20">
                <span className="font-extrabold flex items-center gap-1">
                  <Sparkles className="h-4 w-4" />
                  추천 순환 동선
                </span>
                <span className="font-semibold text-[10px] opacity-90">1호기 수령 ➔ 2호기 페트병 적립 (도보 3분)</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}
