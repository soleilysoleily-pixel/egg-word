"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [quote, setQuote] = useState<string>("エッグさんの殻の中");
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const quoteRef = useRef<HTMLDivElement>(null);

  // 意味の切れ目でバランス良く改行する関数
  const formatQuoteText = (text: string) => {
    if (!text || text === "エッグさんの殻の中") {
      return text;
    }
    
    // 文末の句読点で改行（でも、しかし、けれどもなどの接続語の前では改行しない）
    let formatted = text.replace(/(。|！|？)(　*)(?!$)/g, (_, punct) => {
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
    if (!quoteRef.current || quote === "エッグさんの殻の中") return;
    
    setIsGeneratingImage(true);
    
    try {
      const canvas = await html2canvas(quoteRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        width: 1080,
        height: 1080, // Instagram正方形サイズ
        useCORS: true,
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          
          // Web Share API対応チェック
          if (navigator.share) {
            navigator.share({
              title: 'エッグさん名言',
              text: quote + '\n\n#エッグさん名言ジェネレーター',
              files: [new File([blob], 'egg-quote.png', { type: 'image/png' })]
            }).catch((error) => {
              console.log('Share failed:', error);
              // フォールバック：シェアボタン表示
              showShareOptions(url, blob);
            });
          } else {
            // フォールバック：シェアボタン表示
            showShareOptions(url, blob);
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

  const showShareOptions = (url: string, blob: Blob) => {
    const shareText = encodeURIComponent(quote + '\n\n#エッグさん名言ジェネレーター');
    
    // X(Twitter)のシェアURLを開く
    const twitterUrl = `https://twitter.com/intent/tweet?text=${shareText}`;
    
    // 新しいタブで開くか、ユーザーが選べるようにする
    if (confirm('畫像をダウンロードしてXやInstagramに投稿しますか？\n\nOK: ダウンロード\nキャンセル: Xの投稿ページを開く')) {
      downloadImage(url);
    } else {
      window.open(twitterUrl, '_blank');
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
    <main className="min-h-screen flex flex-col items-center bg-greige-100" style={{minHeight: '100vh'}}>
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-greige-200/50 h-16 bg-white/70 backdrop-blur-sm">
          <div className="w-full max-w-4xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-medium">
              <Link href={"/"} className="text-greige-700 hover:text-sage-600 transition-colors">エッグさん名言ジェネレーター</Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl p-8 w-full">
          {/* メイン生成エリア */}
          <div className="w-full max-w-2xl space-y-12">
            {/* タイトル */}
            <motion.div 
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-sans font-bold text-greige-700">
                エッグさん名言ジェネレーター
              </h1>
              <p className="text-greige-600 leading-relaxed font-sans">
                あなたのモヤモヤを言葉に。エッグさんが答えを置いていきます
              </p>
            </motion.div>

            {/* 名言表示エリア - ローディング中から登場 */}
            <AnimatePresence>
              {(isLoading || quote !== "エッグさんの殻の中") && (
                <motion.div 
                  ref={quoteRef}
                  className="bg-white border border-greige-200 rounded-2xl p-8 min-h-[280px] flex flex-col justify-between relative shadow-lg hover:shadow-xl transition-shadow duration-300"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
                >
              <div className="flex-1 flex items-center justify-start">
                {isLoading ? (
                  <motion.div 
                    className="flex flex-col items-center gap-4 w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sage-500"></div>
                    <p className="text-greige-600 text-sm font-medium">エッグさんが考え中...</p>
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    className="text-center w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="text-red-400 text-sm mb-2">{error}</p>
                    <p className="text-greige-500 text-sm">もう一度お試しください</p>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div 
                      className="w-full pl-8 pr-32"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      key={quote}
                    >
                      <p className="text-lg text-left leading-relaxed whitespace-pre-line font-sans" style={{color: '#757575', wordBreak: 'keep-all', overflowWrap: 'break-word', lineHeight: '1.8'}}>
                        {formatQuoteText(quote)}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
              
              {/* エッグさんイラスト（右下） - 名言生成後のみ表示 */}
              <AnimatePresence>
                {quote !== "エッグさんの殻の中" && !isLoading && !error && (
                  <motion.div 
                    className="absolute bottom-6 right-6 w-32 h-32"
                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.4, delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <img 
                      src="/images/egg-character.png" 
                      alt="エッグさん" 
                      className="w-full h-full object-contain drop-shadow-sm"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 入力フィールド */}
            <motion.div 
              className="space-y-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <label htmlFor="input-text" className="block text-sm font-medium text-greige-700 text-center">
                愚痴・悩み・つぶやきを入力してみて
              </label>
              <textarea
                id="input-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="例：今日も仕事でイライラしてしまった..."
                className="w-full p-4 bg-white border border-greige-200 rounded-xl resize-none focus:ring-2 focus:ring-sage-500 focus:border-sage-500 transition-all duration-200 shadow-sm hover:shadow-md font-sans text-greige-700 placeholder-greige-400"
                rows={3}
                maxLength={200}
              />
              <div className="text-right text-xs text-greige-500">
                {inputText.length}/200文字
              </div>
            </motion.div>

            {/* 生成ボタン - 名言生成前のみ表示 */}
            <AnimatePresence>
              {quote === "エッグさんの殻の中" && (
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <button 
                    onClick={() => generateQuote()}
                    disabled={isLoading || inputText.trim().length === 0}
                    className="bg-sage-700 text-white px-10 py-4 rounded-xl font-medium hover:bg-sage-800 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none transform hover:-translate-y-0.5 active:translate-y-0 font-sans"
                  >
                    {isLoading ? "エッグさんが考え中..." : "エッグさんに愚痴る"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* シェアボタン - 名言生成後のみ表示 */}
            <AnimatePresence>
              {quote !== "エッグさんの殻の中" && !isLoading && !error && (
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <div className="flex gap-3 justify-center">
                    <button 
                      onClick={generateImage}
                      disabled={isGeneratingImage}
                      className="bg-white text-sage-600 border-2 border-sage-300 px-6 py-3 rounded-xl font-medium hover:bg-sage-50 hover:border-sage-500 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none font-sans flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                      {isGeneratingImage ? "画像生成中..." : "Xでシェア"}
                    </button>
                    <button 
                      onClick={() => {
                        generateImage();
                        // Instagramへのガイダンスを追加表示
                        setTimeout(() => {
                          if (!isGeneratingImage) {
                            alert('画像をダウンロードした後、Instagramアプリで投稿してください！');
                          }
                        }, 2000);
                      }}
                      disabled={isGeneratingImage}
                      className="bg-white text-tricolore-red-600 border-2 border-tricolore-red-200 px-6 py-3 rounded-xl font-medium hover:bg-tricolore-red-50 hover:border-tricolore-red-400 hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none font-sans flex items-center gap-2 relative"
                    >
                      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-tricolore-red-300 to-tricolore-blue-300"></div>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                      Instagram
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.footer 
          className="w-full flex items-center justify-center border-t border-greige-200/50 mx-auto text-center text-xs gap-8 py-8 bg-white/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <p className="text-greige-500 font-sans">
            エッグさん名言ジェネレーター
          </p>
        </motion.footer>
      </div>
    </main>
  );
}
