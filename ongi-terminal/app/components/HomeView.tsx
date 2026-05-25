"use client";

import React from "react";
import { ArrowRight, MapPin, Heart, Recycle, Coins } from "lucide-react";

interface HomeViewProps {
  setCurrentTab: (tab: string) => void;
  userPoints: number;
  sharingCount: number;
  setSelectedTerminalId: (id: string | null) => void;
  onOpenRegister: () => void;
}

export default function HomeView({
  setCurrentTab,
  userPoints,
  sharingCount,
  setSelectedTerminalId,
  onOpenRegister,
}: HomeViewProps) {
  
  const handlePinClick = (terminalId: string) => {
    setSelectedTerminalId(terminalId);
    setCurrentTab("map");
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 md:px-12 md:py-20 animate-fade-in">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8 items-center">
        <div className="space-y-10 lg:col-span-7">
          <div className="space-y-6">
            <h1 className="text-4xl font-extrabold leading-[1.2] tracking-tight text-brand-dark sm:text-5xl md:text-6xl">
              동네의 <span className="text-brand-orange">온기</span>로<br />
              자원을 다시 달리게.
            </h1>
            <p className="max-w-2xl text-lg md:text-xl font-medium leading-relaxed text-brand-gray">
              유휴 공간에 설치된 무인 캐비닛에서 이웃과 물건을 무료로 나누고,<br className="hidden sm:inline" />
              재활용품은 온기 포인트로 교환하여 가치 있는 자원 순환을 시작하세요.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setCurrentTab("map")}
              className="group flex h-14 items-center justify-center gap-2 rounded-full bg-brand-orange px-8 text-lg font-bold text-white shadow-lg shadow-brand-orange/20 hover:bg-brand-orange-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
            >
              터미널 찾기
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            <button
              onClick={onOpenRegister}
              className="flex h-14 items-center justify-center rounded-full border-2 border-brand-orange bg-white px-8 text-lg font-bold text-brand-orange hover:bg-brand-orange-light/20 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 cursor-pointer"
            >
              나눔 등록하기
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-lg">
            <div 
              onClick={() => setCurrentTab("sharing")}
              className="flex flex-col justify-between rounded-2xl bg-white border border-brand-orange-light p-6 hover:shadow-lg hover:shadow-brand-orange/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-orange-light text-brand-orange">
                <Heart className="h-5 w-5 fill-brand-orange" />
              </div>
              <div className="mt-4">
                <span className="text-sm font-semibold text-brand-gray">나눔 대기</span>
                <p className="text-xl sm:text-2xl font-extrabold text-brand-dark mt-1">{sharingCount}개</p>
              </div>
            </div>

            <div 
              onClick={() => setCurrentTab("recycling")}
              className="flex flex-col justify-between rounded-2xl bg-white border border-brand-orange-light p-6 hover:shadow-lg hover:shadow-brand-orange/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green-light text-brand-green">
                <Recycle className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <span className="text-sm font-semibold text-brand-gray">수거 여유</span>
                <p className="text-xl sm:text-2xl font-extrabold text-brand-green mt-1">80%</p>
              </div>
            </div>

            <div 
              onClick={() => setCurrentTab("mypage")}
              className="flex flex-col justify-between rounded-2xl bg-white border border-brand-orange-light p-6 hover:shadow-lg hover:shadow-brand-orange/5 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-500">
                <Coins className="h-5 w-5" />
              </div>
              <div className="mt-4">
                <span className="text-sm font-semibold text-brand-gray">내 포인트</span>
                <p className="text-xl sm:text-2xl font-extrabold text-brand-orange mt-1">
                  {(userPoints ?? 0).toLocaleString()}P
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex justify-center">
          <div className="relative h-[440px] w-full max-w-[460px] rounded-3xl bg-brand-green-light border-2 border-brand-orange-light overflow-hidden shadow-xl shadow-brand-orange/5">
            <div className="absolute inset-0 bg-[#E0F8E8] opacity-60"></div>
            
            <div className="absolute top-1/4 left-0 w-full h-12 bg-white border-y border-brand-green-light transform -rotate-12"></div>
            <div className="absolute top-0 left-1/3 w-16 h-full bg-white border-x border-brand-green-light transform rotate-45"></div>
            <div className="absolute top-1/3 left-1/2 w-12 h-full bg-white border-x border-brand-green-light transform -rotate-45"></div>

            <div className="absolute bottom-6 right-6 opacity-30 select-none pointer-events-none">
              <span className="text-3xl font-black text-brand-green tracking-wider uppercase">Ongi Map</span>
            </div>
            <div className="absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg">
                <div className="h-7 w-7 rounded-full bg-brand-orange animate-ping absolute opacity-30"></div>
                <div className="h-7 w-7 rounded-full bg-brand-orange flex items-center justify-center text-white text-xs font-black">
                  MY
                </div>
              </div>
            </div>

            <div 
              onClick={() => handlePinClick("1")}
              className="absolute top-1/4 right-1/4 transform -translate-y-1/2 flex items-center gap-2 cursor-pointer group hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange text-white font-extrabold shadow-md shadow-brand-orange/20 relative">
                1
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-orange opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-orange"></span>
                </span>
              </div>
              <div className="rounded-xl border border-brand-orange-light bg-white px-3 py-1.5 shadow-sm group-hover:shadow-md transition-all duration-300">
                <span className="text-xs font-bold text-brand-dark">카페 앞 터미널</span>
              </div>
            </div>

            <div 
              onClick={() => handlePinClick("2")}
              className="absolute bottom-1/4 left-1/4 flex items-center gap-2 cursor-pointer group hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green text-white font-extrabold shadow-md shadow-brand-green/20">
                2
              </div>
              <div className="rounded-xl border border-brand-green-light bg-white px-3 py-1.5 shadow-sm group-hover:shadow-md transition-all duration-300">
                <span className="text-xs font-bold text-brand-dark">주민센터 터미널</span>
              </div>
            </div>

            <div 
              onClick={() => handlePinClick("3")}
              className="absolute bottom-1/3 right-1/3 flex items-center gap-2 cursor-pointer group hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-blue text-white font-extrabold shadow-md shadow-brand-blue/20">
                3
              </div>
              <div className="rounded-xl border border-blue-200 bg-white px-3 py-1.5 shadow-sm group-hover:shadow-md transition-all duration-300">
                <span className="text-xs font-bold text-brand-dark">지하철역 터미널</span>
              </div>
            </div>

            <div className="absolute top-4 left-4 bg-brand-dark/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold shadow">
              번호를 누르면 상세 지도로 연결됩니다
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
