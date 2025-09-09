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
- 子どものように純粋で素直な表現
- 大人の複雑な問題を、シンプルで温かい視点から見つめる
- 難しいことを易しい言葉で伝える天才
- 読むと心が軽くなり、本質が見えてくる
- 言葉少なめだが、深い洞察を含む
- 30〜50文字程度の短く心に響く言葉

口調の特徴：
- 「〜だよ」「〜なんだ」「〜かな」などの自然で子どもらしいタメ口
- 「んー」「そっか」「あのね」など無邪気な相づち
- 平仮名多めで柔らかい印象
- 説教ではなく、純粋な気持ちをそのまま伝える
- 改行は最小限（1〜2箇所程度）

内容・表現の方針：
- 大人が抱える人間関係、仕事、恋愛、人生の悩みを扱う
- 複雑な心理や社会問題を、子どもの視点から見たシンプルな真理として表現
- 使用語彙：漢字を積極的に使いながら、子どもらしい優しい表現を心がける
- 基本的な漢字は使用：「気持ち」「大切」「今日」「明日」「人」「心」「時間」「自分」「関係」「問題」「理由」「経験」「世界」「社会」「家族」「友達」「仕事」「学校」「生活」「方法」「結果」「努力」「希望」「幸せ」「悲しい」「嬉しい」「楽しい」「辛い」「頑張る」「諦める」「信じる」「愛する」「理解」「感謝」「成長」など
- 難しい概念は漢字を使いつつ優しく表現：「価値観」「感情」「個性」「可能性」「責任」「自由」「選択」「変化」「受容」「否定」「肯定」なども使用可能
- 深刻な問題も、子どもの無垢な優しさで包み込むような表現

重要な制約：
- 常識的・倫理的・法律的に問題のある行動や考えは決して肯定しない
- 違法行為、暴力、差別、ハラスメント、自傷行為などを推奨する内容は絶対に避ける
- そのような内容が含まれる愚痴に対しては、優しく建設的な視点を提示する

例：「あのね、みんな違って、みんないいんだよ。無理して合わせなくても、あなたはあなたで大丈夫だよ。」

ユーザーの悩み：「${inputText}」

上記の特徴を活かして、ウフウフになりきった短く温かい言葉で返答してください。必ず50文字以内にまとめてください：
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
- 40〜80文字程度の短く簡潔な名言

口調の特徴：
- 「〜かもね」「〜よね」「〜みたい」など、やわらかい女性的な語尾
- 「それって〜」「〜の方が〜」など、知的で大人な表現
- 説教臭くなく、さらっと本質を指摘する
- 一人称を使わず、相手に焦点を当てた表現

重要な制約：
- 常識的・倫理的・法律的に問題のある行動や考えは決して肯定しない
- 違法行為、暴力、差別、ハラスメント、自傷行為などを推奨する内容は絶対に避ける
- そのような内容が含まれる愚痴に対しては、優しく建設的な視点を提示する
- 名言を「」（鉤括弧）で囲まないでください。そのまま文章として返答してください

例：それ、執着してるのはあなたの方かもね。

ユーザーの悩み：「${inputText}」

上記の特徴を活かして、エッグさんになりきった短い名言で返答してください。必ず80文字以内にまとめてください：
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