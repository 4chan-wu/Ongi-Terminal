"use client";

import React, { useState } from "react";
import { Lock, Mail, Phone, User, Tag, Sparkles } from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (
    name: string,
    id: string,
    email: string,
    phone: string,
    interest: string,
  ) => void;
  setCurrentTab: (tab: string) => void;
}

export default function LoginView({
  onLoginSuccess,
  setCurrentTab,
}: LoginViewProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("전자기기");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSignUp) {
      if (!name || !id || !pw || !email) {
        alert("필수 항목을 모두 입력해 주세요!");
        return;
      }
      try {
        const res = await fetch("http://localhost:8000/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, nickname: id, password: pw, name, phone }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.detail || "회원가입 실패");
          return;
        }
        const data = await res.json();
        localStorage.setItem("access_token", data.access_token);
        
        const meRes = await fetch("http://localhost:8000/users/me", {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        const meData = await meRes.json();
        
        onLoginSuccess(meData.name || meData.nickname, meData.nickname, meData.email || "", meData.phone || "", interest);
        setCurrentTab("home");
      } catch {
        alert("서버 연결 오류");
      }
    } else {
      if (!id || !pw) {
        alert("아이디와 비밀번호를 입력해 주세요!");
        return;
      }
      try {
        const res = await fetch("http://localhost:8000/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            nickname: id,
            password: pw,
          }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.detail || "로그인 실패");
          return;
        }
        const data = await res.json();
        localStorage.setItem("access_token", data.access_token);
        
        const meRes = await fetch("http://localhost:8000/users/me", {
          headers: { Authorization: `Bearer ${data.access_token}` },
        });
        const meData = await meRes.json();
        
        onLoginSuccess(meData.name || meData.nickname, meData.nickname, meData.email || "", meData.phone || "", interest);
        setCurrentTab("home");
      } catch {
        alert("서버 연결 오류");
      }
    }
  };

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-col items-center justify-center px-6 py-12 md:px-12 md:py-20 animate-fade-in">
      <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-12 items-center bg-white border border-brand-orange-light rounded-3xl overflow-hidden shadow-xl shadow-brand-orange/5">
        <div className="hidden lg:flex lg:col-span-5 h-full bg-brand-orange-light/40 p-12 flex-col justify-between min-h-[520px] relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-brand-orange/10 blur-2xl"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-brand-green/10 blur-2xl"></div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/logo.png"
                alt="온기 터미널 로고"
                className="h-10 w-10 object-contain rounded-lg shadow-sm"
              />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-orange px-3 py-1 text-xs font-bold text-white uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                Eco Sharing
              </span>
            </div>
            <h2 className="text-3xl font-extrabold leading-tight text-brand-dark">
              동네의 온기를 나누는
              <br />
              자원 공유 네트워크
            </h2>
          </div>

          <div className="space-y-6">
            <p className="text-base font-semibold leading-relaxed text-brand-gray">
              "나눔을 통한 포인트 적립, 기쁨 적립! 따뜻한 친환경 생활을 지금
              온기 터미널과 함께 시작해 보세요."
            </p>
            <div className="flex gap-2">
              <div className="h-2 w-8 rounded-full bg-brand-orange"></div>
              <div className="h-2 w-2 rounded-full bg-brand-orange-light"></div>
              <div className="h-2 w-2 rounded-full bg-brand-orange-light"></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 p-8 md:p-12 w-full">
          <div className="flex border-b border-brand-orange-light/50 mb-8">
            <button
              onClick={() => setIsSignUp(false)}
              className={`flex-1 pb-4 text-center text-lg font-bold transition-all duration-300 border-b-2 ${
                !isSignUp
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-brand-gray hover:text-brand-orange"
              }`}
            >
              로그인
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={`flex-1 pb-4 text-center text-lg font-bold transition-all duration-300 border-b-2 ${
                isSignUp
                  ? "border-brand-orange text-brand-orange"
                  : "border-transparent text-brand-gray hover:text-brand-orange"
              }`}
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <h3 className="text-2xl font-bold text-brand-dark mb-2">
              {isSignUp ? "온기 터미널 계정 생성" : "반가워요! 로그인해 주세요"}
            </h3>

            {isSignUp && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-brand-gray">
                    이름
                  </label>
                  <div className="relative">
                    <User className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-brand-gray/60" />
                    <input
                      type="text"
                      placeholder="홍길동"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full h-14 rounded-2xl border border-brand-orange-light/80 bg-brand-ivory pl-12 pr-4 text-brand-dark font-medium placeholder-brand-gray/50 outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-brand-gray">
                    전화번호
                  </label>
                  <div className="relative">
                    <Phone className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-brand-gray/60" />
                    <input
                      type="tel"
                      placeholder="010-1234-5678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full h-14 rounded-2xl border border-brand-orange-light/80 bg-brand-ivory pl-12 pr-4 text-brand-dark font-medium placeholder-brand-gray/50 outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-brand-gray">
                    이메일
                  </label>
                  <div className="relative">
                    <Mail className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-brand-gray/60" />
                    <input
                      type="email"
                      placeholder="example@ongi.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full h-14 rounded-2xl border border-brand-orange-light/80 bg-brand-ivory pl-12 pr-4 text-brand-dark font-medium placeholder-brand-gray/50 outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-brand-gray">
                    관심 분야
                  </label>
                  <div className="relative">
                    <Tag className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-brand-gray/60" />
                    <select
                      value={interest}
                      onChange={(e) => setInterest(e.target.value)}
                      className="w-full h-14 rounded-2xl border border-brand-orange-light/80 bg-brand-ivory pl-12 pr-4 text-brand-dark font-medium outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all appearance-none cursor-pointer"
                    >
                      <option value="전자기기">전자기기/가전</option>
                      <option value="도서/교육">도서/교육용품</option>
                      <option value="생활용품">생활/인테리어</option>
                      <option value="의류/잡화">의류/패션잡화</option>
                      <option value="기타">기타 생필품</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-brand-gray">
                아이디
              </label>
              <div className="relative">
                <User className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-brand-gray/60" />
                <input
                  type="text"
                  placeholder="ID 입력"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  className="w-full h-14 rounded-2xl border border-brand-orange-light/80 bg-brand-ivory pl-12 pr-4 text-brand-dark font-medium placeholder-brand-gray/50 outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-brand-gray">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-brand-gray/60" />
                <input
                  type="password"
                  placeholder="PW 입력"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  className="w-full h-14 rounded-2xl border border-brand-orange-light/80 bg-brand-ivory pl-12 pr-4 text-brand-dark font-medium placeholder-brand-gray/50 outline-none focus:border-brand-orange focus:ring-1 focus:ring-brand-orange transition-all"
                />
              </div>
            </div>

            {!isSignUp && (
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm font-semibold text-brand-gray hover:text-brand-orange hover:underline transition-all"
                >
                  아이디/비밀번호 찾기
                </button>
              </div>
            )}

            <button
              type="submit"
              className="w-full h-14 rounded-2xl bg-brand-orange text-lg font-bold text-white shadow-md shadow-brand-orange/20 hover:bg-brand-orange-hover hover:scale-[1.01] active:scale-100 transition-all duration-300"
            >
              {isSignUp ? "회원가입 완료하기" : "로그인"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
