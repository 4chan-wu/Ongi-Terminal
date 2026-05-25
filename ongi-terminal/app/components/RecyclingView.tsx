"use client";

import React, { useState } from "react";
import {
  Recycle,
  QrCode,
  Sparkles,
  Send,
  MapPin,
  X,
  Leaf,
  Coins,
} from "lucide-react";

interface RecyclingViewProps {
  userPoints: number;
  onAddPoints: (points: number) => void;
  setCurrentTab: (tab: string) => void;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

export default function RecyclingView({
  userPoints,
  onAddPoints,
  setCurrentTab,
}: RecyclingViewProps) {
  const [showQrModal, setShowQrModal] = useState(false);
  const [showRecycleChat, setShowRecycleChat] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isQrScanned, setIsQrScanned] = useState(false);

  const [membershipQrImage, setMembershipQrImage] = useState<string | null>(null);
  const [membershipQrLoading, setMembershipQrLoading] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("온기 회원");
  const [userPhone, setUserPhone] = useState<string>("");

  const fetchMembershipQr = async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("로그인이 필요합니다.");
      return;
    }
    
    setMembershipQrLoading(true);
    try {
      // 1. Fetch QR
      const resQr = await fetch("http://localhost:8000/qr/membership", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (resQr.ok) {
        const dataQr = await resQr.json();
        setMembershipQrImage(dataQr.qr_image_base64);
      }

      // 2. Fetch User Profile
      const resUser = await fetch("http://localhost:8000/users/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (resUser.ok) {
        const dataUser = await resUser.json();
        setUserName(dataUser.nickname || "온기 회원");
        setUserPhone(dataUser.email || "");
      }
    } catch (err) {
      console.error("멤버십 QR 또는 회원 정보 불러오기 실패", err);
    } finally {
      setMembershipQrLoading(false);
    }
  };

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: "안녕하세요! 온기 터미널 분리배출 도우미입니다.\n\n버리려는 물건 이름을 알려주시면 올바른 분리배출 방법을 안내해 드릴게요. (예: 폐건전지, 배달 용기, 깨진 유리)",
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatHistory((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setIsAiLoading(true);

    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        setChatHistory((prev) => [
          ...prev,
          { sender: "ai", text: "로그인 후 Gemini 상담사를 사용할 수 있습니다." },
        ]);
        return;
      }

      const res = await fetch("http://localhost:8000/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok) {
        let errorMessage = "Gemini 상담 응답을 가져오지 못했습니다.";
        try {
          const err = await res.json();
          if (typeof err.detail === "string") {
            errorMessage = err.detail;
          }
        } catch {
          // ignore parse failure and keep default message
        }
        setChatHistory((prev) => [
          ...prev,
          { sender: "ai", text: errorMessage },
        ]);
        return;
      }

      const data = await res.json();
      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", text: data.reply || "Gemini 응답이 비어 있습니다." },
      ]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Gemini 상담 서버에 연결하지 못했습니다. 백엔드 서버와 네트워크 상태를 확인해 주세요.",
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSimulateScan = () => {
    setIsQrScanned(true);
    setTimeout(() => {
      onAddPoints(100);
      setIsQrScanned(false);
      setShowQrModal(false);
      alert(
        "분리수거 완료! 100 온기 포인트가 적립되었습니다. (현재: " +
          ((userPoints ?? 0) + 100).toLocaleString() +
          "P)",
      );
    }, 1500);
  };

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 md:px-12 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold text-brand-dark md:text-4xl">
            재활용하고 포인트를 적립해 봐요!
          </h2>
          <p className="max-w-xl text-brand-gray font-medium">
            온기 터미널 분리수거함에 종이팩, 투명 페트병, 캔, 건전지를 배출해
            보세요. 이웃과 함께 자원을 순환시키고, 적립된 포인트는 나눔 기부나
            생필품 교환에 활용할 수 있습니다.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowQrModal(true);
              fetchMembershipQr();
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-orange px-6 font-bold text-white shadow-lg shadow-brand-orange/15 hover:bg-brand-orange-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            <QrCode className="h-5 w-5" />내 QR코드 보기
          </button>
          <button
            onClick={() => setCurrentTab("map")}
            className="flex h-12 items-center justify-center gap-2 rounded-full border border-brand-orange-light bg-white px-5 font-bold text-brand-orange hover:bg-brand-orange-light/10 transition-all duration-300"
          >
            <MapPin className="h-4.5 w-4.5" />
            터미널 찾기
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl bg-white border border-brand-orange-light p-8 md:p-12 shadow-xl shadow-brand-orange/5 min-h-[460px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-green-light rounded-bl-full opacity-40 select-none pointer-events-none"></div>

          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green px-3.5 py-1 text-xs font-bold text-white">
              <Leaf className="h-3.5 w-3.5 fill-white" />
              분리배출 도우미
            </span>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-brand-dark">
                버리기 애매한 재활용품이 있나요?
              </h3>
              <p className="text-sm font-medium text-brand-gray leading-relaxed max-w-lg">
                분리배출 방법을 모르는 물건 이름을 입력해 보세요. AI 도우미가
                친절하고 정확한 배출 가이드를 알려 드립니다.
              </p>
            </div>

            <div className="rounded-2xl bg-brand-ivory border border-brand-orange-light/60 p-5 space-y-3">
              <h4 className="text-sm font-bold text-brand-orange">
                오늘의 환경 팁
              </h4>
              <p className="text-xs font-semibold text-brand-dark leading-relaxed">
                종이팩은 일반 종이와 재활용 공정이 다릅니다! 물로 깨끗이 헹군 후,
                일반 종이류와 섞이지 않도록 우유팩 수거함에 별도로 버리셔야 진짜
                재활용이 될 수 있어요.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowRecycleChat(true)}
            className="w-full h-14 rounded-2xl bg-brand-green text-white font-extrabold text-base shadow-lg shadow-brand-green/15 hover:bg-brand-green-hover hover:scale-[1.01] active:scale-100 transition-all flex items-center justify-center gap-2 mt-8"
          >
            <Sparkles className="h-5 w-5 fill-white" />
            AI 상담사에게 물어보기
          </button>
        </div>

        <div className="lg:col-span-5 rounded-3xl border border-brand-orange-light bg-white p-8 md:p-12 shadow-xl shadow-brand-orange/5 flex flex-col justify-between min-h-[460px]">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange px-3.5 py-1 text-xs font-bold text-white">
              <Coins className="h-3.5 w-3.5" />
              분리수거 포인트
            </span>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-brand-dark">
                적립된 나의 온기 포인트
              </h3>
              <p className="text-sm font-medium text-brand-gray">
                오늘 분리배출을 완료하고 이웃의 온기를 채워보세요.
              </p>
            </div>

            <div className="rounded-2xl bg-brand-ivory border border-brand-orange-light/60 p-6 flex flex-col items-center justify-center space-y-2 shadow-inner">
              <span className="text-xs font-extrabold text-brand-gray">
                나의 현재 적립 포인트
              </span>
              <span className="text-3xl font-black text-brand-orange">
                {(userPoints ?? 0).toLocaleString()} P
              </span>
            </div>

            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2.5 text-xs font-semibold text-brand-dark">
                <div className="h-2 w-2 rounded-full bg-brand-orange"></div>
                페트병: 개당 10P 적립
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-brand-dark">
                <div className="h-2 w-2 rounded-full bg-brand-orange"></div>
                캔류: 개당 8P 적립
              </div>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-brand-dark">
                <div className="h-2 w-2 rounded-full bg-brand-orange"></div>
                종이팩/소형가전: 크기별 포인트 등급 적립
              </div>
            </div>
          </div>

          <p className="text-[10px] font-medium text-brand-gray/80 leading-normal mt-6">
            ※ 온기 수거함에 올바르지 않은 품목을 배출하거나 오염된 품목을 투입할
            경우 포인트 적립이 취소되거나 이용이 제한될 수 있습니다.
          </p>
        </div>
      </div>

      {showRecycleChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-brand-orange-light overflow-hidden shadow-2xl flex flex-col h-[80vh] animate-scale-up">
            <div className="bg-brand-green px-6 py-5 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center border border-white/10">
                  <Sparkles className="h-4.5 w-4.5 fill-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">
                    분리배출 AI 상담사
                  </h3>
                  <span className="text-[10px] font-medium opacity-85">
                    실시간 지능형 배출 안내
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowRecycleChat(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-brand-ivory/50 space-y-4">
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed font-semibold ${
                      msg.sender === "user"
                        ? "bg-brand-green text-white shadow-sm"
                        : "bg-white text-brand-dark border border-brand-orange-light/50 shadow-sm whitespace-pre-line"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-white text-brand-dark border border-brand-orange-light/50 flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-green animate-bounce"></div>
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-green animate-bounce delay-75"></div>
                      <div className="h-1.5 w-1.5 rounded-full bg-brand-green animate-bounce delay-150"></div>
                    </div>
                    <span>AI 분석 중...</span>
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={handleAiChatSubmit}
              className="p-4 border-t border-brand-orange-light/40 bg-white flex gap-2"
            >
              <input
                type="text"
                placeholder="예: 깨진 컵, 보조 배터리, 페트병..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAiLoading}
                className="flex-1 h-12 rounded-xl border border-brand-orange-light bg-white px-4 text-brand-dark font-medium placeholder-brand-gray/50 outline-none focus:border-brand-orange transition-all text-xs"
              />
              <button
                type="submit"
                disabled={isAiLoading || !chatInput.trim()}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange text-white shadow hover:bg-brand-orange-hover active:scale-95 transition-all disabled:opacity-50"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-sm rounded-3xl bg-white border border-brand-orange-light p-8 shadow-2xl text-center space-y-6 animate-scale-up">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-full bg-brand-ivory text-brand-gray hover:text-brand-orange hover:bg-brand-orange-light/20 transition-all"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col items-center space-y-1.5 pt-4">
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-green-light text-brand-green px-3 py-1 text-xs font-bold uppercase">
                Member QR
              </span>
              <h3 className="text-xl font-black text-brand-dark">
                온기 회원 QR코드
              </h3>
              <p className="text-xs font-medium text-brand-gray">
                분리수거기 리더기에 QR코드를 비춰 인식해 주세요.
              </p>
            </div>

            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl bg-brand-ivory border-2 border-brand-orange-light/60 p-3 shadow-inner relative overflow-hidden">
              {isQrScanned ? (
                <div className="flex flex-col items-center justify-center text-center space-y-2 animate-pulse text-brand-green">
                  <Recycle className="h-12 w-12 animate-spin text-brand-green" />
                  <span className="text-xs font-extrabold">
                    자원 인식 및 계정 연동 중...
                  </span>
                </div>
              ) : membershipQrLoading ? (
                <div className="flex flex-col items-center justify-center text-center space-y-2 text-brand-gray">
                  <QrCode className="h-12 w-12 animate-pulse text-brand-orange-light" />
                  <span className="text-xs font-semibold">QR코드 생성 중...</span>
                </div>
              ) : membershipQrImage ? (
                <img
                  src={`data:image/png;base64,${membershipQrImage}`}
                  alt="온기 회원 QR코드"
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-center space-y-2 text-red-500">
                  <span className="text-xs font-bold">QR 불러오기 실패</span>
                </div>
              )}
            </div>

            <div className="text-xs font-semibold text-brand-gray space-y-1">
              <p>인증 계정: {userName} {userPhone ? `(${userPhone})` : ""}</p>
              <p>
                적립이 완료되면 포인트 잔액이 실시간 반영됩니다.
              </p>
            </div>

            <button
              onClick={handleSimulateScan}
              disabled={isQrScanned}
              className="w-full h-12 rounded-xl bg-brand-green text-white font-bold shadow-md shadow-brand-green/20 hover:bg-brand-green-hover transition-all flex items-center justify-center gap-1.5"
            >
              {isQrScanned ? "처리 중..." : "가상 스캔하기 (적립 테스트)"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
