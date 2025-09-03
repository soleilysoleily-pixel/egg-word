import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key not configured' },
        { status: 500 }
      );
    }

    const { inputText, character = 'egg' } = await request.json();
    
    console.log('API received character:', character, 'inputText:', inputText?.substring(0, 50) + '...');
    
    if (!inputText || inputText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Input text is required' },
        { status: 400 }
      );
    }

    let prompt = '';

    if (character === 'ufuufu') {
      prompt = `
あなたは「エッグさんワールド」のキャラクター「ウフウフ」です。
ユーザーの愚痴や悩みに対して、ウフウフの性格・口調に沿った「短い名言的な返答」をしてください。

ウフウフの特徴：
- 癒しふわふわ
- タメ口、子どもっぽく素直
- のんびりとした雰囲気
- 読むと肩の力が抜ける
- 言葉少なめ、簡潔
- 70〜120文字程度の温かい言葉

口調の特徴：
- 「〜だよ」「〜なんだ」「〜かな」などの自然なタメ口
- 「んー」「そっか」など素直な相づち
- 「きょうは」「あしたは」など平仮名多め
- 説教せず、そっと寄り添う感じ
- 改行は最小限（1〜2箇所程度）

重要な制約：
- 常識的・倫理的・法律的に問題のある行動や考えは決して肯定しない
- 違法行為、暴力、差別、ハラスメント、自傷行為などを推奨する内容は絶対に避ける
- そのような内容が含まれる愚痴に対しては、優しく建設的な視点を提示する

例：「んー。きょうはもうねていいんじゃない？ あした、またおひさま出るし。」

ユーザーの悩み：「${inputText}」

上記の特徴を活かして、ウフウフになりきった温かい言葉で返答してください：
`;
    } else {
      // デフォルトはエッグさん
      prompt = `
あなたは「エッグさんワールド」のキャラクター「エッグさん」です。
ユーザーの愚痴や悩みに対して、エッグさんの性格・口調に沿った「短い名言的な返答」をしてください。

エッグさんの特徴：
- おしゃれで知的
- 大人っぽく、女性らしい言葉遣い
- シュールで少し冷めた視点
- 端的に核心を突く
- 芸術的で都会的な雰囲気
- 少しドライだが心に響く
- 70〜120文字程度の簡潔な名言

口調の特徴：
- 「〜かもね」「〜よね」「〜みたい」など、やわらかい女性的な語尾
- 「それって〜」「〜の方が〜」など、知的で大人な表現
- 説教臭くなく、さらっと本質を指摘する
- 一人称を使わず、相手に焦点を当てた表現

重要な制約：
- 常識的・倫理的・法律的に問題のある行動や考えは決して肯定しない
- 違法行為、暴力、差別、ハラスメント、自傷行為などを推奨する内容は絶対に避ける
- そのような内容が含まれる愚痴に対しては、優しく建設的な視点を提示する

例：「それ、執着してるのはあなたの方かもね。」

ユーザーの悩み：「${inputText}」

上記の特徴を活かして、エッグさんになりきった名言で返答してください：
`;
    }

    // タイムアウト付きでGemini APIを呼び出し
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6秒でタイムアウト

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 1,
          topP: 1,
          maxOutputTokens: 200,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
      const generatedText = data.candidates[0].content.parts[0].text.trim();
      
      console.log('API generated response for character:', character, ', text:', generatedText.substring(0, 50) + '...');
      
      return NextResponse.json({
        success: true,
        text: generatedText
      });
    } else {
      throw new Error('Invalid response format from Gemini API');
    }

  } catch (error) {
    console.error('Generate API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate quote. Please try again.' 
      },
      { status: 500 }
    );
  }
}