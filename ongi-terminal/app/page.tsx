"use client";

import React, { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import HomeView from "./components/HomeView";
import LoginView from "./components/LoginView";
import SharingView, { SharingItem } from "./components/SharingView";
import SharingRegister from "./components/SharingRegister";
import RecyclingView from "./components/RecyclingView";
import MapView from "./components/MapView";
import MyPageView from "./components/MyPageView";

export default function Home() {
  // Navigation & UI control state
  const [currentTab, setCurrentTab] = useState<string>("home");
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [selectedTerminalId, setSelectedTerminalId] = useState<string | null>(
    null,
  );

  // Authenticated User State (Default mock matching Figma Profile page)
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState({
    name: "",
    id: "",
    email: "",
    phone: "",
    interest: "",
  });

  // Points State (Figma Point metric starts at 3,000P)
  const [userPoints, setUserPoints] = useState<number>(3000);

  const [userRegisteredItems, setUserRegisteredItems] = useState<SharingItem[]>(
    [],
  );

  // Sharing items dataset (Pre-filled with diverse beautiful options)
  const [items, setItems] = useState<SharingItem[]>([
    {
      id: "sh-1",
      title: "무선 노이즈캔슬링 헤드폰",
      desc: "소리가 매우 풍부하고 배터리가 하루 종일 가는 가벼운 오렌지 컬러 ANC 헤드폰",
      reportDesc:
        "오른쪽 하단부 미세 기스 존재하나 기능상 100% 정상 작동합니다.",
      explain:
        "작년에 선물 받아서 서너 번 사용하고 박스에 고이 모셔둔 무선 헤드폰입니다. 다른 헤드폰을 주로 쓰게 되어 이웃분들과 좋은 소리를 나누고자 나눔합니다.",
      location: "카페 앞 정거장",
      terminalId: "1",
      status: "available",
      category: "전자기기",
      image: "🎧",
      owner: "박지영",
      createdAt: "2026-05-22",
    },
    {
      id: "sh-2",
      title: "개발자용 무선 기계식 키보드",
      desc: "부드러운 갈축 타건감과 레트로 색상이 감성을 채워주는 블루투스 키보드",
      reportDesc:
        "스페이스바 우측 키캡 생활 흠집 미세 존재, 동글이와 USB 케이블 포함.",
      explain:
        "주로 개발 코딩용으로 아껴 쓰던 키보드입니다. 이번에 기종 변경으로 더이상 쓰지 않아, 공부하는 학생분이나 개발자 이웃분들을 위해 가치있게 나눔합니다.",
      location: "주민센터 앞 정거장",
      terminalId: "2",
      status: "available",
      category: "전자기기",
      image: "⌨️",
      owner: "김민재",
      createdAt: "2026-05-21",
    },
    {
      id: "sh-3",
      title: "아날로그 클래식 캠핑 랜턴",
      desc: "텐트나 테이블 조명으로 감성을 한층 올려주는 충전식 목재 LED 램프",
      reportDesc: "충전 케이블 포함, 박스 패키지 없음.",
      explain:
        "지난 가을 캠핑 때 두어 번 사용한 감성 가득 목재 LED 랜턴입니다. 집안 무드등이나 야외 활동 시 조명으로 매우 훌륭합니다.",
      location: "지하철역 앞 정거장",
      terminalId: "3",
      status: "available",
      category: "생활용품",
      image: "🕯️",
      owner: "최수현",
      createdAt: "2026-05-20",
    },
    {
      id: "sh-4",
      title: "어린이 창의력 백과사전 10권 세트",
      desc: "아이들의 다양한 호기심을 유익하게 채워주는 그림 백과사전 베스트 전집",
      reportDesc:
        "3권 책 모퉁이 미세 헤짐 외 낙서 일체 없이 깨끗한 소장용 상태.",
      explain:
        "아이가 부쩍 자라서 중학생이 된 바람에 더 이상 보지 않아 나눔합니다. 초등학교 저학년 아이들이 재미있는 그림을 보며 유익하게 학습하기에 아주 좋습니다.",
      location: "주민센터 앞 정거장",
      terminalId: "2",
      status: "available",
      category: "도서",
      image: "📚",
      owner: "정미숙",
      createdAt: "2026-05-18",
    },
  ]);

  useEffect(() => {
    fetch("http://localhost:8000/items")
      .then((res) => res.json())
      .then((data) => {
        const mapped = data.map(
          (item: {
            id: number;
            title: string;
            description: string;
            category: string;
            tags: string;
            image_url: string | null;
            status: string;
            terminal_id: number;
            donor_id: number;
            donor_nickname?: string;
            desc?: string;
            explain?: string;
            report_desc?: string;
          }) => ({
            id: String(item.id),
            title: item.title,
            desc: item.desc || item.description || "",
            reportDesc: item.report_desc || "",
            explain: item.explain || "",
            location: `터미널 ${item.terminal_id}`,
            terminalId: String(item.terminal_id),
            status:
              item.status === "stored"
                ? "available"
                : item.status === "taken"
                  ? "completed"
                  : "available",
            category: item.category || "기타",
            // 등록 시 저장된 이모지(image_url)가 있으면 사용, 없으면 카테고리로 폴백
            image: item.image_url ||
              (item.category === "전자기기"
                ? "🎧"
                : item.category === "도서"
                  ? "📚"
                  : item.category === "생활용품"
                    ? "🕯️"
                    : item.category === "의류"
                      ? "👕"
                      : "🎁"),
            // donor_nickname이 API에서 오면 사용, 없으면 ID 표시
            owner: item.donor_nickname || `이웃 주민 ${item.donor_id}`,
            createdAt: new Date().toISOString().split("T")[0],
          }),
        );
        setItems(mapped);
      })
      .catch(() => console.error("물품 목록 불러오기 실패"));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;

    // Auto-login session restore
    fetch("http://localhost:8000/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid token");
        return res.json();
      })
      .then((data) => {
        setUserProfile({
          name: data.name || data.nickname,
          id: data.nickname,
          email: data.email || "",
          phone: data.phone || "",
          interest: "재활용 및 환경 보호",
        });
        setIsLoggedIn(true);
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        setIsLoggedIn(false);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !isLoggedIn) return;
    fetch("http://localhost:8000/items/my", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          console.error("내 물품 API 오류:", res.status, err); // ← 정확한 오류 확인
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const mapped = data.map(
          (item: {
            id: number;
            title: string;
            desc: string;
            category: string;
            terminal_id: number;
            status: string;
            donor_id: number;
            explain?: string;
            report_desc?: string;
          }) => ({
            id: String(item.id),
            title: item.title,
            desc: item.desc || "",
            reportDesc: item.report_desc || "",
            explain: item.explain || "",
            location: `터미널 ${item.terminal_id}`,
            terminalId: String(item.terminal_id),
            status: "available" as const,
            category: item.category || "기타",
            image:
              item.category === "전자기기"
                ? "🎧"
                : item.category === "도서"
                  ? "📚"
                  : item.category === "생활용품"
                    ? "🕯️"
                    : item.category === "의류"
                      ? "👕"
                      : "🎁",
            owner: userProfile.name,
            createdAt: new Date().toISOString().split("T")[0],
          }),
        );
        setUserRegisteredItems(mapped);
      })
      .catch(() => console.error("내 물품 불러오기 실패"));
  }, [isLoggedIn]);

  // Fetch points when login state changes
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token || !isLoggedIn) return;
    fetch("http://localhost:8000/points/balance", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUserPoints(data.balance);
      })
      .catch(() => console.error("포인트 불러오기 실패"));
  }, [isLoggedIn]);

  // Handle Login and user updates
  const handleLoginSuccess = (
    name: string,
    id: string,
    email: string,
    phone: string,
    interest: string,
  ) => {
    setUserProfile({ name, id, email, phone, interest });
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserProfile({
      name: "",
      id: "",
      email: "",
      phone: "",
      interest: "",
    });
    setCurrentTab("home");
  };

  // State synchronization helper functions
  const handleReserveItem = (itemId: string) => {
    if (!isLoggedIn) {
      alert("나눔 서비스를 이용하시려면 로그인이 필요합니다.");
      setCurrentTab("login");
      return;
    }
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, status: "reserved" as const, owner: userProfile.name }
          : item,
      ),
    );
  };

  const handleCancelReservation = (itemId: string) => {
    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === itemId
          ? { ...item, status: "available" as const, owner: "이웃 주민" }
          : item,
      ),
    );
  };

  const handleRegisterItem = (
    newItem: Omit<SharingItem, "id" | "status" | "owner" | "createdAt">,
  ) => {
    const formattedItem: SharingItem = {
      ...newItem,
      id: `sh-${Date.now()}`,
      status: "available" as const,
      owner: isLoggedIn ? userProfile.name : "익명",
      createdAt: new Date().toISOString().split("T")[0],
    };
    setItems((prevItems) => [formattedItem, ...prevItems]);
    if (isLoggedIn) {
      setUserRegisteredItems((prev) => [formattedItem, ...prev]);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("정말 이 물품 나눔을 삭제하시겠습니까?")) return;

    if (itemId.startsWith("sh-")) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setUserRegisteredItems((prev) => prev.filter((item) => item.id !== itemId));
      alert("물품 나눔이 삭제되었습니다.");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:8000/items/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
        setUserRegisteredItems((prev) => prev.filter((item) => item.id !== itemId));
        alert("물품 나눔이 삭제되었습니다.");
        return;
      }

      alert("물품 나눔이 성공적으로 삭제되었습니다.");
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setUserRegisteredItems((prev) => prev.filter((item) => item.id !== itemId));
    } catch {
      alert("서버 연결 오류");
    }
  };

  const handleAddPoints = (points: number) => {
    setUserPoints((prev) => prev + points);
  };

  const handleUsePoints = (points: number) => {
    setUserPoints((prev) => prev - points);
  };

  // Derive counts dynamically
  const availableSharingCount = items.filter(
    (item) => item.status === "available",
  ).length;
  const userReservedItems = items.filter(
    (item) => item.status === "reserved" && item.owner === userProfile.name,
  );

  return (
    <div className="flex flex-col min-h-screen bg-brand-cream text-brand-dark font-sans selection:bg-brand-orange-light selection:text-brand-orange">
      {/* Sticky Header Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        isLoggedIn={isLoggedIn}
        userName={userProfile.name}
        onLogout={handleLogout}
        onOpenLogin={() => setCurrentTab("login")}
      />

      {/* Main App Layout */}
      <main className="flex-1 flex flex-col justify-start">
        {currentTab === "home" && (
          <HomeView
            setCurrentTab={setCurrentTab}
            userPoints={userPoints}
            sharingCount={availableSharingCount}
            setSelectedTerminalId={setSelectedTerminalId}
            onOpenRegister={() => {
              if (!isLoggedIn) {
                alert("나눔 등록을 하시려면 로그인이 필요합니다.");
                setCurrentTab("login");
              } else {
                setShowRegisterModal(true);
              }
            }}
          />
        )}

        {currentTab === "sharing" && (
          <SharingView
            items={items}
            onReserveItem={handleReserveItem}
            onCancelReservation={handleCancelReservation}
            onOpenRegister={() => {
              if (!isLoggedIn) {
                alert("나눔 등록을 하시려면 로그인이 필요합니다.");
                setCurrentTab("login");
              } else {
                setShowRegisterModal(true);
              }
            }}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === "recycling" && (
          <RecyclingView
            userPoints={userPoints}
            onAddPoints={handleAddPoints}
            setCurrentTab={setCurrentTab}
          />
        )}

        {currentTab === "map" && (
          <MapView
            selectedTerminalId={selectedTerminalId}
            setSelectedTerminalId={setSelectedTerminalId}
            setCurrentTab={setCurrentTab}
            items={items}
          />
        )}

        {currentTab === "mypage" && (
          <MyPageView
            userProfile={userProfile}
            userPoints={userPoints}
            reservedItems={userReservedItems}
            registeredItems={userRegisteredItems}
            onCancelReservation={handleCancelReservation}
            onLogout={handleLogout}
            onUsePoints={handleUsePoints}
            onDeleteItem={handleDeleteItem}
          />
        )}

        {currentTab === "login" && (
          <LoginView
            onLoginSuccess={handleLoginSuccess}
            setCurrentTab={setCurrentTab}
          />
        )}
      </main>

      {/* Shared Overlay Registration Modal */}
      {showRegisterModal && (
        <SharingRegister
          onClose={() => setShowRegisterModal(false)}
          onRegister={handleRegisterItem}
          onSuccess={() => {
            setShowRegisterModal(false);
            setCurrentTab("sharing");
          }}
          userNickname={userProfile.id}
        />
      )}

      {/* Footer Details */}
      <footer className="border-t border-brand-orange-light/30 bg-brand-ivory py-8 text-center text-xs font-semibold text-brand-gray">
        <div className="mx-auto max-w-7xl px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 온기 터미널 (Ongi Terminal). All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-brand-orange transition-colors">
              이용약관
            </a>
            <a href="#" className="hover:text-brand-orange transition-colors">
              개인정보처리방침
            </a>
            <a href="#" className="hover:text-brand-orange transition-colors">
              지구 구하기
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
