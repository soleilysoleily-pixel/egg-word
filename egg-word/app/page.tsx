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
  const [activeTab, setActiveTab] = useState<'x' | 'instagram'>('x');
  const quoteRef = useRef<HTMLDivElement>(null);
  const instagramImageRef = useRef<HTMLDivElement>(null);
  
  const APP_URL = 'https://egg-quote.app'; // 実際のアプリURLに変更

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
    
    // 長い文章の場合のみ、意味のある区切りで改行
    // ただし改行後の文が短すぎる場合（30文字未満）は改行しない
    let formatted = text.replace(/(でも|しかし|けれども|それでも|そして|また|ただ)/g, (match, offset) => {
      const remaining = text.slice(offset + match.length);
      if (remaining.length >= 30) {
        return '\n' + match;
      }
      return match;
    });
    
    return formatted.trim();
  };

  // X用短縮名言生成（エディターアルゴリズム）
  const shortenQuote = (text: string): string => {
    if (text.length <= 140) return text;
    
    // 文の区切りで分割
    const sentences = text.split(/[。！？]/).filter(s => s.trim().length > 0);
    
    // 各文の「パンチライン度」をスコアリング
    const scoreSentence = (sentence: string): number => {
      let score = 0;
      
      // 比喩・体言止めにボーナス
      if (sentence.includes('みたい') || sentence.includes('ような') || sentence.includes('って')) score += 2;
      if (/[だである]$/.test(sentence.trim()) === false) score += 1; // 体言止め
      
      // 核心的なキーワードにボーナス
      const coreWords = ['人生', '時間', '瞬間', '気持ち', '心', 'もの', 'こと'];
      coreWords.forEach(word => {
        if (sentence.includes(word)) score += 1;
      });
      
      // 説教調減点
      if (sentence.includes('べき') || sentence.includes('しなさい') || sentence.includes('ダメ')) score -= 2;
      
      return score;
    };
    
    // 最も高スコアの文を選択
    let bestSentence = sentences[0];
    let bestScore = scoreSentence(sentences[0]);
    
    for (const sentence of sentences) {
      const score = scoreSentence(sentence);
      if (score > bestScore || (score === bestScore && sentence.length < bestSentence.length)) {
        bestSentence = sentence;
        bestScore = score;
      }
    }
    
    // 選択した文が長すぎる場合は要約
    if (bestSentence.length > 140) {
      // 修飾語を削除して短縮
      let shortened = bestSentence
        .replace(/でも|しかし|けれども|それでも|たぶん|きっと|やっぱり/g, '')
        .replace(/とても|すごく|めっちゃ|本当に|実は/g, '')
        .trim();
      
      if (shortened.length > 140) {
        shortened = shortened.substring(0, 137) + '...';
      }
      
      return shortened;
    }
    
    return bestSentence;
  };

  // Instagram用名言整形
  const formatQuoteForInstagram = (text: string): string => {
    const maxLength = 60;
    if (text.length <= maxLength) return text;
    
    // 改行を考慮して2行以内に収める
    const firstLine = text.substring(0, 30);
    const secondLine = text.substring(30, maxLength);
    
    return firstLine + '\n' + secondLine + (text.length > maxLength ? '...' : '');
  };


  // Xでシェア
  const shareToX = () => {
    const shareText = `「${shortenQuote(quote)}」\n🔗 ${APP_URL}\n#エッグさん #leSoleil #AIアプリ`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(twitterUrl, '_blank');
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

  // Instagram用画像生成
  const generateInstagramImage = async () => {
    if (!instagramImageRef.current || quote === "エッグさんの殻の中") return;
    
    setIsGeneratingImage(true);
    
    try {
      const canvas = await html2canvas(instagramImageRef.current, {
        backgroundColor: '#F5F5F2',
        scale: 4, // 1080x1350のため4倍スケール
        width: 270,
        height: 337.5,
        useCORS: true,
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = 'egg-quote-instagram.png';
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
          
          alert('Instagram用画像を保存しました！');
        }
      }, 'image/png');
      
    } catch (error) {
      console.error('Instagram image generation failed:', error);
      setError('画像生成に失敗しました');
    } finally {
      setIsGeneratingImage(false);
    }
  };


  return (
    <main className="min-h-screen flex flex-col items-center bg-nordic-bg" style={{minHeight: '100vh'}}>
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-gray-200/30 h-16 bg-white/70 backdrop-blur-sm">
          <div className="w-full max-w-4xl flex justify-between items-center p-3 px-5 text-sm">
            <div className="flex gap-5 items-center font-medium">
              <Link href={"/"} className="text-nordic-text hover:text-nordic-orange transition-colors">エッグさん名言ジェネレーター</Link>
            </div>
            <div className="flex items-center gap-4">
              <ThemeSwitcher />
            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl p-8 w-full">
          {/* メインアプリカード */}
          <div className="bg-white rounded-lg px-12 py-6 w-full max-w-3xl">
            {/* メイン生成エリア */}
            <div className="w-full space-y-8">
            {/* タイトル */}
            <motion.div 
              className="text-center space-y-2 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-3xl font-sans font-bold text-nordic-text">
                エッグさん名言ジェネレーター
              </h1>
              <p className="text-nordic-text/70 leading-relaxed font-sans">
                あなたのモヤモヤを言葉に。エッグさんが答えを置いていきます
              </p>
            </motion.div>

            {/* 名言表示エリア - ローディング中から登場 */}
            <AnimatePresence>
              {(isLoading || quote !== "エッグさんの殻の中") && (
                <motion.div 
                  ref={quoteRef}
                  className="rounded-lg p-12 min-h-[320px] flex flex-col justify-between relative"
                  initial={{ opacity: 0, y: 30, scale: 0.95, backgroundColor: "#ffffff" }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1,
                    backgroundColor: isLoading ? "#ffffff" : "rgba(74, 93, 35, 0.9)" // 白からオリーブ色へ
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
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nordic-orange"></div>
                    <p className="text-nordic-text/60 text-sm font-medium">エッグさんが考え中...</p>
                  </motion.div>
                ) : error ? (
                  <motion.div 
                    className="text-center w-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <p className="text-red-400 text-sm mb-2">{error}</p>
                    <p className="text-nordic-text/50 text-sm">もう一度お試しください</p>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div 
                      className="w-full px-12 pr-32"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      key={quote}
                    >
                      <p className="text-lg text-left leading-relaxed whitespace-pre-line font-sans text-white" style={{wordBreak: 'keep-all', overflowWrap: 'break-word', lineHeight: '2.0'}}>
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
              <label htmlFor="input-text" className="block text-sm font-medium text-nordic-text text-center">
                愚痴・悩み・つぶやきを入力してみて🥚
              </label>
              <textarea
                id="input-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="例：今日も仕事でイライラしてしまった..."
                className="w-full p-3 bg-nordic-input border-none rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-nordic-orange focus:ring-opacity-50 transition-all duration-200 font-sans text-nordic-text placeholder-nordic-text placeholder-opacity-50"
                rows={3}
                maxLength={200}
              />
              <div className="text-right text-xs text-nordic-text/50">
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
                    className="bg-nordic-orange hover:bg-nordic-mustard text-white font-medium py-3 px-6 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-nordic-orange focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed font-sans"
                  >
                    {isLoading ? "エッグさんが考え中..." : "エッグさんに愚痴る"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* シェアエリア - 名言生成後のみ表示 */}
            <AnimatePresence>
              {quote !== "エッグさんの殻の中" && !isLoading && !error && (
                <motion.div 
                  className="w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  {/* シェアタブUI */}
                  <div className="bg-white rounded-lg p-6 w-full mt-6">
                    {/* タブヘッダー */}
                    <div className="flex border-b border-nordic-input mb-6">
                      <button 
                        className={`flex-1 py-3 px-4 text-sm font-medium rounded-t-lg transition-all ${
                          activeTab === 'x' 
                            ? 'bg-nordic-orange text-white border-b-2 border-nordic-orange' 
                            : 'text-nordic-text hover:text-nordic-orange'
                        }`}
                        onClick={() => setActiveTab('x')}
                      >
                        <svg className="w-4 h-4 inline mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        X（短文シェア）
                      </button>
                      <button 
                        className={`flex-1 py-3 px-4 text-sm font-medium rounded-t-lg transition-all ${
                          activeTab === 'instagram' 
                            ? 'bg-nordic-mustard text-white border-b-2 border-nordic-mustard' 
                            : 'text-nordic-text hover:text-nordic-mustard'
                        }`}
                        onClick={() => setActiveTab('instagram')}
                      >
                        <svg className="w-4 h-4 inline mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.40s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        Instagram（画像）
                      </button>
                    </div>

                    {/* Xシェアタブ */}
                    {activeTab === 'x' && (
                      <div className="space-y-4">

                        {/* シェアボタン */}
                        <div className="flex gap-3">
                          <button 
                            onClick={shareToX}
                            className="w-full bg-nordic-orange hover:bg-nordic-mustard text-white py-3 px-4 rounded-md font-medium transition-all"
                          >
                            X（短文シェア）
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Instagramシェアタブ */}
                    {activeTab === 'instagram' && (
                      <div className="space-y-4">
                        {/* 画像プレビュー */}
                        <div className="bg-nordic-input/30 rounded-lg p-4">
                          <p className="text-sm text-nordic-text/60 mb-3">画像プレビュー</p>
                          <div 
                            ref={instagramImageRef}
                            className="bg-nordic-bg aspect-[4/5] rounded-lg flex flex-col justify-center items-center relative mx-auto"
                            style={{width: '270px', height: '337.5px'}}
                          >
                            {/* メインカード */}
                            <div className="bg-white rounded-lg mx-6 my-8 p-8 flex-1 flex flex-col justify-center relative">
                              {/* 名言テキスト */}
                              <p className="text-nordic-text text-center text-lg font-semibold leading-relaxed mb-8">
                                {formatQuoteForInstagram(quote)}
                              </p>
                              
                              {/* エッグさん（右下） */}
                              <div className="absolute bottom-4 right-4 w-12 h-12">
                                <img 
                                  src="/images/egg-character.png" 
                                  alt="エッグさん" 
                                  className="w-full h-full object-contain opacity-80"
                                />
                              </div>
                            </div>
                            
                            {/* フッター */}
                            <div className="text-center text-xs text-nordic-text/60 pb-4">
                              © 2025 leSoleil · Egg-san Quote Maker
                            </div>
                          </div>
                        </div>

                        {/* キャプション */}
                        <div className="bg-white rounded-md p-3 border border-nordic-input">
                          <p className="text-sm text-nordic-text/60 mb-1">キャプション例</p>
                          <p className="text-sm text-nordic-text">
                            エッグさんが、愚痴を名言にしてくれました🐣<br/>
                            使ってみる→ プロフィールのリンクから<br/>
                            #エッグさん #leSoleil #AIアプリ
                          </p>
                        </div>

                        {/* 生成・保存ボタン */}
                        <button 
                          onClick={generateInstagramImage}
                          disabled={isGeneratingImage}
                          className="w-full bg-nordic-mustard hover:bg-nordic-orange text-white py-3 px-4 rounded-md font-medium transition-all disabled:opacity-50"
                        >
                          {isGeneratingImage ? '🎨 画像生成中...' : 'Instagram（画像）'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 元に戻るボタン */}
                  <div className="text-center mt-6">
                    <button 
                      onClick={() => {
                        setQuote("エッグさんの殻の中");
                        setInputText("");
                        setError("");
                        setActiveTab('x');
                      }}
                      className="bg-nordic-orange hover:bg-nordic-mustard text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-nordic-orange focus:ring-opacity-50 font-sans text-sm"
                    >
                      もっとエッグさんに愚痴る
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>

        <motion.footer 
          className="w-full flex items-center justify-center border-t border-gray-200/30 mx-auto text-center text-xs gap-8 py-8 bg-white/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <p className="text-nordic-text/60 font-sans">
            © 2025 leSoleil. All rights reserved.
          </p>
        </motion.footer>
      </div>
    </main>
  );
}
