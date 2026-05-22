"use client";

import React from "react";
import { User, LogOut, Heart, Recycle, MapPin } from "lucide-react";

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isLoggedIn: boolean;
  userName: string;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export default function Navbar({
  currentTab,
  setCurrentTab,
  isLoggedIn,
  userName,
  onLogout,
  onOpenLogin,
}: NavbarProps) {
  const tabs = [
    { id: "sharing", label: "나눔", icon: Heart },
    { id: "recycling", label: "재활용", icon: Recycle },
    { id: "map", label: "지도", icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-orange-light bg-brand-ivory/80 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-[86px] max-w-7xl items-center justify-between px-6 md:px-12">
        {/* Logo and App Name */}
        <div
          className="flex cursor-pointer items-center gap-3 active:scale-95 transition-transform"
          onClick={() => setCurrentTab("home")}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange-light text-brand-orange font-bold text-lg shadow-sm shadow-brand-orange/10">
            로고
          </div>
          <span className="text-xl font-bold tracking-tight text-brand-dark sm:text-2xl">
            온기 터미널
          </span>
        </div>

        <nav className="hidden items-center gap-1 sm:flex md:gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentTab(tab.id)}
                className={`group flex items-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-brand-orange text-white shadow-md shadow-brand-orange/20"
                    : "text-brand-gray hover:bg-brand-orange-light/30 hover:text-brand-orange"
                }`}
              >
                <Icon
                  className={`h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? "animate-pulse" : ""
                  }`}
                />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentTab("mypage")}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-base font-semibold border border-brand-orange-light transition-all duration-300 ${
                  currentTab === "mypage"
                    ? "bg-brand-orange text-white shadow-md shadow-brand-orange/20 border-transparent"
                    : "bg-white text-brand-orange hover:bg-brand-orange-light/20"
                }`}
              >
                <User className="h-4 w-4" />
                <span className="hidden md:inline">{userName} 님</span>
                <span className="md:hidden">마이페이지</span>
              </button>
              <button
                onClick={onLogout}
                title="로그아웃"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-brand-gray hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all duration-300"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center justify-center rounded-full bg-brand-orange px-6 py-2.5 text-base font-semibold text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orange-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
            >
              시작하기
            </button>
          )}
        </div>
      </div>

      <div className="flex border-t border-brand-orange-light/50 bg-white sm:hidden justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 text-xs font-semibold rounded-lg transition-all ${
                isActive ? "text-brand-orange" : "text-brand-gray"
              }`}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
