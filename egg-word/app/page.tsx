"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [quote, setQuote] = useState<string>("エッグさんの殻の中");
  const [inputText, setInputText] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [nextCharacter, setNextCharacter] = useState<'egg' | 'ufuufu'>('egg'); // 次に使用するキャラクター
  const [respondedCharacter, setRespondedCharacter] = useState<'egg' | 'ufuufu'>('egg'); // 現在表示されているレスポンスをしたキャラクター
  const [currentImage, setCurrentImage] = useState<number>(1); // 1 or 2 for alternating images
  const [bgColor, setBgColor] = useState<string>('#A3B18A'); // 名言背景色
  const quoteRef = useRef<HTMLDivElement>(null);
  

  // 文字変換処理
  const convertText = (text: string) => {
    return text.replace(/私/g, 'わたし');
  };

  // プロ仕様禁則処理・追い込み機能（イラスト領域回避対応）
  const formatQuoteText = (text: string) => {
    if (!text || text === "エッグさんの殻の中") {
      return text;
    }
    
    let formatted = text;
    
    // === Phase 1: 基本改行処理 ===
    // 1. 句点・感嘆符・疑問符の後の接続詞改行
    formatted = formatted.replace(/([。！？])\s*(でも|しかし|けれども|それでも|そして|また|ただし|ただ|ところが|なぜなら|つまり|だから|それに|一方|他方|さらに|むしろ|例えば|特に|あのね|それから|きっと)/g, '$1\n$2');
    
    // 2. 助詞での文脈改行（文字数調整済み）
    formatted = formatted.replace(/([^。！？\n]{18,28}?)([、はがをにでと])(\s*)([^。！？、はがをにでと\n])/g, '$1$2\n$4');
    
    // 3. 動詞・形容詞活用での改行
    formatted = formatted.replace(/([^。！？\n]{18,28}?)(する|した|なる|なった|ある|あった|いる|いた|れる|られる|せる|させる)(\s*)([^。！？\n])/g, '$1$2\n$4');
    
    // 4. 接続表現での改行
    formatted = formatted.replace(/([^。！？\n]{12,})(という|から|けど|のに|ても|でも|だって|なので|ので|として|にも|まで)(\s*)([^。！？\n])/g, '$1$2\n$4');
    
    // 5. 読点での改行（調整済み）
    formatted = formatted.replace(/([^。！？\n]{18,32}?)([、])(\s*)([^。！？\n])/g, '$1$2\n$4');
    
    // === Phase 2: 高度禁則処理（修正版） ===
    // 行頭に来てはいけない文字を前の行末に移動
    const kinsokuChars = ['。', '、', '！', '？', '‼', '⁇', '‥', '…', '々', '〆', '）', '】', '〕', '｝', '〉', '》', '」', '』', '〙', '〛', '〗', 'ゝ', 'ゞ', 'ー', '・', '：', '；'];
    
    // 改行後に禁則文字がある場合、前の行に移動
    for (const char of kinsokuChars) {
      // エスケープ処理
      const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(.)\n(${escapedChar})`, 'g');
      formatted = formatted.replace(regex, '$1$2\n');
    }
    
    // 行末に来てはいけない文字を次の行に移動
    const gyomatsuKinsoku = ['（', '【', '〔', '｛', '〈', '《', '「', '『', '〖', '〘', '〚', '〓'];
    for (const char of gyomatsuKinsoku) {
      const escapedChar = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedChar})\n`, 'g');
      formatted = formatted.replace(regex, '\n$1');
    }
    
    // === Phase 3: 追い込み処理 + スマホ禁則強化 ===
    let lines = formatted.split('\n').map(line => line.trim());
    
    // まず行頭禁則文字の処理（確実に実行）
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      const prevLine = lines[i - 1];
      
      // 行頭が禁則文字で始まる場合、前の行に統合
      if (currentLine.match(/^[。、！？‼⁇‥…々〆）】〕｝〉》」』〙〛〗ゝゞー・：；]/)) {
        // スマホ対応：統合後が40文字以内なら統合実行
        if (prevLine.length + currentLine.length <= 40) {
          lines[i - 1] = prevLine + currentLine;
          lines.splice(i, 1);
          i--; // インデックス調整
        } else {
          // 統合できない場合、禁則文字1文字だけを前の行に移動
          const firstChar = currentLine.charAt(0);
          const remainingText = currentLine.substring(1);
          if (remainingText.length > 0) {
            lines[i - 1] = prevLine + firstChar;
            lines[i] = remainingText;
          } else {
            lines[i - 1] = prevLine + currentLine;
            lines.splice(i, 1);
            i--;
          }
        }
      }
    }
    
    // 短い行を前の行に統合（追い込み）
    for (let i = lines.length - 1; i >= 1; i--) {
      const currentLine = lines[i];
      const prevLine = lines[i - 1];
      
      // 短い行（8文字以下）は前の行に追い込む
      if (currentLine.length <= 8 && prevLine.length + currentLine.length <= 35) {
        lines[i - 1] = prevLine + currentLine;
        lines.splice(i, 1);
      }
      // 中途半端な行（10-15文字）も条件が合えば追い込む
      else if (currentLine.length <= 15 && prevLine.length + currentLine.length <= 32 && !currentLine.match(/[。！？]/)) {
        lines[i - 1] = prevLine + currentLine;
        lines.splice(i, 1);
      }
    }
    
    // === Phase 4: 最下行イラスト回避処理（強化版） ===
    if (lines.length > 0) {
      const lastLine = lines[lines.length - 1];
      const targetLength = 10; // イラスト回避のための最大文字数
      
      if (lastLine.length > targetLength) {
        // 高優先度区切り位置（自然な切れ目）
        const highPriorityBreaks = [
          /([。！？])/g,
          /([、])/g,
          /([はがをにでと])/g,
        ];
        
        // 中優先度区切り位置
        const midPriorityBreaks = [
          /(という|から|けど|のに|ても|でも|だって|なので|ので)/g,
          /(する|した|なる|なった|ある|いる)/g,
        ];
        
        // 低優先度区切り位置（最後の手段）
        const lowPriorityBreaks = [
          /([の|が|を|に|で|と|は|も|や|か|よ|ね])/g,
        ];
        
        let bestBreak = null;
        let bestScore = -1;
        
        // 高優先度から順に最適な分割点を探す
        for (const breaks of [highPriorityBreaks, midPriorityBreaks, lowPriorityBreaks]) {
          for (const regex of breaks) {
            const matches = [...lastLine.matchAll(regex)];
            
            for (const match of matches) {
              const splitIndex = (match.index || 0) + match[1].length;
              const beforeSplit = lastLine.substring(0, splitIndex);
              const afterSplit = lastLine.substring(splitIndex);
              
              // 分割後の最終行が目標文字数以内で、分割前行が適度な長さ
              if (afterSplit.length <= targetLength && beforeSplit.length >= 8) {
                const score = calculateBreakScore(beforeSplit, afterSplit, regex, breaks);
                if (score > bestScore) {
                  bestScore = score;
                  bestBreak = { beforeSplit, afterSplit, splitIndex };
                }
              }
            }
          }
          // 高優先度で見つかったら他は試さない
          if (bestBreak) break;
        }
        
        // 最適な分割点が見つかった場合、分割実行
        if (bestBreak) {
          lines[lines.length - 1] = bestBreak.beforeSplit;
          lines.push(bestBreak.afterSplit);
        }
      }
    }
    
    // === Phase 5: 最終調整・禁則確認 ===
    // 空行除去
    lines = lines.filter(line => line.length > 0);
    
    // 最終的な禁則処理の確認（保険処理）
    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i];
      if (currentLine.match(/^[。、！？]/)) {
        const prevLine = lines[i - 1];
        // 1文字だけ移動できる場合
        if (prevLine.length + 1 <= 35) {
          const firstChar = currentLine.charAt(0);
          const remainingText = currentLine.substring(1);
          lines[i - 1] = prevLine + firstChar;
          if (remainingText.length > 0) {
            lines[i] = remainingText;
          } else {
            lines.splice(i, 1);
            i--;
          }
        }
      }
    }
    
    return lines.join('\n');
  };

  // 分割点の品質スコア計算
  const calculateBreakScore = (before: string, after: string, regex: RegExp, breakGroup: RegExp[]) => {
    let score = 0;
    
    // 優先度による基本スコア
    if (breakGroup === [/([。！？])/g, /([、])/g, /([はがをにでと])/g]) score += 100; // 高優先度
    else if (breakGroup.length === 2) score += 50; // 中優先度
    else score += 20; // 低優先度
    
    // 分割バランスのスコア
    const totalLength = before.length + after.length;
    const ratio = before.length / totalLength;
    if (ratio >= 0.6 && ratio <= 0.8) score += 30; // 理想的なバランス
    else if (ratio >= 0.5 && ratio <= 0.9) score += 15;
    
    // 最終行の短さスコア（短いほど高得点）
    score += (10 - after.length) * 5;
    
    // 句読点で終わるボーナス
    if (after.match(/[。！？]$/)) score += 25;
    
    return score;
  };





  const generateQuote = async (retryCount = 0) => {
    setIsLoading(true);
    setError("");
    
    // 今回使用するキャラクターを決定
    const characterToUse = nextCharacter;
    console.log('Character using this time:', characterToUse);
    
    try {
      // タイムアウト設定（7秒）
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputText, character: characterToUse }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setQuote(data.text);
        
        // レスポンスしたキャラクターを記録
        setRespondedCharacter(characterToUse);
        console.log('Response character set to:', characterToUse);
        
        // 名言背景色をランダム選択
        const bgColors = ['#A3B18A', '#D7C7E3', '#E6D9C2'];
        const randomBgColor = bgColors[Math.floor(Math.random() * bgColors.length)];
        setBgColor(randomBgColor);
        console.log('Quote background color:', randomBgColor);
        
        // 現在のキャラクター（レスポンスしたキャラクター）に応じた表示設定
        if (characterToUse === 'egg') {
          // エッグさん用：画像を交互に切り替え
          setCurrentImage(prev => {
            const newImage = prev === 1 ? 2 : 1;
            console.log('Egg image switching:', prev, '->', newImage);
            return newImage;
          });
        }
        
        // 次回用にキャラクターを切り替え
        const newNextCharacter = characterToUse === 'egg' ? 'ufuufu' : 'egg';
        setNextCharacter(newNextCharacter);
        console.log('Next character will be:', newNextCharacter);
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
    <main className="min-h-screen flex flex-col items-center bg-feminine-bg">
      <div className="flex-1 w-full flex flex-col items-center">

        <div className="flex-1 flex flex-col items-center justify-center max-w-4xl p-1 sm:p-2 md:p-3 lg:p-4 w-full">
          {/* メインアプリカード */}
          <div className="bg-white rounded-lg px-3 py-3 sm:px-4 sm:py-4 md:px-5 md:py-4 lg:px-6 lg:py-5 w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl">
            {/* メイン生成エリア */}
            <div className="w-full space-y-3 sm:space-y-4 flex-1 flex flex-col">
            {/* タイトル */}
            <motion.div 
              className="text-center space-y-1 sm:space-y-2 mt-1 sm:mt-2 md:mt-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl font-rounded font-bold text-feminine-pink whitespace-nowrap">
                エッグさん名言ジェネレーター
              </h1>
              <p className="text-sm sm:text-base text-feminine-text/70 leading-relaxed font-rounded px-2 sm:px-0">
                あなたのモヤモヤに、小さなアートを。
              </p>
            </motion.div>

            {/* 名言表示エリア - ローディング中から登場 */}
            <div className="flex-1 flex flex-col justify-center">
            <AnimatePresence>
              {(isLoading || quote !== "エッグさんの殻の中") && (
                <motion.div 
                  ref={quoteRef}
                  className="rounded-md px-4 py-4 sm:px-6 sm:py-6 md:py-7 lg:py-8 min-h-[140px] sm:min-h-[160px] md:min-h-[170px] lg:min-h-[180px] flex flex-col justify-center relative speech-bubble mb-14 sm:mb-16"
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0, 
                    scale: 1
                  }}
                  style={{
                    backgroundColor: isLoading ? "#ffffff" : bgColor,
                    '--speech-tail-color': isLoading ? "#ffffff" : bgColor
                  } as React.CSSProperties}
                  exit={{ opacity: 0, y: -30, scale: 0.95 }}
                  transition={{ 
                    duration: 0.6, 
                    type: "spring", 
                    stiffness: 100
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
                    <p className="text-feminine-text/60 text-sm font-medium">考え中</p>
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
                      className="w-full text-left"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      key={quote}
                    >
                      <div className="flex justify-center">
                        <div className="text-left px-2 sm:px-3 md:px-4 w-full max-w-full">
                          <p className={`text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed whitespace-pre-line font-rounded ${bgColor === '#A3B18A' ? 'text-white' : 'text-gray-700'}`} style={{
                            wordBreak: 'keep-all', 
                            overflowWrap: 'break-word', 
                            lineHeight: '1.7', 
                            hangingPunctuation: 'force-end',
                            lineBreak: 'strict',
                            wordWrap: 'break-word'
                          }}>
                            {convertText(formatQuoteText(quote))}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
              
              {/* キャラアイコン（右下吹き出しエリア外） - 名言生成後のみ表示 */}
              <AnimatePresence>
                {quote !== "エッグさんの殻の中" && !isLoading && !error && (
                  <motion.div 
                    className="absolute -bottom-12 right-2 w-16 h-16 sm:-bottom-14 sm:right-4 sm:w-20 sm:h-20 md:-bottom-16 md:right-6 md:w-20 md:h-20 lg:w-24 lg:h-24 z-10"
                    initial={{ opacity: 0, scale: 0.5, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.4, delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <img 
                      src={(() => {
                        const imageSrc = respondedCharacter === 'egg' ? `/images/egg-character${currentImage}.png` : '/images/ufuufu-character1.png';
                        console.log('Image display - respondedCharacter:', respondedCharacter, ', imageSrc:', imageSrc);
                        return imageSrc;
                      })()}
                      alt={respondedCharacter === 'egg' ? 'エッグさん' : 'ウフウフ'} 
                      className="w-full h-full object-contain drop-shadow-sm"
                      style={{
                        transform: respondedCharacter === 'ufuufu' ? 'scale(2)' : 'scale(1)'
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 入力フィールド */}
            <motion.div 
              className="space-y-2 sm:space-y-3 flex-shrink-0 px-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <label htmlFor="input-text" className="block text-xs sm:text-sm font-medium text-feminine-text text-center font-rounded">
                愚痴・悩み・つぶやきを入力してみて🥚
              </label>
              <textarea
                id="input-text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="例：今日も仕事でイライラしてしまった..."
                className="w-full p-3 sm:p-4 bg-feminine-input border-none rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-feminine-pink focus:ring-opacity-50 transition-all duration-200 font-rounded text-feminine-text placeholder-feminine-text placeholder-opacity-50 text-sm sm:text-base"
                rows={3}
                maxLength={200}
                readOnly={quote !== "エッグさんの殻の中" && !error}
                disabled={quote !== "エッグさんの殻の中" && !error}
              />
              <div className="text-right text-xs text-feminine-text/50 pr-1">
                {inputText.length}/200文字
              </div>
            </motion.div>

            {/* 生成ボタン - 名言生成前かつローディング中でない時のみ表示 */}
            <AnimatePresence>
              {quote === "エッグさんの殻の中" && !isLoading && (
                <motion.div 
                  className="text-center mt-2 sm:mt-3"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <button 
                    onClick={() => generateQuote()}
                    disabled={inputText.trim().length === 0}
                    className="bg-feminine-pink hover:bg-feminine-pink-hover text-white font-medium py-2 px-4 sm:py-3 sm:px-6 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-feminine-pink focus:ring-opacity-50 disabled:cursor-not-allowed font-rounded text-sm sm:text-base"
                  >
                    愚痴る
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 元に戻るボタン - 名言生成後のみ表示 */}
            <AnimatePresence>
              {quote !== "エッグさんの殻の中" && !isLoading && !error && (
                <motion.div 
                  className="text-center mt-3 sm:mt-4"
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
                      // キャラクター状態は維持（交代を継続）
                      console.log('Reset - keeping character alternation, next:', nextCharacter);
                    }}
                    className="bg-feminine-pink hover:bg-feminine-pink-hover text-white font-medium py-2 px-4 sm:py-3 sm:px-6 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-feminine-pink focus:ring-opacity-50 font-rounded text-sm sm:text-base"
                  >
                    もう一回
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </div>
        </div>

        <motion.footer 
          className="w-full flex flex-col items-center justify-center border-t border-gray-200/30 mx-auto text-center gap-3 sm:gap-4 py-6 sm:py-8 md:py-10 bg-white/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 1 }}
        >
          <p className="text-feminine-text/60 font-rounded text-sm sm:text-base">
            © 2025 leSoleil / Eggsan · https://egg-word.vercel.app/
          </p>
          <p className="text-feminine-text/60 font-rounded text-sm sm:text-base">
            スクショして#エッグさんで投稿してね
          </p>
        </motion.footer>
      </div>
    </main>
  );
}
