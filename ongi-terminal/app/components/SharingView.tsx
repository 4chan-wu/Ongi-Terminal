"use client";

import React, { useState } from "react";
import { Search, Heart, MessageSquare, Plus, MapPin, X, QrCode, CheckCircle2, ChevronRight } from "lucide-react";

export interface SharingItem {
  id: string;
  title: string;
  desc: string; // 한줄 특징
  reportDesc: string; // 특이사항
  explain: string; // 정보
  location: string; // 터미널 위치
  terminalId: string;
  status: "available" | "reserved" | "completed";
  category: string;
  image: string;
  owner: string;
  createdAt: string;
}

interface SharingViewProps {
  items: SharingItem[];
  onReserveItem: (itemId: string) => void;
  onCancelReservation: (itemId: string) => void;
  onOpenRegister: () => void;
  setCurrentTab: (tab: string) => void;
}

export default function SharingView({
  items,
  onReserveItem,
  onCancelReservation,
  onOpenRegister,
  setCurrentTab,
}: SharingViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedItem, setSelectedItem] = useState<SharingItem | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);

  const categories = ["전체", "전자기기", "도서", "생활용품", "의류", "기타"];

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "전체" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenDetail = (item: SharingItem) => {
    setSelectedItem(item);
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
  };

  const handleRequestReserve = (itemId: string) => {
    onReserveItem(itemId);
    // Update local state in modal if active
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem({ ...selectedItem, status: "reserved" });
    }
    setShowQrModal(true);
  };

  const handleCancelReserve = (itemId: string) => {
    onCancelReservation(itemId);
    // Update local state in modal if active
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem({ ...selectedItem, status: "available" });
    }
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 md:px-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold text-brand-dark md:text-4xl">
            따뜻한 이웃들의 나눔 정거장
          </h2>
          <p className="max-w-xl text-brand-gray font-medium">
            유휴 공간에 설치된 온기 터미널에서 이웃이 나누는 정성스러운 물건들을 확인해 보세요.
            마음에 드는 물품은 무료로 예약하고 터미널에서 찾아가실 수 있습니다.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setCurrentTab("map")}
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-brand-orange-light bg-white px-5 font-bold text-brand-orange hover:bg-brand-orange-light/10 transition-all duration-300"
          >
            <MapPin className="h-4.5 w-4.5" />
            터미널 찾기
          </button>
          <button
            onClick={onOpenRegister}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-orange px-6 font-bold text-white shadow-lg shadow-brand-orange/15 hover:bg-brand-orange-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
            나눔 등록하기
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-center justify-between bg-white border border-brand-orange-light rounded-3xl p-6 mb-8 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition-all duration-300 ${
                selectedCategory === cat
                  ? "bg-brand-orange text-white shadow-sm"
                  : "bg-brand-orange-light/20 text-brand-gray hover:bg-brand-orange-light/40 hover:text-brand-orange"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-brand-gray/60" />
          <input
            type="text"
            placeholder="나눔 물품 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 rounded-2xl border border-brand-orange-light/80 bg-brand-ivory pl-12 pr-4 text-brand-dark font-medium placeholder-brand-gray/50 outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
          />
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-brand-orange-light bg-brand-ivory/50 p-20 text-center space-y-4">
          <Heart className="h-16 w-16 text-brand-orange-light animate-pulse" />
          <h3 className="text-xl font-bold text-brand-dark">대기 중인 나눔 물품이 없습니다</h3>
          <p className="text-brand-gray max-w-md">
            검색어 또는 카테고리를 변경해 보시거나, 여러분의 소중한 물건을 첫 번째 나눔으로 등록해 이웃의 온기를 채워보세요!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleOpenDetail(item)}
              className="group flex flex-col justify-between overflow-hidden rounded-3xl border border-brand-orange-light bg-white hover:-translate-y-1.5 hover:shadow-xl hover:shadow-brand-orange/5 transition-all duration-300 cursor-pointer"
            >
              <div className="relative h-56 w-full overflow-hidden bg-brand-orange-light/10 flex items-center justify-center">
                <span className="text-6xl group-hover:scale-110 transition-transform duration-500">{item.image}</span>
                <div className="absolute top-4 left-4">
                  {item.status === "available" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-white shadow-sm shadow-brand-orange/20 animate-pulse">
                      나눔 대기중
                    </span>
                  ) : item.status === "reserved" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white shadow-sm shadow-amber-500/20">
                      예약 완료
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-green px-3 py-1 text-xs font-bold text-white shadow-sm shadow-brand-green/20">
                      나눔 완료
                    </span>
                  )}
                </div>
                <div className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-xl bg-brand-dark/80 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-white">
                  <MapPin className="h-3.5 w-3.5 text-brand-orange" />
                  {item.location}
                </div>
              </div>

              <div className="flex flex-col flex-1 p-6 justify-between space-y-4">
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-brand-orange uppercase tracking-wider">{item.category}</span>
                  <h3 className="text-xl font-bold text-brand-dark line-clamp-1 group-hover:text-brand-orange transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-sm font-medium text-brand-gray line-clamp-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-brand-orange-light/40 pt-4">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-brand-orange-light flex items-center justify-center text-brand-orange text-[10px] font-black">
                      OWN
                    </div>
                    <span className="text-xs font-bold text-brand-dark">{item.owner}</span>
                  </div>
                  <span className="text-xs font-semibold text-brand-gray">{item.createdAt}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl rounded-3xl bg-white border border-brand-orange-light overflow-hidden shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="relative h-64 w-full bg-brand-orange-light/30 flex items-center justify-center">
              <button
                onClick={handleCloseDetail}
                className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-brand-dark/60 text-white hover:bg-brand-dark/80 transition-all z-10"
              >
                <X className="h-5 w-5" />
              </button>
              <span className="text-8xl">{selectedItem.image}</span>
              <div className="absolute top-6 left-6">
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange px-3 py-1.5 text-xs font-extrabold text-white shadow">
                  {selectedItem.category}
                </span>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-brand-orange-light/40 pb-4">
                <div>
                  <h3 className="text-2xl font-black text-brand-dark">{selectedItem.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm font-bold text-brand-gray">등록자: {selectedItem.owner}</span>
                    <span className="h-1 w-1 rounded-full bg-brand-orange-light"></span>
                    <span className="text-sm font-semibold text-brand-gray">{selectedItem.createdAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-2xl bg-brand-orange-light/30 px-4 py-2 text-sm font-extrabold text-brand-orange border border-brand-orange-light">
                  <MapPin className="h-4 w-4" />
                  {selectedItem.location}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl bg-brand-ivory p-4 border border-brand-orange-light/50">
                  <span className="text-xs font-extrabold text-brand-orange uppercase">한줄 특징</span>
                  <p className="text-base font-semibold text-brand-dark mt-1 leading-relaxed">{selectedItem.desc}</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-brand-gray">⚠️ 특이사항 및 사용감</h4>
                  <p className="text-sm font-medium text-brand-dark leading-relaxed pl-1">{selectedItem.reportDesc || "없음"}</p>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-bold text-brand-gray">📝 상세 설명</h4>
                  <p className="text-sm font-medium text-brand-dark leading-relaxed pl-1">{selectedItem.explain || "상세 정보가 없습니다."}</p>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-brand-orange-light/40">
                {selectedItem.status === "available" ? (
                  <button
                    onClick={() => handleRequestReserve(selectedItem.id)}
                    className="flex-1 flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand-orange text-lg font-bold text-white shadow-lg shadow-brand-orange/20 hover:bg-brand-orange-hover hover:scale-[1.01] transition-all"
                  >
                    나눔 신청하기 (예약)
                  </button>
                ) : selectedItem.status === "reserved" ? (
                  <div className="flex-1 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => setShowQrModal(true)}
                      className="flex-1 flex h-14 items-center justify-center gap-2 rounded-2xl bg-amber-500 text-lg font-bold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all"
                    >
                      <QrCode className="h-5 w-5" />
                      QR 인수코드 확인
                    </button>
                    <button
                      onClick={() => handleCancelReserve(selectedItem.id)}
                      className="flex-1 flex h-14 items-center justify-center gap-2 rounded-2xl border-2 border-red-500 bg-white text-lg font-bold text-red-500 hover:bg-red-50 transition-all"
                    >
                      예약 신청 취소
                    </button>
                  </div>
                ) : (
                  <div className="flex-1 h-14 rounded-2xl bg-brand-green/10 text-brand-green font-bold text-lg flex items-center justify-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    나눔이 이미 완료되었습니다
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {showQrModal && selectedItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-dark/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-white border border-brand-orange-light p-8 shadow-2xl text-center space-y-6 animate-scale-up">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-brand-ivory text-brand-gray hover:text-brand-orange hover:bg-brand-orange-light/20 transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center space-y-1.5 pt-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-orange-light text-brand-orange px-3 py-1 text-xs font-bold uppercase">
                Receipt QR
              </span>
              <h3 className="text-xl font-black text-brand-dark">보관함 인수증</h3>
              <p className="text-xs font-medium text-brand-gray">무인 캐비닛에서 QR코드를 스캔해 수령하세요.</p>
            </div>

            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl bg-brand-ivory border-2 border-brand-orange-light/60 p-4 shadow-inner relative overflow-hidden">
              <div className="absolute inset-4 border-4 border-brand-dark flex flex-col justify-between p-1 select-none pointer-events-none">
                <div className="flex justify-between">
                  <div className="h-6 w-6 bg-brand-dark"></div>
                  <div className="h-6 w-6 bg-brand-dark"></div>
                </div>
                <div className="flex flex-col gap-1 items-center justify-center py-2">
                  <div className="h-1.5 w-full bg-brand-dark"></div>
                  <div className="h-1.5 w-1/2 bg-brand-dark align-left"></div>
                  <div className="h-1.5 w-3/4 bg-brand-dark"></div>
                </div>
                <div className="flex justify-between items-end">
                  <div className="h-6 w-6 bg-brand-dark"></div>
                  <div className="h-6 w-4 bg-brand-dark"></div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-brand-orange-light/10 border border-brand-orange-light/40 p-4 space-y-2 text-left text-sm font-semibold">
              <div className="flex justify-between">
                <span className="text-brand-gray">물품명</span>
                <span className="text-brand-dark truncate max-w-[160px]">{selectedItem.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-gray">인수 위치</span>
                <span className="text-brand-dark">{selectedItem.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-gray">보관함 번호</span>
                <span className="text-brand-orange font-bold">C-04호기</span>
              </div>
              <div className="flex justify-between">
                <span className="text-brand-gray">인증 비밀번호</span>
                <span className="text-brand-dark font-mono font-bold tracking-widest">3829</span>
              </div>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full h-12 rounded-xl bg-brand-orange font-bold text-white shadow-md shadow-brand-orange/15 hover:bg-brand-orange-hover transition-all"
            >
              확인 완료
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
