"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Coins,
  Calendar,
  ChevronDown,
  ChevronUp,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Gift,
  X,
  Trash2,
} from "lucide-react";
import { SharingItem } from "./SharingView";

interface MyPageViewProps {
  userProfile: {
    name: string;
    id: string;
    email: string;
    phone: string;
    interest: string;
  };
  userPoints: number;
  reservedItems: SharingItem[];
  registeredItems: SharingItem[];
  onCancelReservation: (itemId: string) => void;
  onLogout: () => void;
  onUsePoints: (points: number) => void;
  onDeleteItem: (itemId: string) => void;
}

export default function MyPageView({
  userProfile,
  userPoints,
  reservedItems,
  registeredItems,
  onCancelReservation,
  onLogout,
  onUsePoints,
  onDeleteItem,
}: MyPageViewProps) {
  const [recyclingHistory, setRecyclingHistory] = useState<
    { id: string; date: string; item: string; points: number }[]
  >([]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch("http://localhost:8000/points/history", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map(
          (p: {
            id: number;
            reason: string;
            amount: number;
            created_at: string;
          }) => ({
            id: String(p.id),
            date: p.created_at.split("T")[0],
            item: p.reason,
            points: p.amount,
          }),
        );
        setRecyclingHistory(mapped);
      })
      .catch(() => console.error("포인트 내역 불러오기 실패"));
  }, []);

  const [rewards, setRewards] = useState<
    { id: number; name: string; required_points: number; description: string }[]
  >([]);

  useEffect(() => {
    fetch("http://localhost:8000/rewards")
      .then((res) => res.json())
      .then((data) => setRewards(data))
      .catch(() => console.error("리워드 불러오기 실패"));
  }, []);

  const [activeMenuSection, setActiveMenuSection] = useState<string | null>(
    "reserved",
  );
  const [showUsePointsModal, setShowUsePointsModal] = useState(false);

  const toggleSection = (section: string) => {
    setActiveMenuSection(activeMenuSection === section ? null : section);
  };

  const handlePointPurchase = async (
    itemName: string,
    cost: number,
    rewardId: number,
  ) => {
    if (userPoints < cost) {
      alert(
        "포인트가 부족합니다. 재활용 분리수거로 온기 포인트를 적립해 주세요!",
      );
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:8000/rewards/exchange", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reward_id: rewardId }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "교환 실패");
        return;
      }

      onUsePoints(cost);
      alert(
        `교환 완료\n\n'${itemName}' 교환이 완료되었습니다. (-${cost.toLocaleString()}P)`,
      );
      setShowUsePointsModal(false);
    } catch {
      alert("서버 연결 오류");
    }
  };

  /*
  const recyclingHistory = [
    { id: "1", date: "2026-05-22", item: "투명 페트병 2개 배출", points: 100 },
    { id: "2", date: "2026-05-20", item: "음료수 캔 3개 배출", points: 150 },
    { id: "3", date: "2026-05-18", item: "폐건전지 5개 배출", points: 150 },
  ];
  */

  const [receivedHistory, setReceivedHistory] = useState<
    { id: number; title: string; terminal_id: number | null }[]
  >([]);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 md:px-12 animate-fade-in">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl bg-white border border-brand-orange-light p-8 shadow-xl shadow-brand-orange/5 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-orange-light/10 rounded-bl-full select-none pointer-events-none"></div>

            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              <div className="relative h-28 w-28 rounded-full bg-brand-orange-light flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                <User className="h-14 w-14 text-brand-orange" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-brand-dark">
                  {userProfile.name}
                </h3>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange-light px-3 py-1 text-xs font-bold text-brand-orange mt-1">
                  ID: {userProfile.id}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 border-t border-brand-orange-light/40 pt-6 text-sm font-semibold">
              <div className="flex justify-between">
                <span className="text-brand-gray">관심사</span>
                <span className="text-brand-dark">{userProfile.interest}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-gray">전화번호</span>
                <span className="text-brand-dark">{userProfile.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-gray">이메일</span>
                <span className="text-brand-dark">{userProfile.email}</span>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-brand-orange-light p-6 shadow-xl shadow-brand-orange/5 flex flex-col justify-between items-stretch gap-4">
            <div className="flex items-center gap-4 bg-brand-orange-light/20 border border-brand-orange-light/50 rounded-2xl p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                <Coins className="h-6 w-6 text-brand-orange" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-extrabold text-brand-gray">
                  나의 온기 포인트
                </span>
                <p className="text-2xl font-black text-brand-orange mt-0.5">
                  {(userPoints ?? 0).toLocaleString()} P
                </p>
              </div>
              <button
                onClick={() => setShowUsePointsModal(true)}
                className="h-10 rounded-xl bg-brand-orange px-4 text-xs font-bold text-white hover:bg-brand-orange-hover transition-all cursor-pointer"
              >
                사용하기
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="overflow-hidden rounded-3xl border border-brand-orange-light bg-white shadow-sm">
            <button
              onClick={() => toggleSection("reserved")}
              className="flex w-full items-center justify-between px-6 py-5 hover:bg-brand-orange-light/10 transition-all font-bold text-brand-dark text-lg"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-orange text-white text-xs">
                  {reservedItems.length}
                </span>
                <span>나눔 받기 예약 목록</span>
              </div>
              {activeMenuSection === "reserved" ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {activeMenuSection === "reserved" && (
              <div className="border-t border-brand-orange-light/40 p-6 space-y-4 bg-brand-ivory/20">
                {reservedItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                    <AlertCircle className="h-10 w-10 text-brand-orange-light" />
                    <span className="text-sm font-bold text-brand-dark">
                      예약 대기 중인 나눔이 없습니다.
                    </span>
                    <p className="text-xs text-brand-gray">
                      이웃들의 물건을 살펴보고 나눔 예약을 진행해 보세요!
                    </p>
                  </div>
                ) : (
                  reservedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-brand-orange-light bg-white p-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-3xl leading-none">
                          {item.image}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-brand-dark truncate">
                            {item.title}
                          </h4>
                          <span className="text-xs font-semibold text-brand-gray">
                            {item.location} (보관함 C-04호기)
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <button
                          onClick={() => onCancelReservation(item.id)}
                          className="flex-1 sm:flex-none h-9 rounded-xl border border-red-200 text-xs font-bold text-red-500 bg-white hover:bg-red-50 px-3 transition-all cursor-pointer"
                        >
                          예약 취소
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-3xl border border-brand-orange-light bg-white shadow-sm">
            <button
              onClick={() => toggleSection("registered")}
              className="flex w-full items-center justify-between px-6 py-5 hover:bg-brand-orange-light/10 transition-all font-bold text-brand-dark text-lg"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-orange text-white text-xs">
                  {registeredItems.length}
                </span>
                <span>나눔 기록 목록 (내가 등록한 물품)</span>
              </div>
              {activeMenuSection === "registered" ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {activeMenuSection === "registered" && (
              <div className="border-t border-brand-orange-light/40 p-6 space-y-4 bg-brand-ivory/20">
                {registeredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center space-y-2">
                    <AlertCircle className="h-10 w-10 text-brand-orange-light" />
                    <span className="text-sm font-bold text-brand-dark">
                      등록한 나눔 물품이 없습니다.
                    </span>
                    <p className="text-xs text-brand-gray">
                      쓰지 않는 소중한 물건을 첫 나눔으로 이웃에게 전해 보세요!
                    </p>
                  </div>
                ) : (
                  registeredItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-brand-orange-light bg-white p-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-3xl leading-none">
                          {item.image}
                        </span>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-brand-dark truncate">
                            {item.title}
                          </h4>
                          <span className="text-xs font-semibold text-brand-gray">
                            {item.location} (보관함 대기중)
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 inline-flex items-center rounded-full bg-brand-orange px-2.5 py-0.5 text-[10px] font-bold text-white">
                          대기중
                        </span>
                        <button
                          onClick={() => onDeleteItem(item.id)}
                          className="h-8 w-8 flex items-center justify-center rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-3xl border border-brand-orange-light bg-white shadow-sm">
            <button
              onClick={() => toggleSection("receivedLogs")}
              className="flex w-full items-center justify-between px-6 py-5 hover:bg-brand-orange-light/10 transition-all font-bold text-brand-dark text-lg"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-orange text-white text-xs">
                  {receivedHistory.length}
                </span>
                <span>받은 나눔 목록 (수령 완료)</span>
              </div>
              {activeMenuSection === "receivedLogs" ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {activeMenuSection === "receivedLogs" && (
              <div className="border-t border-brand-orange-light/40 p-6 space-y-4 bg-brand-ivory/20">
                {receivedHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-2xl border border-brand-orange-light bg-white p-4 shadow-sm"
                  >
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-brand-dark truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-brand-gray font-semibold mt-1">
                        터미널 #{item.terminal_id ?? "-"}
                      </p>
                    </div>
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-brand-green-light px-2.5 py-1 text-xs font-bold text-brand-green">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      수령완료
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-3xl border border-brand-orange-light bg-white shadow-sm">
            <button
              onClick={() => toggleSection("recycling")}
              className="flex w-full items-center justify-between px-6 py-5 hover:bg-brand-orange-light/10 transition-all font-bold text-brand-dark text-lg"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-green text-white text-xs">
                  {recyclingHistory.length}
                </span>
                <span>재활용 기록 및 포인트 내역</span>
              </div>
              {activeMenuSection === "recycling" ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </button>

            {activeMenuSection === "recycling" && (
              <div className="border-t border-brand-orange-light/40 p-6 space-y-3 bg-brand-ivory/20 text-sm font-semibold">
                {recyclingHistory.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-2xl border border-brand-orange-light bg-white p-4 shadow-sm"
                  >
                    <div className="space-y-1">
                      <span className="text-brand-dark font-extrabold">
                        {log.item}
                      </span>
                      <p className="text-xs font-semibold text-brand-gray flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-brand-gray/80" />
                        {log.date}
                      </p>
                    </div>
                    <span className="text-base font-black text-brand-green">
                      +{log.points} P
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-between px-6 py-5 rounded-3xl border border-red-200 bg-red-50/30 text-red-500 hover:bg-red-50 font-bold text-lg transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <LogOut className="h-5 w-5" />
              <span>로그아웃</span>
            </div>
          </button>
        </div>
      </div>

      {showUsePointsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl bg-white border border-brand-orange-light p-8 shadow-2xl space-y-6 animate-scale-up">
            <button
              onClick={() => setShowUsePointsModal(false)}
              className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-brand-ivory text-brand-gray hover:text-brand-orange hover:bg-brand-orange-light/20 transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-start space-y-1 pt-2">
              <h3 className="text-xl font-black text-brand-dark">
                포인트 교환
              </h3>
              <p className="text-sm font-medium text-brand-gray">
                온기 포인트로 상품을 교환하세요.
              </p>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {rewards.map((reward) => (
                <div
                  key={reward.id}
                  onClick={() =>
                    handlePointPurchase(
                      reward.name,
                      reward.required_points,
                      reward.id,
                    )
                  }
                  className="flex items-center justify-between p-4 border border-zinc-100 hover:border-brand-orange-light hover:bg-brand-orange-light/5 rounded-2xl cursor-pointer transition-all duration-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-orange-light/30 h-11 w-11 rounded-xl flex items-center justify-center border border-brand-orange-light">
                      <Gift className="h-5 w-5 text-brand-orange" />
                    </div>
                    <div className="text-left">
                      <span className="font-extrabold text-brand-dark block text-sm">
                        {reward.name}
                      </span>
                      <span className="text-xs text-brand-orange font-bold flex items-center gap-1 mt-0.5">
                        <Coins className="h-3 w-3" />
                        {reward.required_points.toLocaleString()} P
                      </span>
                    </div>
                  </div>
                  <ShoppingBag className="h-5 w-5 text-brand-gray hover:text-brand-orange" />
                </div>
              ))}
            </div>

            <div className="bg-brand-orange-light/10 border border-brand-orange-light/40 rounded-xl p-3 flex justify-between items-center text-sm font-bold text-brand-dark">
              <span>보유 포인트</span>
              <span className="text-brand-orange">
                {userPoints.toLocaleString()} P
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
