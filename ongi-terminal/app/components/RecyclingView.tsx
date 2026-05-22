"use client";

import React, { useState } from "react";
import { Recycle, QrCode, Sparkles, Send, MapPin, X, Leaf, HelpCircle } from "lucide-react";

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
      text: "안녕하세요! 온기 터미널 친환경 AI 도우미입니다. 🌿\n\n버리려는 쓰레기의 이름(예: '폐건전지', '배달 치킨 용기', '깨진 유리')을 말씀해 주시면, 올바른 친환경 분리배출 요령을 안내해 드릴게요!",
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleAiChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatHistory((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setIsAiLoading(true);

    setTimeout(() => {
      let aiResponse = "";
      const text = userText.toLowerCase();

      if (text.includes("페트병") || text.includes("생수병") || text.includes("플라스틱")) {
        aiResponse = "🧴 **투명 페트병 분리배출 방법:**\n\n1. **비우기**: 내용물을 깨끗이 비우고 물로 헹굽니다.\n2. **떼기**: 겉면의 라벨(비닐)을 완전히 제거해 비닐류로 분리합니다.\n3. **찌그러트리기**: 페트병을 납작하게 밟아 부피를 줄입니다.\n4. **닫기**: 뚜껑을 꼭 닫아 **[투명 페트병 전용 보관함]**에 배출해 주세요.\n\n*💡 온기 터미널 투명 페트병 수거함에 넣으시면 개당 **50 포인트**가 적립됩니다!*";
      } else if (text.includes("건전지") || text.includes("폐건전지") || text.includes("배터리")) {
        aiResponse = "🔋 **폐건전지 분리배출 방법:**\n\n1. 망간, 알칼리 건전지는 유해 물질이 누출될 수 있어 일반 쓰레기로 버리면 절대 안 됩니다!\n2. 녹슬거나 이물질이 묻은 것은 잘 닦은 후 **[폐건전지 전용 수거함]**에 배출해 주세요.\n3. 스마트폰 보조배터리는 리튬 전지로 화재 위험이 있으므로, 별도의 보조배터리 수거함이나 지자체 수거함에 안전하게 배출해 주세요.\n\n*💡 온기 터미널 건전지 수거기에 넣으시면 개당 **30 포인트**가 적립됩니다!*";
      } else if (text.includes("유리") || text.includes("컵") || text.includes("사기")) {
        aiResponse = "🥛 **유리 및 깨진 식기 분리배출 방법:**\n\n1. **음료/잼 유리병**: 깨끗이 헹구고 라벨과 뚜껑을 제거한 뒤 유리병류로 배출합니다.\n2. **깨진 유리**: 수거하시는 분들이 다칠 위험이 있으므로 신문지에 꽁꽁 싸서 테이프로 감은 뒤 **[특수규격 마대(불연성 쓰레기 봉투)]**에 담아 일반 쓰레기로 버리셔야 합니다.\n3. **사기 그릇/도자기**: 재활용이 되지 않으므로 불연성 쓰레기 봉투에 담아 버려주세요.";
      } else if (text.includes("치킨") || text.includes("컵라면") || text.includes("배달") || text.includes("음식물")) {
        aiResponse = "🍕 **배달 음식 용기(플라스틱/컵라면) 분리배출 방법:**\n\n1. **양념 씻어내기**: 빨간 양념이나 기름때는 세제로 깨끗이 씻어내 물기를 제거해야 재활용이 가능합니다.\n2. **색깔 플라스틱**: 깨끗이 씻은 경우 플라스틱류로 정상 배출합니다.\n3. **컵라면 용기**: 스티로폼 재질 중 고추장 기름이 깊게 밴 것은 씻어도 색이 빠지지 않으므로 **[일반 종량제 봉투]**에 담아 버리셔야 합니다. 깨끗하게 하얘진 것만 스티로폼류로 재활용할 수 있습니다.";
      } else {
        aiResponse = `🌿 **'${userText}' 분리배출 안내:**\n\n1. **재활용 가능 여부**: 표면에 재활용 마크가 있는지 확인해 주세요.\n2. **기본 원칙**: 비우고, 헹구고, 분리하고, 섞지 않는 '4대 원칙'을 지켜주세요.\n3. **애매한 물건**: 여러 재질이 섞인 장난감, 가죽, 고무 등은 분리하지 못하는 경우 **일반 종량제 봉투**에 담아 배출해 주시는 것이 좋습니다.\n\n추가로 궁금한 재질이 있으시면 언제든지 편하게 질문해 주세요!`;
      }

      setChatHistory((prev) => [...prev, { sender: "ai", text: aiResponse }]);
      setIsAiLoading(false);
    }, 1500);
  };

  const handleSimulateScan = () => {
    setIsQrScanned(true);
    setTimeout(() => {
      onAddPoints(100);
      setIsQrScanned(false);
      setShowQrModal(false);
      alert("🎉 분리수거가 완료되었습니다! 100 온기 포인트가 성공적으로 적립되었습니다! (현재: " + (userPoints + 100).toLocaleString() + "P)");
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
            온기 터미널 분리수거함에 종이팩, 투명 페트병, 캔, 건전지를 배출해 보세요.
            이웃과 함께 자원을 순환시키고, 적립된 포인트는 나눔 기부나 생필품 교환에 활용할 수 있습니다.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setShowQrModal(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-brand-orange px-6 font-bold text-white shadow-lg shadow-brand-orange/15 hover:bg-brand-orange-hover hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300"
          >
            <QrCode className="h-5 w-5" />
            내 QR코드 보기
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
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green px-3.5 py-1 text-xs font-bold text-white uppercase tracking-wider">
              <Leaf className="h-3.5 w-3.5 fill-white" />
              Eco Hero
            </span>
            
            <h3 className="text-3xl font-black leading-tight text-brand-dark sm:text-4xl">
              자원을 다시 달리게 만드는 당신,<br />
              지구를 구하고 있는 우리 동네의 영웅입니다.
            </h3>
            
            <p className="text-base font-semibold leading-relaxed text-brand-gray max-w-2xl">
              올바른 재활용품 분리배출은 버려지는 자원의 80% 이상을 고품질 섬유나 원료로 재탄생시킵니다.
              오늘부터 캔, 페트병을 온기 터미널에 넣고 일상의 따뜻한 지구 살리기에 일조해 주세요!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-t border-brand-orange-light/50 pt-8 mt-8 gap-4">
            <div className="flex items-center gap-4 bg-brand-orange-light/20 border border-brand-orange-light/50 rounded-2xl p-4 w-full sm:w-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm text-2xl">
                🪙
              </div>
              <div>
                <span className="text-xs font-extrabold text-brand-gray">나의 가용 포인트</span>
                <p className="text-xl font-black text-brand-orange">{userPoints.toLocaleString()} P</p>
              </div>
            </div>
            
            <button
              onClick={() => setShowRecycleChat(!showRecycleChat)}
              className="flex h-12 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-brand-dark px-6 font-bold text-white hover:bg-brand-gray transition-all"
            >
              <HelpCircle className="h-4.5 w-4.5 text-brand-orange" />
              올바른 배출 요령 물어보기
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col rounded-3xl bg-brand-orange-light/10 border border-brand-orange-light overflow-hidden shadow-xl shadow-brand-orange/5 min-h-[460px] h-[520px] lg:h-auto">
          <div className="p-6 border-b border-brand-orange-light/40 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-orange animate-pulse" />
              <span className="font-extrabold text-brand-dark text-base">분리배출 AI 상담사</span>
            </div>
            <span className="inline-flex rounded-full bg-brand-green-light px-2.5 py-0.5 text-[10px] font-bold text-brand-green uppercase">
              Recycle AI
            </span>
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

          <form onSubmit={handleAiChatSubmit} className="p-4 border-t border-brand-orange-light/40 bg-white flex gap-2">
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
              <h3 className="text-xl font-black text-brand-dark">온기 회원 QR코드</h3>
              <p className="text-xs font-medium text-brand-gray">분리수거기 리더기에 QR코드를 비춰 인식해 주세요.</p>
            </div>

            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl bg-brand-ivory border-2 border-brand-orange-light/60 p-4 shadow-inner relative overflow-hidden">
              {isQrScanned ? (
                <div className="flex flex-col items-center justify-center text-center space-y-2 animate-pulse text-brand-green">
                  <Recycle className="h-12 w-12 animate-spin text-brand-green" />
                  <span className="text-xs font-extrabold">자원 인식 및 계정 연동 중...</span>
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

            <div className="text-xs font-bold text-brand-gray space-y-1">
              <p>인증 계정: 김온기 (010-****-5678)</p>
              <p className="text-brand-orange">💡 적립이 완료되면 포인트 잔액이 실시간 반영됩니다.</p>
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
