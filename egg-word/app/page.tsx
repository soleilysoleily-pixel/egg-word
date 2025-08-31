"use client";

import { ThemeSwitcher } from "@/components/theme-switcher";
import Link from "next/link";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [quote, setQuote] = useState<string>("エッグさんの殻の中");
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [currentImage, setCurrentImage] = useState<number>(1); // 1 or 2 for alternating images
  const quoteRef = useRef<HTMLDivElement>(null);
  

  // 文字変換処理
  const convertText = (text: string) => {
    return text.replace(/私/g, 'わたし');
  };

  // エッグのイラストに重ならない部分での改行調整
  const formatQuoteText = (text: string) => {
    if (!text || text === "エッグさんの殻の中") {
      return text;
    }
    
    // エッグのイラスト領域（右下約1/3）に重ならない場合は改行しない
    // 約100文字以下なら改行なしで表示（句読点はそのまま保持）
    if (text.length <= 100) {
      return text;
    }
    
    // 句点・感嘆符・疑問符で文を分割
    const sentences = text.split(/([。！？])/).filter(part => part.length > 0);
    
    // 分割された文を再構築
    let reconstructed = '';
    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i] || '';
      const punctuation = sentences[i + 1] || '';
      reconstructed += sentence + punctuation;
    }
    
    // 意味のある区切りで改行を挿入（句点を行末に保つ）
    let formatted = reconstructed.replace(/([。！？])\s*(でも|しかし|けれども|それでも|そして|また|ただし|ただ|ところが|なぜなら|つまり|だから|それに|一方|他方|さらに|むしろ|例えば|特に)/g, (_, punctuation, conjunction) => {
      // 句点の後に接続詞が続く場合、句点を行末にして改行
      return punctuation + '\n' + conjunction;
    });
    
    // 長すぎる文の場合、適切な位置で改行（40文字程度を目安）
    formatted = formatted.replace(/([^。！？\n]{40,}?)([、]|[はがをにでと]|[するいるなるある]|[のだった])\s*(?=[あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん])/g, '$1$2\n');
    
    // 改行後の文が短すぎる場合は改行を削除（20文字未満）
    formatted = formatted.replace(/\n([^。！？\n]{1,19}[。！？])/g, '$1');
    
    // 句点が行頭に来ないよう調整
    formatted = formatted.replace(/\n([。！？])/g, '$1\n');
    
    // 連続する改行を削除
    formatted = formatted.replace(/\n\n+/g, '\n');
    
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
        // 画像を交互に切り替え
        setCurrentImage(prev => {
          const newImage = prev === 1 ? 2 : 1;
          console.log('Image switching:', prev, '->', newImage);
          return newImage;
        });
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



  return (
    <main className="min-h-screen flex flex-col items-center bg-feminine-bg" style={{minHeight: '100vh'}}>
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-gray-200/30 h-14 sm:h-16 bg-white/70 backdrop-blur-sm">
          <div className="w-full max-w-4xl flex justify-between items-center p-2 px-3 sm:p-3 sm:px-5 text-xs sm:text-sm">
            <div className="flex gap-3 sm:gap-5 items-center font-medium">
              <Link href={"/"} className="text-feminine-text hover:text-feminine-pink transition-colors truncate">
                <span className="block sm:hidden">エッグさん</span>
                <span className="hidden sm:block">エッグさん名言ジェネレーター</span>
              </Link>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeSwitcher />
            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl p-3 sm:p-4 md:p-6 lg:p-8 w-full">
          {/* メインアプリカード */}
          <div className="bg-white rounded-lg px-3 py-3 sm:px-4 sm:py-4 md:px-8 md:py-5 lg:px-12 lg:py-6 w-full max-w-3xl">
            {/* メイン生成エリア */}
            <div className="w-full space-y-6 sm:space-y-8">
            {/* タイトル */}
            <motion.div 
              className="text-center space-y-2 mt-4 sm:mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl font-sans font-bold text-feminine-pink whitespace-nowrap">
                エッグさん名言ジェネレーター
              </h1>
              <p className="text-sm sm:text-base text-feminine-text/70 leading-relaxed font-sans px-2 sm:px-0">
                あなたのモヤモヤを言葉に。<br className="block sm:hidden" />エッグさんが答えを置いていきます
              </p>
            </motion.div>

            {/* 名言表示エリア - ローディング中から登場 */}
            <AnimatePresence>
              {(isLoading || quote !== "エッグさんの殻の中") && (
                <motion.div 
                  ref={quoteRef}
                  className="rounded-lg px-3 py-8 sm:px-4 sm:py-12 md:px-8 md:py-14 lg:px-12 lg:py-16 min-h-[240px] sm:min-h-[280px] md:min-h-[300px] lg:min-h-[320px] flex flex-col justify-between relative"
                  initial={{ opacity: 0, y: 30, scale: 0.95, backgroundColor: "#ffffff" }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    backgroundColor: isLoading ? "#ffffff" : "rgba(139, 154, 107, 0.9)" // 白からやわらかいオリーブ色へ
                  }}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ 
                    duration: 0.6, 
                    type: "spring", 
                    stiffness: 100,
                    backgroundColor: { duration: 2.0, ease: "easeInOut" } // 背景色変化のトランジション
                  }}
                >
              <div className="flex-1 flex items-center justify-start">
                {isLoading ? (
                  <motion.div 
                    className="flex flex-col items-center gap-4 w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-feminine-pink"></div>
                    <p className="text-feminine-text/60 text-sm font-medium">エッグさんが考え中...</p>
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    className="text-center w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="text-red-400 text-sm mb-2">{error}</p>
                    <p className="text-feminine-text/50 text-sm">もう一度お試しください</p>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div 
                      className="w-full px-2 pr-16 sm:px-4 sm:pr-20 md:px-8 md:pr-24 lg:px-12 lg:pr-32"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      key={quote}
                    >
                      <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-left leading-relaxed whitespace-pre-line font-sans text-white" style={{wordBreak: 'keep-all', overflowWrap: 'break-word', lineHeight: '1.8', hangingPunctuation: 'force-end'}}>
                        {convertText(formatQuoteText(quote))}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
              
              {/* エッグさんイラスト（右下） - 名言生成後のみ表示 */}
              <AnimatePresence>
                {quote !== "エッグさんの殻の中" && !isLoading && !error && (
                  <motion.div 
                    className="absolute bottom-2 right-2 w-16 h-16 sm:bottom-4 sm:right-4 sm:w-20 sm:h-20 md:bottom-6 md:right-6 md:w-28 md:h-28 lg:w-32 lg:h-32"
                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.4, delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <img 
                      src={`/images/egg-character${currentImage}.png`} 
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
              <label htmlFor="input-text" className="block text-xs sm:text-sm font-medium text-feminine-text text-center px-2">
                愚痴・悩み・つぶやきを入力してみて🥚
              </label>
              <textarea
                id="input-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="例：今日も仕事でイライラしてしまった..."
                className="w-full p-2 sm:p-3 bg-feminine-input border-none rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-feminine-pink focus:ring-opacity-50 transition-all duration-200 font-sans text-feminine-text placeholder-feminine-text placeholder-opacity-50 text-sm sm:text-base"
                rows={3}
                maxLength={200}
              />
              <div className="text-right text-xs text-feminine-text/50">
                {inputText.length}/200文字
              </div>
            </motion.div>

            {/* 生成ボタン - 名言生成前かつローディング中でない時のみ表示 */}
            <AnimatePresence>
              {quote === "エッグさんの殻の中" && !isLoading && (
                <motion.div 
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <button 
                    onClick={() => generateQuote()}
                    disabled={inputText.trim().length === 0}
                    className="bg-feminine-pink hover:bg-feminine-pink-hover text-white font-medium py-2 px-4 sm:py-3 sm:px-6 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-feminine-pink focus:ring-opacity-50 disabled:cursor-not-allowed font-sans text-sm sm:text-base"
                  >
                    エッグさんに愚痴る
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 元に戻るボタン - 名言生成後のみ表示 */}
            <AnimatePresence>
              {quote !== "エッグさんの殻の中" && !isLoading && !error && (
                <motion.div 
                  className="text-center mt-6 sm:mt-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  <button 
                    onClick={() => {
                      setQuote("エッグさんの殻の中");
                      setInputText("");
                      setError("");
                    }}
                    className="bg-feminine-pink hover:bg-feminine-pink-hover text-white font-medium py-2 px-4 sm:py-3 sm:px-6 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-feminine-pink focus:ring-opacity-50 font-sans text-sm sm:text-base"
                  >
                    もっとエッグさんに愚痴る
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>

        <motion.footer 
          className="w-full flex items-center justify-center border-t border-gray-200/30 mx-auto text-center text-xs gap-4 sm:gap-8 py-4 sm:py-8 bg-white/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <p className="text-feminine-text/60 font-sans text-xs">
            © 2025 leSoleil · egg-quote.app
          </p>
        </motion.footer>
      </div>
    </main>
  );
}
