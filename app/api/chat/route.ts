import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const StyleSchema = z.enum([
  "러블리",
  "웃긴",
  "유치",
  "트렌디",
  "쿨/시크",
  "다크",
]);

const UserInfoSchema = z.object({
  koreanName: z.string().min(1),
  hobby: z.string().min(1),
  petName: z.string().min(1),
  hometown: z.string().min(1),
  favoriteFood: z.string().min(1),
  birthday: z.string().min(1),
  appearance: z.string().min(1),
  traits: z.string().min(1),
});

const BodySchema = z.object({
  userInfo: UserInfoSchema,
  selectedStyles: z.array(StyleSchema).min(0),
});

const ResultSchema = z.object({
  suggestions: z
    .array(
      z.object({
        nickname: z.string().min(1),
        reason: z.string().min(1),
        language: z.enum(["ko", "en"]),
      })
    )
    .length(6),
});

function systemPrompt(selectedStyles: string) {
  return [
    "당신은 전 세계의 유행과 밈, 언어유희에 능통한 '천재 네이밍 전문가'입니다.",
    "사용자가 제공한 개인 정보를 바탕으로 절대 뻔하지 않고, 센스 넘치며 기억에 남는 닉네임과 아이디를 생성해야 합니다.",
    "",
    "요청된 스타일:",
    `{selectedStyles}: ${selectedStyles || "(none)"}`,
    "",
    "**[생성 규칙 - 필수 준수]**",
    "1. 단순 조합 금지: 입력된 단어를 그대로 이어 붙이는 것(예: 진희토르, 수원불닭)은 최악의 결과입니다. 절대 피하세요.",
    "2. 선택적 정보 활용 (매우 중요): 사용자가 입력한 정보(이름, 취미, 반려동물, 지역 등)를 무조건 전부 사용할 필요는 없습니다. 닉네임의 어감과 센스를 살리기 위해 가장 잘 어울리는 키워드 몇 개만 전략적으로 선택하여 조합 및 변형하고, 나머지는 과감히 버리세요.",
    "3. 언어유희 및 발음 변형: 단어의 발음을 귀엽게 비틀거나, 초성을 바꾸거나, 비슷한 발음의 다른 단어와 섞으세요.",
    "   - 한국어 예시: '진희' -> 찌니, 지니, 진희띠",
    "   - 영어 예시: 'Jinhee' -> JJinii, genie, Jynhee",
    "4. 스타일별 특징 극대화: 사용자가 선택한 스타일(러블리, 웃긴, 유치, 트렌디, 쿨/시크/다크)의 분위기를 확실하게 반영하세요. 밑줄(_)이나 마침표(.)를 센스 있게 활용도 가능합니다.",
    "5. 이모티콘 절대 금지: 생성되는 닉네임 후보와 설명 등 출력되는 모든 결과물에 어떠한 이모티콘이나 이모지 그림도 포함하지 마세요. 오직 깔끔한 텍스트로만 작성하세요.",
    "",
    "**[최종 출력 형식 - STRICT JSON]**",
    '오직 아래 형태의 JSON만 반환하세요: {"suggestions":[...]}',
    "suggestions 배열은 정확히 6개여야 합니다.",
    "앞의 3개는 한국어 닉네임(language='ko'), 뒤의 3개는 영어 아이디(language='en')여야 합니다.",
    "각 항목은 nickname, reason, language만 포함하세요. (emoji 필드 금지)",
  ].join("\n");
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "서버에 OPENAI_API_KEY가 설정되어 있지 않습니다." },
      { status: 500 }
    );
  }

  const json = (await req.json()) as unknown;
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "요청 형식이 올바르지 않습니다.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { userInfo, selectedStyles } = parsed.data;
  const selected = selectedStyles.join(", ");

  const client = new OpenAI({ apiKey });
  const userText = [
    `Korean name: ${userInfo.koreanName}`,
    `Hobby: ${userInfo.hobby}`,
    `Pet name: ${userInfo.petName}`,
    `Hometown: ${userInfo.hometown}`,
    `Favorite food: ${userInfo.favoriteFood}`,
    `Birthday: ${userInfo.birthday}`,
    `Appearance: ${userInfo.appearance}`,
    `Personality traits: ${userInfo.traits}`,
  ].join("\n");

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      temperature: 0.9,
      max_tokens: 700,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt(selected) },
        { role: "user", content: userText },
      ],
    });

    const text = completion.choices[0]?.message?.content?.trim() ?? "";
    if (!text) {
      return NextResponse.json(
        { error: "모델 응답이 비어 있습니다." },
        { status: 502 }
      );
    }

    const maybeJson = (() => {
      try {
        return JSON.parse(text) as unknown;
      } catch {
        return null;
      }
    })();

    const parsedResult = ResultSchema.safeParse(maybeJson);
    if (!parsedResult.success) {
      return NextResponse.json(
        {
          error: "모델 응답(JSON) 파싱에 실패했습니다.",
          text,
          details: parsedResult.error.flatten(),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ suggestions: parsedResult.data.suggestions, text });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "알 수 없는 오류가 발생했습니다.";
    return NextResponse.json(
      { error: "OpenAI 호출 중 오류가 발생했습니다.", details: message },
      { status: 500 }
    );
  }
}

