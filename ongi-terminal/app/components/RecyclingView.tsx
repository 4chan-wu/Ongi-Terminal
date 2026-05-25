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
      const res = await fetch("http://localhost:8000/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok) {
        setChatHistory((prev) => [
          ...prev,
          { sender: "ai", text: "AI 응답 오류가 발생했습니다." },
        ]);
        return;
      }

      const data = await res.json();
      setChatHistory((prev) => [...prev, { sender: "ai", text: data.reply }]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { sender: "ai", text: "서버 연결 오류가 발생했습니다." },
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
            onClick={() => setShowQrModal(true)}
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
              분리수거 포인트
            </span>

            <h3 className="text-3xl font-black leading-tight text-brand-dark sm:text-4xl">
              자원을 다시 달리게 만드는 당신,
              <br />
              지구를 구하고 있는 우리 동네의 영웅입니다.
            </h3>

            <p className="text-base font-semibold leading-relaxed text-brand-gray max-w-2xl">
              올바른 재활용품 분리배출은 버려지는 자원의 80% 이상을 고품질
              섬유나 원료로 재탄생시킵니다. 오늘부터 캔, 페트병을 온기 터미널에
              넣고 일상의 따뜻한 지구 살리기에 일조해 주세요!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-brand-orange-light/50 pt-8 mt-8 gap-4">
            <div className="flex items-center gap-4 bg-brand-orange-light/20 border border-brand-orange-light/50 rounded-2xl p-4 w-full sm:w-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                <Coins className="h-6 w-6 text-brand-orange" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-brand-gray">
                  가용 포인트
                </span>
                <p className="text-xl font-black text-brand-orange">
                  {(userPoints ?? 0).toLocaleString()} P
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRecycleChat(!showRecycleChat)}
              className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 font-bold text-white hover:bg-brand-gray transition-all"
            >
              <Sparkles className="h-4 w-4 text-brand-orange" />
              배출 방법 물어보기
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col rounded-3xl bg-brand-orange-light/10 border border-brand-orange-light overflow-hidden shadow-xl shadow-brand-orange/5 min-h-[460px] h-[520px] lg:h-auto">
          <div className="p-6 border-b border-brand-orange-light/40 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-orange" />
              <span className="font-bold text-brand-dark text-sm">
                분리배출 도우미
              </span>
            </div>
          </div>

          <div className="flex-1 p-6 space-y-4 overflow-y-auto text-sm leading-relaxed">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm border ${
                    msg.sender === "user"
                      ? "bg-brand-orange text-white border-transparent"
                      : "bg-white text-brand-dark border-brand-orange-light/50 whitespace-pre-wrap"
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

            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl bg-brand-ivory border-2 border-brand-orange-light/60 p-4 shadow-inner relative overflow-hidden">
              {isQrScanned ? (
                <div className="flex flex-col items-center justify-center text-center space-y-2 animate-pulse text-brand-green">
                  <Recycle className="h-12 w-12 animate-spin text-brand-green" />
                  <span className="text-xs font-extrabold">
                    자원 인식 및 계정 연동 중...
                  </span>
                </div>
              ) : (
                <div className="absolute inset-4 border-4 border-brand-green flex flex-col justify-between p-1 select-none pointer-events-none">
                  <div className="flex justify-between">
                    <div className="h-6 w-6 bg-brand-green"></div>
                    <div className="h-6 w-6 bg-brand-green"></div>
                  </div>
                  <div className="flex flex-col gap-1 items-center justify-center py-2">
                    <div className="h-1.5 w-full bg-brand-green"></div>
                    <div className="h-1.5 w-1/2 bg-brand-green"></div>
                    <div className="h-1.5 w-3/4 bg-brand-green"></div>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="h-6 w-6 bg-brand-green"></div>
                    <div className="h-6 w-4 bg-brand-green"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs font-semibold text-brand-gray space-y-1">
              <p>인증 계정: 김온기 (010-****-5678)</p>
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
