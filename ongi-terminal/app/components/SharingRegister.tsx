"use client";

import React, { useState } from "react";
import { X, Camera, MapPin, MessageSquare, Sparkles, Send } from "lucide-react";
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
  const [terminalId, setTerminalId] = useState("1");
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
    생활용품: ["🕯️", "🏺", "☕", "🪴", "⛺", "👜", "🌂"],
    의류: ["👕", "🧥", "👒", "👟", "🧣"],
    기타: ["🎁", "🧸", "🚲", "🛹", "🏸"],
  };

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    const options = emojisByCategory[cat] || ["🎁"];
    setImageEmoji(options[0]);
  };

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
          {
            sender: "ai",
            text: "로그인 후 Gemini 글쓰기 도우미를 사용할 수 있습니다.",
          },
        ]);
        return;
      }

      const res = await fetch("http://localhost:8000/ai/sharing-helper", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userText }),
      });

      if (!res.ok) {
        let errorMessage = "Gemini 글쓰기 도우미 응답을 가져오지 못했습니다.";
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
      handleCategoryChange(data.category || "기타");
      setTitle(data.title || "");
      setDesc(data.desc || "");
      setReportDesc(data.report_desc || "");
      setExplain(data.explain || "");
      setTerminalId(data.terminal_id || "1");

      const terminalLabel =
        data.terminal_id === "1" ? "카페 앞 터미널" :
        data.terminal_id === "2" ? "주민센터 터미널" :
        data.terminal_id === "3" ? "지하철역 터미널" :
        data.terminal_id;

      const aiResponse = `Gemini가 등록 정보를 작성했습니다.\n\n물품명: ${data.title}\n카테고리: ${data.category}\n터미널: ${terminalLabel}\n\n왼쪽 폼을 검토한 뒤 바로 등록하시면 됩니다.`;
      setChatHistory((prev) => [...prev, { sender: "ai", text: aiResponse }]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Gemini 글쓰기 도우미 서버에 연결하지 못했습니다. 백엔드 서버 상태를 확인해 주세요.",
        },
      ]);
    } finally {
      setIsAiLoading(false);
    }
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
    formData.append("category", category);

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

      onRegister({
        title,
        desc,
        reportDesc,
        explain,
        category,
        terminalId,
        location: 
          terminalId === "1" ? "카페 앞 터미널" : 
          terminalId === "2" ? "주민센터 터미널" : 
          terminalId === "3" ? "지하철역 터미널" : 
          `터미널 ${terminalId}`,
        image: imageEmoji,
      });

      alert("나눔 물품이 온기 터미널에 성공적으로 등록되었습니다! 🎁");
      window.location.reload();
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
                      label: "카페 앞 터미널",
                      color: "text-brand-orange",
                    },
                    {
                      id: "2",
                      label: "주민센터 터미널",
                      color: "text-brand-green",
                    },
                    {
                      id: "3",
                      label: "지하철역 터미널",
                      color: "text-blue-500",
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
