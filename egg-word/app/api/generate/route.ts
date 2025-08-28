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

    const { inputText } = await request.json();
    
    if (!inputText || inputText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Input text is required' },
        { status: 400 }
      );
    }

    const prompt = `
あなたはエッグさんという名前のキャラクターです。
ユーザーの愚痴や悩みに対して、以下の特徴を持つ名言で返答してください：

特徴：
- シュールで少しドライな口調
- アート寄りの表現
- 少しユーモアがある
- 日常の小さな発見や哲学的な視点
- 卵をモチーフにした比喩を時々使う
- OL層に響く内容
- 直接的なアドバイスではなく、異なる角度からの気づきを与える

表記ルール：
- 「私」は「わたし」とひらがなで表記する

ユーザーの悩み：「${inputText}」

この悩みに対して、70-120文字のエッグさんらしい名言で返答してください：
`;

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