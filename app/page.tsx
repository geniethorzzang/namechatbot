"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useLocalStorageState } from "@/hooks/useLocalStorage";

type UiLang = "ko" | "en";
type StyleKey = "러블리" | "웃긴" | "유치" | "트렌디" | "쿨/시크" | "다크";

type UserInfo = {
  koreanName: string;
  hobby: string;
  petName: string;
  hometown: string;
  favoriteFood: string;
  birthday: string;
  appearance: string;
  traits: string;
};

type NicknameSuggestion = {
  nickname: string;
  reason: string;
  language: "ko" | "en";
  styles: StyleKey[];
  createdAt: number;
};

type ChatMessage =
  | { id: string; role: "assistant"; content: string }
  | { id: string; role: "user"; content: string }
  | { id: string; role: "assistant"; content: string; suggestions: NicknameSuggestion[] };

const STYLE_OPTIONS: readonly { key: StyleKey; en: string }[] = [
  { key: "러블리", en: "Lovely" },
  { key: "웃긴", en: "Funny" },
  { key: "유치", en: "Cute/Cheesy" },
  { key: "트렌디", en: "Trendy" },
  { key: "쿨/시크", en: "Cool" },
  { key: "다크", en: "Dark" },
] as const;

const QUESTIONS: readonly {
  key: keyof UserInfo;
  ko: string;
  en: string;
  placeholderKo: string;
  placeholderEn: string;
}[] = [
  {
    key: "koreanName",
    ko: "이름(한글)을 알려줘!",
    en: "Tell me your Korean name!",
    placeholderKo: "예: 김민지",
    placeholderEn: "e.g. Minji (in Korean)",
  },
  {
    key: "hobby",
    ko: "취미는 뭐야?",
    en: "What’s your hobby?",
    placeholderKo: "예: 러닝, 게임, 베이킹",
    placeholderEn: "e.g. running, gaming, baking",
  },
  {
    key: "petName",
    ko: "반려동물 이름(없으면 '없음')!",
    en: "Pet name (or 'none')!",
    placeholderKo: "예: 뭉치 / 없음",
    placeholderEn: "e.g. Mochi / none",
  },
  {
    key: "hometown",
    ko: "고향/사는 도시는 어디야?",
    en: "Where’s your hometown/city?",
    placeholderKo: "예: 부산 해운대",
    placeholderEn: "e.g. Busan",
  },
  {
    key: "favoriteFood",
    ko: "최애 음식은?",
    en: "Favorite food?",
    placeholderKo: "예: 떡볶이, 초밥",
    placeholderEn: "e.g. tteokbokki, sushi",
  },
  {
    key: "birthday",
    ko: "생일(월/일 또는 계절 느낌도 OK)!",
    en: "Birthday (MM/DD or a seasonal vibe)!",
    placeholderKo: "예: 03/19 또는 봄",
    placeholderEn: "e.g. 03/19 or spring",
  },
  {
    key: "appearance",
    ko: "외모/분위기 특징(1줄) 알려줘!",
    en: "Appearance/vibe (1 line)!",
    placeholderKo: "예: 단발, 웃상, 키 큰 편",
    placeholderEn: "e.g. short hair, bright smile",
  },
  {
    key: "traits",
    ko: "성격/특성(키워드로) 알려줘!",
    en: "Personality traits (keywords)!",
    placeholderKo: "예: 엉뚱함, 다정함, 계획형",
    placeholderEn: "e.g. quirky, kind, planner",
  },
] as const;

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export default function Home() {
  const [uiLang, setUiLang] = React.useState<UiLang>("ko");
  const [selectedStyles, setSelectedStyles] = React.useState<StyleKey[]>(["트렌디"]);
  const [step, setStep] = React.useState(0);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [userInfo, setUserInfo] = React.useState<UserInfo>({
    koreanName: "",
    hobby: "",
    petName: "",
    hometown: "",
    favoriteFood: "",
    birthday: "",
    appearance: "",
    traits: "",
  });

  const { state: history, setState: setHistory } = useLocalStorageState<NicknameSuggestion[]>(
    "nickname_history_v1",
    []
  );
  const { state: favorites, setState: setFavorites } = useLocalStorageState<NicknameSuggestion[]>(
    "nickname_favorites_v1",
    []
  );

  // 서버/클라이언트 첫 렌더에서 id가 달라지면 하이드레이션 불일치 → 버튼 클릭이 안 먹을 수 있음
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome-assistant",
      role: "assistant",
      content:
        uiLang === "ko"
          ? "안녕! 너의 정보로 멋진 닉네임을 만들어줄게. 먼저 이름(한글)부터 알려줘."
          : "Hi! I’ll craft nicknames from your info. First, tell me your Korean name.",
    },
  ]);

  React.useEffect(() => {
    // 언어 토글 시 첫 인사만 자연스럽게 갱신
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0].role !== "assistant") return prev;
      return [
        {
          ...prev[0],
          content:
            uiLang === "ko"
              ? "안녕! 너의 정보로 멋진 닉네임을 만들어줄게. 먼저 이름(한글)부터 알려줘."
              : "Hi! I’ll craft nicknames from your info. First, tell me your Korean name.",
        },
      ];
    });
  }, [uiLang]);

  const currentQ = QUESTIONS[Math.min(step, QUESTIONS.length - 1)];
  const placeholder = uiLang === "ko" ? currentQ.placeholderKo : currentQ.placeholderEn;

  function toggleStyle(key: StyleKey) {
    setSelectedStyles((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  }

  async function handleSend() {
    if (loading) return;
    const value = input.trim();
    if (!value) return;

    setMessages((prev) => [...prev, { id: uid(), role: "user", content: value }]);
    setInput("");

    const q = QUESTIONS[step];
    setUserInfo((prev) => ({ ...prev, [q.key]: value }));

    const nextStep = step + 1;
    setStep(nextStep);

    if (nextStep < QUESTIONS.length) {
      const nextQ = QUESTIONS[nextStep];
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content: uiLang === "ko" ? nextQ.ko : nextQ.en,
        },
      ]);
      return;
    }

    // 모든 정보 수집 완료 -> 생성 요청
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "assistant",
        content:
          uiLang === "ko"
            ? "좋아! 이제 분위기에 맞춰 닉네임 6개(한글 3 + 영어 3) 만들어볼게."
            : "Great! Generating 6 nicknames (3 Korean + 3 English) for your selected vibes.",
      },
    ]);

    const finalInfo: UserInfo = { ...userInfo, [q.key]: value };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userInfo: finalInfo,
          selectedStyles,
        }),
      });
      const data = (await res.json()) as {
        text?: string;
        suggestions?: { nickname: string; reason: string; language: "ko" | "en" }[];
        error?: string;
        details?: unknown;
      };
      if (!res.ok) {
        const errMsg =
          data.error ??
          (uiLang === "ko" ? "응답을 처리할 수 없어요." : "Could not process response.");
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: uiLang === "ko" ? `에러: ${errMsg}` : `Error: ${errMsg}`,
          },
        ]);
        return;
      }

      const suggestionsFromApi =
        data.suggestions?.map((s) => ({
          nickname: s.nickname,
          reason: s.reason,
          language: s.language,
          styles: selectedStyles,
          createdAt: Date.now(),
        })) ?? [];

      const suggestions =
        suggestionsFromApi.length > 0 && suggestionsFromApi.length === 6 ? suggestionsFromApi : [];

      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content:
            uiLang === "ko"
              ? "여기 추천이야! 마음에 들면 복사하거나 즐겨찾기에 넣어줘."
              : "Here you go! Copy or favorite the ones you like.",
          suggestions,
        },
      ]);
      if (suggestions.length > 0) {
        setHistory((prev) => [...suggestions, ...prev].slice(0, 60));
      } else if (data.text) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content:
              uiLang === "ko"
                ? `파싱 실패(원문):\n${data.text}`
                : `Parse failed (raw):\n${data.text}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content:
              uiLang === "ko"
                ? "추천 결과가 비어 있어요. 다시 한 번 생성해볼래?"
                : "Empty result. Try generating again?",
          },
        ]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content:
            uiLang === "ko"
              ? `에러: 네트워크/서버 호출 실패 (${msg})`
              : `Error: request failed (${msg})`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function resetChat() {
    setStep(0);
    setUserInfo({
      koreanName: "",
      hobby: "",
      petName: "",
      hometown: "",
      favoriteFood: "",
      birthday: "",
      appearance: "",
      traits: "",
    });
    setMessages([
      {
        id: "welcome-assistant",
        role: "assistant",
        content:
          uiLang === "ko"
            ? "안녕! 너의 정보로 멋진 닉네임을 만들어줄게. 먼저 이름(한글)부터 알려줘."
            : "Hi! I’ll craft nicknames from your info. First, tell me your Korean name.",
      },
    ]);
  }

  function isFav(n: NicknameSuggestion) {
    return favorites.some((f) => f.nickname === n.nickname && f.reason === n.reason);
  }

  function toggleFav(n: NicknameSuggestion) {
    setFavorites((prev) => (isFav(n) ? prev.filter((f) => f.nickname !== n.nickname) : [n, ...prev]));
  }

  async function copyNickname(nickname: string) {
    try {
      await navigator.clipboard.writeText(nickname);
    } catch {
      // 일부 환경에서 clipboard 권한이 없을 수 있음
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 gap-4">
        <header className="flex items-center justify-between gap-3">
          <div className="flex flex-col">
            <div className="text-lg font-semibold">
              {uiLang === "ko" ? "닉네임 생성 챗봇" : "Nickname Generator"}
            </div>
            <div className="text-sm text-muted-foreground">
              {uiLang === "ko"
                ? "정보 + 분위기 태그로 6개 추천"
                : "6 suggestions from info + vibe tags"}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">KO</span>
              <Switch
                checked={uiLang === "en"}
                onCheckedChange={(v) => setUiLang(v ? "en" : "ko")}
                aria-label="language toggle"
              />
              <span className="text-muted-foreground">EN</span>
            </div>
            <Button variant="secondary" onClick={resetChat}>
              {uiLang === "ko" ? "초기화" : "Reset"}
            </Button>
          </div>
        </header>

        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {STYLE_OPTIONS.map((s) => {
              const active = selectedStyles.includes(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggleStyle(s.key)}
                  className={[
                    "rounded-full border px-3 py-1 text-sm transition",
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-border",
                  ].join(" ")}
                >
                  {uiLang === "ko" ? s.key : s.en}
                </button>
              );
            })}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            {uiLang === "ko"
              ? "여러 개 선택 가능. 선택한 분위기가 프롬프트에 반영돼요."
              : "Multi-select. Selected vibes are passed to the prompt."}
          </div>
        </Card>

        <div className="flex flex-1 flex-col gap-3 overflow-auto rounded-xl border border-border p-4">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div key={m.id} className={isUser ? "flex justify-end" : "flex justify-start"}>
                <div
                  className={[
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6",
                    isUser
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md",
                  ].join(" ")}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
                  {"suggestions" in m && m.suggestions ? (
                    <div className="mt-3 grid gap-2">
                      {m.suggestions.map((sug) => (
                        <div
                          key={`${sug.createdAt}_${sug.nickname}_${sug.reason}`}
                          className="rounded-xl border border-border bg-background p-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-col">
                              <div className="font-semibold">
                                {sug.nickname}
                              </div>
                              <div className="text-xs text-muted-foreground">{sug.reason}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => copyNickname(sug.nickname)}
                              >
                                {uiLang === "ko" ? "복사" : "Copy"}
                              </Button>
                              <Button
                                size="sm"
                                variant={isFav(sug) ? "default" : "outline"}
                                onClick={() => toggleFav(sug)}
                              >
                                {uiLang === "ko" ? "즐겨찾기" : "Fav"}
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <Badge variant="secondary">{sug.language === "ko" ? "KO" : "EN"}</Badge>
                            {sug.styles.map((st) => (
                              <Badge key={st} variant="outline">
                                {st}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-border p-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <div className="mb-1 text-xs text-muted-foreground">
                {step < QUESTIONS.length
                  ? uiLang === "ko"
                    ? `질문 ${step + 1}/${QUESTIONS.length}`
                    : `Question ${step + 1}/${QUESTIONS.length}`
                  : uiLang === "ko"
                    ? "생성 완료"
                    : "Done"}
              </div>
              <Input
                value={input}
                placeholder={placeholder}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSend();
                }}
                disabled={loading || step >= QUESTIONS.length}
              />
            </div>
            <Button onClick={() => void handleSend()} disabled={loading || step >= QUESTIONS.length}>
              {loading ? (uiLang === "ko" ? "생성 중..." : "Generating...") : uiLang === "ko" ? "전송" : "Send"}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="history">
          <TabsList>
            <TabsTrigger value="history">{uiLang === "ko" ? "히스토리" : "History"}</TabsTrigger>
            <TabsTrigger value="favorites">{uiLang === "ko" ? "즐겨찾기" : "Favorites"}</TabsTrigger>
          </TabsList>
          <TabsContent value="history">
            <Card className="p-4">
              {history.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {uiLang === "ko" ? "아직 히스토리가 없어요." : "No history yet."}
                </div>
              ) : (
                <div className="grid gap-2">
                  {history.slice(0, 20).map((h) => (
                    <div key={`${h.createdAt}_${h.nickname}`} className="flex items-center justify-between gap-2">
                      <div className="text-sm">
                        <span className="font-semibold">{h.nickname}</span>{" "}
                        <span className="text-muted-foreground">— {h.reason}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => void copyNickname(h.nickname)}>
                          {uiLang === "ko" ? "복사" : "Copy"}
                        </Button>
                        <Button size="sm" variant={isFav(h) ? "default" : "outline"} onClick={() => toggleFav(h)}>
                          {uiLang === "ko" ? "즐겨찾기" : "Fav"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
          <TabsContent value="favorites">
            <Card className="p-4">
              {favorites.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  {uiLang === "ko" ? "즐겨찾기가 비어 있어요." : "No favorites yet."}
                </div>
              ) : (
                <div className="grid gap-2">
                  {favorites.slice(0, 30).map((f) => (
                    <div key={`${f.createdAt}_${f.nickname}`} className="flex items-center justify-between gap-2">
                      <div className="text-sm">
                        <span className="font-semibold">{f.nickname}</span>{" "}
                        <span className="text-muted-foreground">— {f.reason}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => void copyNickname(f.nickname)}>
                          {uiLang === "ko" ? "복사" : "Copy"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => toggleFav(f)}>
                          {uiLang === "ko" ? "해제" : "Remove"}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
