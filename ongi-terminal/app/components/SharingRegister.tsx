"use client";

import React, { useState } from "react";
import {
  X,
  Camera,
  MapPin,
  MessageSquare,
  Sparkles,
  Send,
  Check,
} from "lucide-react";
import { SharingItem } from "./SharingView";

interface SharingRegisterProps {
  onClose: () => void;
  onRegister: (
    item: Omit<SharingItem, "id" | "status" | "owner" | "createdAt">,
  ) => void;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
}

export default function SharingRegister({
  onClose,
  onRegister,
}: SharingRegisterProps) {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [explain, setExplain] = useState("");
  const [category, setCategory] = useState("전자기기");
  const [terminalId, setTerminalId] = useState("1"); // 1: Cafe, 2: Community Center, 3: Subway
  const [imageEmoji, setImageEmoji] = useState("🎁");

  // AI Chat states
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: "ai",
      text: "안녕하세요! 나눔하고 싶으신 물건을 대화하듯 말씀해 주시면, 제가 카테고리, 특징, 특이사항을 자동으로 작성해 드릴게요! 🎁\n\n예: '애플 에어팟 프로 2세대 나눔할게. 작년에 샀는데 충전 케이스 케이블 단자가 조금 헐겁지만 소리는 아주 짱짱해. 주민센터 터미널에 넣어둘게.'",
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const emojisByCategory: Record<string, string[]> = {
    전자기기: ["🎧", "⌨️", "🖱️", "🔋", "📱", "💻", "⌚"],
    도서: ["📚", "📖", "✏️", "🎨", "📓"],
    생활용품: ["🕯️", "🏺", "☕", "☕", "⛺", "👜", "🌂"],
    의류: ["👕", "🧥", "👒", "👟", "🧣"],
    기타: ["🎁", "🧸", "🚲", "🛹", "🏸"],
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const options = emojisByCategory[cat] || ["🎁"];
    setImageEmoji(options[0]);
  };

  const handleAiChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatHistory((prev) => [...prev, { sender: "user", text: userText }]);
    setChatInput("");
    setIsAiLoading(true);

    // Mock an advanced AI parsing process
    setTimeout(() => {
      let aiResponse = "";

      // Basic heuristic keywords for autofill simulation
      const text = userText.toLowerCase();
      let parsedTitle = "나눔 물품";
      let parsedCategory = "기타";
      let parsedDesc = "이웃과 나누고 싶은 유용한 물품";
      let parsedReport = "상태 양호";
      let parsedExplain = userText;
      let parsedTerminal = "1"; // Default Cafe

      if (
        text.includes("에어팟") ||
        text.includes("이어폰") ||
        text.includes("헤드폰") ||
        text.includes("ANC") ||
        text.includes("소리")
      ) {
        parsedTitle = "무선 노이즈캔슬링 이어폰";
        parsedCategory = "전자기기";
        parsedDesc = "훌륭한 음질과 노이즈 캔슬링을 제공하는 스마트 무선 기기";
        setImageEmoji("🎧");
        if (text.includes("단자") || text.includes("헐겁")) {
          parsedReport =
            "충전 케이스 단자 부분이 간혹 헐거움 (충전은 정상 작동)";
        } else {
          parsedReport = "케이스 미세 기스 있음, 본체 정상 작동";
        }
        parsedExplain =
          "이웃들과 따뜻한 음악을 함께하고 싶어 나눔합니다. 작년에 구매하였으며 소리는 매우 잘 나옵니다.";
      } else if (
        text.includes("키보드") ||
        text.includes("마우스") ||
        text.includes("타이핑")
      ) {
        parsedTitle = "개발자용 기계식 키보드";
        parsedCategory = "전자기기";
        parsedDesc = "부드러운 타건감과 레트로 디자인의 무선 기계식 키보드";
        setImageEmoji("⌨️");
        parsedReport = "특정 키 캡 생활 흔적 있음, LED 등 작동 원활";
        parsedExplain =
          "개발 작업 시 애용하던 키보드입니다. 이번에 장비를 교체하면서 이웃 개발자나 학생분들을 위해 기쁜 마음으로 나눔합니다.";
      } else if (
        text.includes("책") ||
        text.includes("도서") ||
        text.includes("백과사전") ||
        text.includes("공부")
      ) {
        parsedTitle = "어린이 창의력 백과사전 세트";
        parsedCategory = "도서";
        parsedDesc = "아이들의 지적 호기심과 지식 탐구를 돕는 풀컬러 과학 전집";
        setImageEmoji("📚");
        parsedReport = "1권 모서리 미세 찢어짐 외 전 권 낙서 없이 깨끗함";
        parsedExplain =
          "아이가 자라면서 이제 더이상 읽지 않게 되어 동네 아이들을 위해 나눔합니다. 그림이 알차고 공부에 아주 큰 도움이 됩니다.";
      } else if (
        text.includes("캠핑") ||
        text.includes("랜턴") ||
        text.includes("램프") ||
        text.includes("조명")
      ) {
        parsedTitle = "아날로그 클래식 캠핑 랜턴";
        parsedCategory = "생활용품";
        parsedDesc = "캠핑 감성을 더해주는 충전식 아날로그 우드 LED 램프";
        setImageEmoji("🕯️");
        parsedReport = "박스 구성품 없음, 본체 및 USB 케이블 완비";
        parsedExplain =
          "캠핑 분위기를 매우 감성적으로 만들어 주는 충전식 조명입니다. 야외 활동을 사랑하시는 이웃분들이 유용하게 써주셨으면 좋겠습니다.";
      }

      if (text.includes("주민센터") || text.includes("주민")) {
        parsedTerminal = "2";
      } else if (text.includes("지하철") || text.includes("역")) {
        parsedTerminal = "3";
      } else if (text.includes("카페")) {
        parsedTerminal = "1";
      }

      // Auto-fill values
      setTitle(parsedTitle);
      setCategory(parsedCategory);
      setDesc(parsedDesc);
      setReportDesc(parsedReport);
      setExplain(parsedExplain);
      setTerminalId(parsedTerminal);

      aiResponse = `💡 **AI 추천 정보 작성 완료!**\n\n요청하신 내용을 바탕으로 상품 상세 폼을 완벽하게 작성해 드렸습니다!\n\n* **작성된 품목**: ${parsedTitle}\n* **카테고리**: ${parsedCategory}\n* **선택된 터미널**: ${parsedTerminal === "1" ? "카페 앞" : parsedTerminal === "2" ? "주민센터" : "지하철역"}\n\n상세한 필드가 올바른지 좌측 폼에서 검토하신 후 하단의 '나눔 등록하기' 버튼을 눌러 등록을 진행해 주세요!`;

      setChatHistory((prev) => [...prev, { sender: "ai", text: aiResponse }]);
      setIsAiLoading(false);
    }, 2000);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc || !explain) {
      alert("이름, 한 줄 특징, 상세 정보는 필수 입력 사항입니다!");
      return;
    }

    const token = localStorage.getItem("access_token");
    if (!token) {
      alert("로그인이 필요합니다!");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("desc", desc);
    formData.append("explain", explain);
    formData.append("report_desc", reportDesc);
    formData.append("terminal_id", terminalId);

    try {
      const res = await fetch("http://localhost:8000/items", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.detail || "물품 등록 실패");
        return;
      }

      const terminalLocations: Record<string, string> = {
        "1": "카페 앞 정거장",
        "2": "주민센터 앞 정거장",
        "3": "지하철역 앞 정거장",
      };

      onRegister({
        title,
        desc,
        reportDesc,
        explain,
        category,
        terminalId,
        location: terminalLocations[terminalId] || "카페 앞 정거장",
        image: imageEmoji,
      });

      alert("나눔 물품이 온기 터미널에 성공적으로 등록되었습니다! 🎁");
      onClose();
    } catch {
      alert("서버 연결 오류");
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-dark/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl rounded-3xl bg-white border border-brand-orange-light overflow-hidden shadow-2xl animate-scale-up max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-brand-orange-light/50 px-8 py-5 bg-brand-ivory">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange text-white">
              🎁
            </span>
            <h2 className="text-2xl font-black text-brand-dark">
              나눔 물품 등록하기
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-orange-light/20 text-brand-gray hover:text-brand-orange hover:bg-brand-orange-light/40 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 grid lg:grid-cols-12 overflow-y-auto min-h-0">
          <form
            onSubmit={handleFormSubmit}
            className="lg:col-span-7 p-8 space-y-6 overflow-y-auto"
          >
            <div className="flex flex-col sm:flex-row gap-6 items-center border-b border-brand-orange-light/40 pb-6">
              <div className="relative h-28 w-28 rounded-3xl bg-brand-orange-light/30 border border-brand-orange-light flex items-center justify-center text-5xl shadow-inner group">
                {imageEmoji}
                <div className="absolute inset-0 bg-brand-dark/30 rounded-3xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer">
                  <Camera className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-2 flex-1 text-center sm:text-left">
                <span className="text-xs font-bold text-brand-gray">
                  물품 아이콘 선택 (카테고리 연동)
                </span>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  {(emojisByCategory[category] || ["🎁"]).map((emo) => (
                    <button
                      key={emo}
                      type="button"
                      onClick={() => setImageEmoji(emo)}
                      className={`h-10 w-10 text-xl flex items-center justify-center rounded-xl transition-all border ${
                        imageEmoji === emo
                          ? "bg-brand-orange border-brand-orange text-white scale-105"
                          : "bg-brand-ivory border-brand-orange-light/50 hover:bg-brand-orange-light/20"
                      }`}
                    >
                      {emo}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-brand-gray">
                  카테고리
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(emojisByCategory).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`rounded-full px-4 py-1.5 text-xs font-extrabold border transition-all ${
                        category === cat
                          ? "bg-brand-orange border-brand-orange text-white"
                          : "bg-white border-brand-orange-light/60 text-brand-gray hover:bg-brand-orange-light/20"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-brand-gray">
                  물품 이름
                </label>
                <input
                  type="text"
                  placeholder="예: 애플 에어팟 프로 2세대"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full h-12 rounded-2xl border border-brand-orange-light/80 bg-brand-ivory px-4 text-brand-dark font-medium outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-brand-gray">
                  한 줄 특징
                </label>
                <input
                  type="text"
                  placeholder="예: 소리가 깨끗하고 노이즈 캔슬링이 잘 되는 상태 좋은 이어폰"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full h-12 rounded-2xl border border-brand-orange-light/80 bg-brand-ivory px-4 text-brand-dark font-medium outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                />
              </div>

              {/* Terminal select */}
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-brand-gray">
                  인수 터미널 지정
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      id: "1",
                      label: "카페 앞 정거장",
                      pin: "1",
                      color: "text-brand-orange",
                    },
                    {
                      id: "2",
                      label: "주민센터 앞",
                      pin: "2",
                      color: "text-brand-green",
                    },
                    {
                      id: "3",
                      label: "지하철역 앞",
                      pin: "3",
                      color: "text-brand-blue",
                    },
                  ].map((term) => (
                    <button
                      key={term.id}
                      type="button"
                      onClick={() => setTerminalId(term.id)}
                      className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all ${
                        terminalId === term.id
                          ? "bg-brand-orange-light/30 border-brand-orange font-bold text-brand-orange"
                          : "bg-white border-zinc-200 text-brand-gray hover:bg-brand-orange-light/10"
                      }`}
                    >
                      <MapPin className={`h-5 w-5 mb-1 ${term.color}`} />
                      <span className="text-xs font-semibold">
                        {term.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-brand-gray">
                  특이사항 (사용감, 흠집, 헐거움 등)
                </label>
                <input
                  type="text"
                  placeholder="예: 오른쪽 이어폰 아래 미세 긁힘 있음, 박스 없음"
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  className="w-full h-12 rounded-2xl border border-brand-orange-light/80 bg-brand-ivory px-4 text-brand-dark font-medium outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-brand-gray">
                  상세 정보
                </label>
                <textarea
                  placeholder="물건의 구매시기, 사용 빈도, 나눔하게 된 이유 등을 자세하게 적어주세요."
                  rows={4}
                  value={explain}
                  onChange={(e) => setExplain(e.target.value)}
                  className="w-full rounded-2xl border border-brand-orange-light/80 bg-brand-ivory p-4 text-brand-dark font-medium outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-brand-orange-light/40">
              <button
                type="button"
                onClick={() => setShowAiHelper(!showAiHelper)}
                className={`flex-1 flex h-14 items-center justify-center gap-2 rounded-2xl font-bold border transition-all duration-300 ${
                  showAiHelper
                    ? "bg-brand-orange/10 border-brand-orange text-brand-orange"
                    : "bg-white border-brand-orange text-brand-orange hover:bg-brand-orange/5"
                }`}
              >
                <MessageSquare className="h-5 w-5" />
                AI 추천 글쓰기 도우미 {showAiHelper ? "닫기" : "열기"}
              </button>
              <button
                type="submit"
                className="flex-1 flex h-14 items-center justify-center gap-2 rounded-2xl bg-brand-orange text-lg font-bold text-white shadow-lg shadow-brand-orange/20 hover:bg-brand-orange-hover hover:scale-[1.01] transition-all cursor-pointer"
              >
                나눔 등록하기
              </button>
            </div>
          </form>

          <div
            className={`lg:col-span-5 border-t lg:border-t-0 lg:border-l border-brand-orange-light/50 bg-brand-orange-light/10 flex flex-col h-full min-h-[400px] lg:min-h-0 ${showAiHelper ? "block" : "hidden lg:flex"}`}
          >
            <div className="p-6 border-b border-brand-orange-light/40 bg-white/50 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-brand-orange animate-pulse" />
                <span className="font-extrabold text-brand-dark text-base">
                  AI 추천 글쓰기 도우미
                </span>
              </div>
              <span className="inline-flex rounded-full bg-brand-orange-light px-2.5 py-0.5 text-[10px] font-bold text-brand-orange uppercase">
                Autofill
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
                      <div className="h-2 w-2 rounded-full bg-brand-orange animate-bounce"></div>
                      <div className="h-2 w-2 rounded-full bg-brand-orange animate-bounce delay-75"></div>
                      <div className="h-2 w-2 rounded-full bg-brand-orange animate-bounce delay-150"></div>
                    </div>
                    <span>AI가 물품을 분석하고 추천 정보를 입력하는 중...</span>
                  </div>
                </div>
              )}
            </div>

            <form
              onSubmit={handleAiChatSubmit}
              className="p-4 border-t border-brand-orange-light/40 bg-white/50 backdrop-blur-sm flex gap-2"
            >
              <input
                type="text"
                placeholder="예: 레트로 캠핑 랜턴 나눔할게..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAiLoading}
                className="flex-1 h-12 rounded-xl border border-brand-orange-light bg-white px-4 text-brand-dark font-medium placeholder-brand-gray/50 outline-none focus:border-brand-orange transition-all text-xs"
              />
              <button
                type="submit"
                disabled={isAiLoading || !chatInput.trim()}
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange text-white shadow hover:bg-brand-orange-hover active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
