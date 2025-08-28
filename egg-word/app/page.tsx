"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { useState, useRef } from "react";
import html2canvas from "html2canvas";

export default function Home() {
  const [quote, setQuote] = useState<string>("愚痴や悩みを入力して、エッグさんに相談してみましょう");
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const quoteRef = useRef<HTMLDivElement>(null);

  // 意味の切れ目でバランス良く改行する関数
  const formatQuoteText = (text: string) => {
    if (!text || text === "愚痴や悩みを入力して、エッグさんに相談してみましょう") {
      return text;
    }
    
    // 文末の句読点で改行（でも、しかし、けれどもなどの接続語の前では改行しない）
    let formatted = text.replace(/(。|！|？)(　*)(?!$)/g, (match, punct, space) => {
      return punct + '\n';
    });
    
    // 接続語や重要な区切りで改行（でも、しかし、けれどもなど）
    formatted = formatted.replace(/(。でも|。しかし|。けれども|。それでも|。そして)/g, (match) => {
      return match.replace('。', '。\n');
    });
    
    // 連続した改行を一つに結合
    formatted = formatted.replace(/\n+/g, '\n');
    
    return formatted.trim();
  };

  const generateQuote = async (retryCount = 0) => {
    setIsLoading(true);
    setError("");
    
    try {
      // タイムアウト設定（7秒）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputText }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setQuote(data.text);
      } else {
        throw new Error(data.error || 'エラーが発生しました');
      }
    } catch (err) {
      console.error('Generate quote error:', err);
      
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // リトライ処理（1回のみ）
      if (retryCount === 0 && (errorMessage.includes('timeout') || errorMessage.includes('AbortError'))) {
        console.log('Retrying due to timeout...');
        setTimeout(() => generateQuote(1), 1000);
        return;
      }
      
      // エラーメッセージの設定
      if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
        setError('生成に時間がかかっています。もう一度お試しください。');
      } else if (errorMessage.includes('429')) {
        setError('しばらく時間をおいてからお試しください。');
      } else if (errorMessage.includes('500')) {
        setError('サーバーエラーが発生しました。しばらく待ってからお試しください。');
      } else {
        setError('エラーが発生しました。もう一度お試しください。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateImage = async () => {
    if (!quoteRef.current || quote === "愚痴や悩みを入力して、エッグさんに相談してみましょう") return;
    
    setIsGeneratingImage(true);
    
    try {
      const canvas = await html2canvas(quoteRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        width: 600,
        height: 800,
        useCORS: true,
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          
          // Web Share API対応チェック
          if (navigator.share) {
            navigator.share({
              title: 'エッグさん名言',
              text: quote,
              files: [new File([blob], 'egg-quote.png', { type: 'image/png' })]
            }).catch((error) => {
              console.log('Share failed:', error);
              // フォールバック：画像ダウンロード
              downloadImage(url);
            });
          } else {
            // フォールバック：画像ダウンロード
            downloadImage(url);
          }
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Image generation failed:', error);
      setError('画像生成に失敗しました');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement('a');
    link.download = 'egg-quote.png';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="min-h-screen flex flex-col items-center bg-white">
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-4xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>エッグさん名言ジェネレーター</Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center max-w-2xl p-8 w-full">
          {/* メイン生成エリア */}
          <div className="w-full space-y-8">
            {/* タイトル */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold" style={{color: '#757575'}}>
                エッグさん名言ジェネレーター
              </h1>
              <p className="text-muted-foreground">
                愚痴や悩みを入力すると、エッグさんがアート寄りな名言で返してくれます
              </p>
            </div>

            {/* 名言表示エリア */}
            <div 
              ref={quoteRef}
              className="bg-white border border-gray-300 rounded-lg p-8 min-h-[200px] flex flex-col justify-between relative"
            >
              <div className="flex-1 flex items-center justify-start">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-4 w-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="text-muted-foreground text-sm">エッグさんが考え中...</p>
                  </div>
                ) : error ? (
                  <div className="text-center w-full">
                    <p className="text-red-500 text-sm mb-2">{error}</p>
                    <p className="text-muted-foreground text-sm">もう一度お試しください</p>
                  </div>
                ) : (
                  <div className="w-full pr-20">
                    <p className="text-lg text-left leading-relaxed whitespace-pre-line" style={{color: '#757575', wordBreak: 'keep-all', overflowWrap: 'break-word'}}>
                      {formatQuoteText(quote)}
                    </p>
                  </div>
                )}
              </div>
              
              {/* エッグさんイラスト（右下） - 名言生成後のみ表示 */}
              {quote !== "愚痴や悩みを入力して、エッグさんに相談してみましょう" && !isLoading && !error && (
                <div className="absolute bottom-4 right-4 w-16 h-16">
                  <img 
                    src="/images/egg-character.png" 
                    alt="エッグさん" 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* 入力フィールド */}
            <div className="space-y-2">
              <label htmlFor="input-text" className="block text-sm font-medium text-foreground">
                愚痴・悩み・つぶやきを入力してください
              </label>
              <textarea
                id="input-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="例：今日も仕事でイライラしてしまった..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-primary focus:border-primary"
                rows={3}
                maxLength={200}
              />
              <div className="text-right text-xs text-muted-foreground">
                {inputText.length}/200文字
              </div>
            </div>

            {/* 生成ボタン */}
            <div className="text-center">
              <button 
                onClick={() => generateQuote()}
                disabled={isLoading || inputText.trim().length === 0}
                className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "エッグさんが考え中..." : "エッグさんに相談する"}
              </button>
            </div>

            {/* シェアボタン */}
            <div className="text-center">
              <button 
                onClick={generateImage}
                disabled={isLoading || isGeneratingImage || quote === "愚痴や悩みを入力して、エッグさんに相談してみましょう"}
                className="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg font-medium hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingImage ? "画像生成中..." : "画像でシェア"}
              </button>
            </div>
          </div>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8">
          <p className="text-muted-foreground">
            エッグさん名言ジェネレーター
          </p>
        </footer>
      </div>
    </main>
  );
}
