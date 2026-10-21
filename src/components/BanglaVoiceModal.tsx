import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, X, Check, Sparkles, ArrowRight, AlertCircle, RefreshCw, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { getTodayString, getCurrentTimeString, formatCurrency } from '../utils/formatters';
import { Capacitor } from '@capacitor/core';
import { SpeechRecognition as CapSpeechRecognition } from '@capacitor-community/speech-recognition';

interface BanglaVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BanglaVoiceModal: React.FC<BanglaVoiceModalProps> = ({ isOpen, onClose }) => {
  const { addTransaction, categories, accounts, settings } = useApp();
  const isEn = settings.language === 'en';

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [parsedType, setParsedType] = useState<'income' | 'expense'>('expense');
  const [parsedAmount, setParsedAmount] = useState<number | null>(null);
  const [parsedCategory, setParsedCategory] = useState<string>(isEn ? 'Food & Dining' : 'খাবার ও পানীয়');
  const [feedback, setFeedback] = useState<string>('');
  const [hasMicPermission, setHasMicPermission] = useState<boolean | null>(null);
  const [success, setSuccess] = useState(false);

  const webRecognitionRef = useRef<any>(null);

  // Common samples for quick testing
  const samples = isEn
    ? [
        'Bus fare 60 taka',
        'Grocery market 850 taka',
        'Tuition fee received 4000 taka',
        'Lunch 120 taka',
        'Monthly salary 35000 taka',
      ]
    : [
        'রিকশা ভাড়া ৬০ টাকা',
        'কাঁচাবাজারে খরচ ৮৫০ টাকা',
        'টিউশন ফি পেলাম ৪০০০ টাকা',
        'দুপুরের খাবার ১২০ টাকা',
        'মাসিক বেতন পেলাম ৩৫০০০ টাকা',
      ];

  // Helper to convert Bangla numbers to regular digits
  const parseDigits = (str: string): number | null => {
    const banglaToEnglish: Record<string, string> = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    };
    const normalized = str.replace(/[০-৯]/g, (d) => banglaToEnglish[d] || d);
    const match = normalized.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : null;
  };

  const analyzeSpeech = (text: string) => {
    if (!text || !text.trim()) return;
    const cleanText = text.trim();
    setTranscript(cleanText);
    setManualInput(cleanText);

    // 1. Determine Type
    const isIncome = /আয়|বেতন|পেলাম|লাভ|উপহার|জমা|বোনাস|বিকাশ পেলাম|টাকা আসলো|salary|income|received|earn|bonus/i.test(cleanText);
    const txType: 'income' | 'expense' = isIncome ? 'income' : 'expense';
    setParsedType(txType);

    // 2. Extract Amount
    const amt = parseDigits(cleanText);
    setParsedAmount(amt);

    // 3. Match Category
    let matchedCat = txType === 'income' ? (isEn ? 'Salary & Income' : 'মাসিক বেতন') : (isEn ? 'Food & Dining' : 'খাবার ও পানীয়');
    if (/রিকশা|বাস|ভাড়া|গাড়ি|উবার|সিএনজি|পাঠাও|ট্রেন|টিকেট|যাতায়াত|bus|fare|rickshaw|uber|transport|cng|ticket/i.test(cleanText)) {
      matchedCat = isEn ? 'Transportation' : 'যাতায়াত ও ভাড়া';
    } else if (/বাজার|শাকসবজি|মাছ|মাংস|মুদি|চাল|ডাল|তৈল|কাঁচাবাজার|grocery|bazaar|market|vegetable|meat/i.test(cleanText)) {
      matchedCat = isEn ? 'Groceries & Market' : 'বাজার খরচ';
    } else if (/খাবার|হোটেল|রেস্তোরাঁ|নাস্তা|চা|কফি|বিরিয়ানি|বার্গার|lunch|dinner|breakfast|tea|coffee|snack|restaurant|food/i.test(cleanText)) {
      matchedCat = isEn ? 'Food & Dining' : 'খাবার ও পানীয়';
    } else if (/বিল|কারেন্ট|বিদ্যুৎ|ইন্টারনেট|গ্যাস|পানি|ওয়াইফাই|bill|wifi|electricity|gas|water|utility/i.test(cleanText)) {
      matchedCat = isEn ? 'Bills & Utilities' : 'ইউটিলিটি ও বিল';
    } else if (/ওষুধ|ডাক্তার|হাসপাতাল|ফার্মেসি|ট্যাবলেট|medicine|doctor|pharmacy|hospital/i.test(cleanText)) {
      matchedCat = isEn ? 'Medical & Healthcare' : 'চিকিৎসা ও ওষুধ';
    } else if (/শপিং|জামাকাপড়|জুতা|পোশাক|shopping|clothes|dress|shoes/i.test(cleanText)) {
      matchedCat = isEn ? 'Shopping & Apparel' : 'কেনাকাটা';
    }

    setParsedCategory(matchedCat);

    if (amt) {
      setFeedback(
        isEn
          ? `Detected: ${txType === 'income' ? 'Income' : 'Expense'} ৳${amt} (${matchedCat})`
          : `শনাক্ত হয়েছে: ${txType === 'income' ? 'আয়' : 'ব্যয়'} ${amt} ৳ (${matchedCat})`
      );
    } else {
      setFeedback(
        isEn
          ? 'Recognized text, but could not detect an amount. E.g. "Lunch 120 taka"'
          : 'কথা বুঝতে পেরেছি, কিন্তু টাকার সংখ্যা পাওয়া যায়নি। যেমন বলুন: "দুপুরের খাবার ১২০ টাকা"'
      );
    }
  };

  // Stop listening helper
  const stopListening = async () => {
    setIsListening(false);
    if (Capacitor.isNativePlatform()) {
      try {
        await CapSpeechRecognition.stop();
      } catch {
        // Ignore
      }
    } else if (webRecognitionRef.current) {
      try {
        webRecognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
  };

  const startListening = async () => {
    if (isListening) {
      await stopListening();
      return;
    }

    setFeedback(isEn ? 'Preparing microphone...' : 'মাইক্রোফোন প্রস্তুত হচ্ছে...');

    // 1. Native Android (Capacitor APK) Flow
    if (Capacitor.isNativePlatform()) {
      try {
        // Request / check native permission
        const permStatus = await CapSpeechRecognition.requestPermissions();
        if (permStatus.speechRecognition !== 'granted') {
          setHasMicPermission(false);
          setIsListening(false);
          setFeedback(
            isEn
              ? 'Microphone permission denied. Please allow microphone in Android Settings.'
              : 'মাইক্রোফোন পারমিশন পাওয়া যায়নি। ফোনের সেটিংস থেকে Ay Byay অ্যাপের মাইক্রোফোন চালু করুন।'
          );
          return;
        }

        setHasMicPermission(true);

        const avail = await CapSpeechRecognition.available();
        if (!avail.available) {
          setIsListening(false);
          setFeedback(
            isEn
              ? 'Speech service not found on device. You can type or use sample below.'
              : 'ফোনে গুগল ভয়েস সার্ভিস পাওয়া যায়নি। নিচে লিখে বা নমুনা সিলেক্ট করতে পারেন।'
          );
          return;
        }

        setIsListening(true);
        setFeedback(isEn ? 'Listening... Speak now' : 'বলুন... শুনছি');

        // Start native Android Speech Recognizer with popup UI (Google Voice bottom sheet)
        const result = await CapSpeechRecognition.start({
          language: isEn ? 'en-US' : 'bn-BD',
          maxResults: 2,
          prompt: isEn ? 'Say e.g. "Lunch 150 taka"' : 'মুখে বলুন যেমন: "দুপুরের খাবার ১৫০ টাকা"',
          partialResults: false,
          popup: true,
        });

        setIsListening(false);

        if (result && result.matches && result.matches.length > 0) {
          analyzeSpeech(result.matches[0]);
        } else {
          setFeedback(isEn ? 'No speech detected. Try again.' : 'কোনো কথা পাওয়া যায়নি, আবার বলুন।');
        }
        return;
      } catch (err: any) {
        setIsListening(false);
        console.warn('Native speech recognition failed:', err);
        setFeedback(
          isEn
            ? 'Voice recognition error. Please check mic permissions.'
            : 'ভয়েস শনাক্তে সমস্যা হয়েছে। ফোনের অ্যাপ সেটিংসে মাইক্রোফোন পারমিশন চেক করুন।'
        );
        return;
      }
    }

    // 2. Web Browser / PWA Flow (SpeechRecognition or webkitSpeechRecognition)
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      // Browser lacks Web Speech API (e.g. certain in-app webviews)
      setIsListening(false);
      setFeedback(
        isEn
          ? 'Browser does not support direct voice API. You can type or use keyboard mic.'
          : 'এই ব্রাউজারে সরাসরি ভয়েস সাপোর্ট নেই। কিবোর্ডের মাইক্রোফোন বা নিচের বক্সে টাইপ করুন।'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognitionClass();
      webRecognitionRef.current = recognition;
      recognition.lang = isEn ? 'en-US' : 'bn-BD';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setFeedback(isEn ? 'Listening... Speak now' : 'বলুন... স্পষ্ট করে শুনছি');
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        analyzeSpeech(text);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        const errType = event.error || '';
        if (errType === 'not-allowed') {
          setHasMicPermission(false);
          setFeedback(
            isEn
              ? 'Microphone blocked. Please grant microphone permission.'
              : 'মাইক্রোফোন পারমিশন দেওয়া হয়নি। ব্রাউজার বা অ্যাপের সেটিংসে পারমিশন দিন।'
          );
        } else if (errType === 'no-speech') {
          setFeedback(isEn ? 'No speech detected. Please speak louder.' : 'কোনো কথা শোনা যায়নি। আবার চেষ্টা করুন।');
        } else {
          setFeedback(
            isEn
              ? `Voice error (${errType || 'unknown'}). You can type or click samples below.`
              : 'মাইক্রোফোন চালু করা যায়নি। নিচে লিখে বা নমুনা বাটনে ক্লিক করুন।'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      console.warn('SpeechRecognition start failed:', err);
      setFeedback(
        isEn
          ? 'Could not start microphone. Try typing or sample prompts.'
          : 'মাইক্রোফোন চালু করা যায়নি। নিচের বক্সে টাইপ করুন।'
      );
    }
  };

  // Cleanup on unmount or close
  useEffect(() => {
    return () => {
      if (webRecognitionRef.current) {
        try {
          webRecognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setTranscript('');
      setManualInput('');
      setParsedAmount(null);
      setFeedback(
        isEn
          ? 'Tap the blue mic button and speak in Bangla or English.'
          : 'নীল মাইক্রোফোন বাটনে চাপ দিয়ে বাংলায় বা ইংরেজিতে বলুন।'
      );
    } else {
      stopListening();
    }
  }, [isOpen]);

  const handleConfirmAdd = () => {
    if (!parsedAmount || parsedAmount <= 0) return;

    const cat = categories.find((c) => c.name === parsedCategory) || categories[0];
    const acc = accounts[0];

    addTransaction({
      type: parsedType,
      amount: parsedAmount,
      categoryId: cat ? cat.id : 'cat_food',
      categoryName: parsedCategory,
      accountId: acc ? acc.id : 'acc_cash',
      accountName: acc ? acc.name : isEn ? 'Cash' : 'নগদ',
      date: getTodayString(),
      time: getCurrentTimeString(),
      note: transcript || (parsedType === 'income' ? (isEn ? 'Voice Income' : 'ভয়েস আয়') : (isEn ? 'Voice Expense' : 'ভয়েস ব্যয়')),
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1200);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      analyzeSpeech(manualInput);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl space-y-4 border border-slate-100 dark:border-slate-800 text-center my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-1.5 text-left">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white">
                {isEn ? 'Smart Voice Entry' : 'স্মার্ট ভয়েস এন্ট্রি'}
              </h3>
              <p className="text-[10px] text-slate-400">
                {isEn ? 'AI Speech to Transaction' : 'মুখে বলে স্বয়ংক্রিয় হিসাব যোগ'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopListening();
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title={isEn ? 'Close' : 'বন্ধ করুন'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pulsating Microphone Button */}
        <div className="py-2 flex flex-col items-center justify-center">
          <div className="relative">
            {isListening && (
              <span className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping" />
            )}
            <button
              type="button"
              onClick={startListening}
              className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 ${
                isListening
                  ? 'bg-rose-500 ring-8 ring-rose-200 dark:ring-rose-950/80 animate-pulse'
                  : 'bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 ring-4 ring-blue-100 dark:ring-blue-950/60'
              }`}
            >
              {isListening ? <Mic className="w-9 h-9" /> : <Mic className="w-9 h-9" />}
            </button>
          </div>

          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-3">
            {isListening
              ? isEn ? 'Listening... Speak now' : 'শুনছি... কথা বলুন'
              : isEn ? 'Tap to Speak' : 'মাইক্রোফোনে চাপ দিয়ে কথা বলুন'}
          </p>

          {/* Feedback message */}
          {feedback && (
            <p
              className={`text-[11px] mt-1 px-3 py-1 rounded-full transition-all ${
                isListening
                  ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300 font-semibold animate-pulse'
                  : feedback.includes('শনাক্ত') || feedback.includes('Detected')
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold'
                  : hasMicPermission === false
                  ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-medium'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {feedback}
            </p>
          )}

          {hasMicPermission === false && (
            <div className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-950/30 p-2 rounded-xl text-left flex items-start gap-1.5 border border-amber-200/50 dark:border-amber-900/40">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {isEn
                  ? 'Microphone blocked: On Android, go to Settings → Apps → Ay Byay → Permissions → Allow Microphone.'
                  : 'টিপস: অ্যান্ড্রয়েড ফোন সেটিংসে গিয়ে Apps → Ay Byay → Permissions থেকে Microphone Allow করে দিন।'}
              </span>
            </div>
          )}
        </div>

        {/* Live Transcript / Result Card */}
        {transcript && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-left space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">{isEn ? 'Detected Speech:' : 'আপনার কথা:'}</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[70%]">
                "{transcript}"
              </span>
            </div>

            {parsedAmount ? (
              <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800 shadow-2xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">{isEn ? 'Category' : 'শনাক্ত ক্যাটাগরি'}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">
                    {parsedCategory}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">{isEn ? 'Amount' : 'পরিমাণ'}</span>
                  <span
                    className={`text-sm font-bold ${
                      parsedType === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {parsedType === 'income' ? '+' : '-'} {formatCurrency(parsedAmount, settings.useBanglaNumerals && !isEn)}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Direct text / Voice-type Input Fallback */}
        <form onSubmit={handleManualSubmit} className="relative flex items-center">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder={isEn ? 'Or type/speak with keyboard mic...' : 'বা কিবোর্ডের মাইক দিয়ে এখানে বলুন/লিখুন...'}
            className="w-full pl-3 pr-10 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/50"
          />
          <button
            type="submit"
            disabled={!manualInput.trim()}
            className="absolute right-1.5 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-all"
            title={isEn ? 'Analyze text' : 'শনাক্ত করুন'}
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Sample Prompts */}
        <div className="space-y-1.5 text-left pt-1">
          <span className="text-[10px] font-bold text-slate-400 block">
            {isEn ? 'Or click sample to test:' : 'বা নিচের উদাহরণে চাপ দিয়ে পরীক্ষা করুন:'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {samples.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => analyzeSpeech(s)}
                className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/40 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Confirm Action Button */}
        {parsedAmount && (
          <button
            type="button"
            onClick={handleConfirmAdd}
            disabled={success}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 mt-2"
          >
            {success ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>{isEn ? 'Recorded successfully!' : 'সফলভাবে যুক্ত হয়েছে!'}</span>
              </>
            ) : (
              <>
                <span>{isEn ? 'Save as Transaction' : 'লেনদেন হিসেবে যুক্ত করুন'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
