import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  Power,
  FileText,
  Search,
  ChevronDown,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Keyboard,
  Calculator,
  Camera,
  Trash2,
  Plus,
  AlertCircle,
  Wallet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatBengaliDate,
  toBanglaNumber,
  formatCurrency,
} from '../utils/formatters';
import { renderCategoryIcon } from '../utils/iconMap';

export const AddTransactionScreen: React.FC = () => {
  const {
    addTransaction,
    updateTransaction,
    editingTransaction,
    setEditingTransaction,
    accounts,
    categories,
    addCategory,
    setActiveTab,
    settings,
  } = useApp();

  const isEn = settings.language === 'en';

  // Basic Form States
  const [type, setType] = useState<'income' | 'expense'>(
    editingTransaction?.type === 'income' ? 'income' : 'expense'
  );
  const [amount, setAmount] = useState<string>(
    editingTransaction ? String(editingTransaction.amount) : ''
  );
  const [description, setDescription] = useState<string>(
    editingTransaction?.note || ''
  );

  // Category State
  const filteredCategories = categories.filter((c) => c.type === type);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [showCatSheet, setShowCatSheet] = useState<boolean>(false);
  const [catSearch, setCatSearch] = useState<string>('');

  // Inline Quick Add Category state
  const [isQuickAddCatOpen, setIsQuickAddCatOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatError, setNewCatError] = useState('');

  // Account State
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  // Error & validation
  const [formError, setFormError] = useState<string>('');

  // Date states
  const initialDate = editingTransaction?.date
    ? new Date(`${editingTransaction.date}T12:00:00`)
    : new Date();
  const [selectedYear, setSelectedYear] = useState<number>(initialDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(initialDate.getMonth() + 1); // 1-indexed
  const [selectedDay, setSelectedDay] = useState<number>(initialDate.getDate());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Time states
  const initialNow = new Date();
  const initialHour = initialNow.getHours();
  const [timeHour, setTimeHour] = useState<number>(initialHour % 12 || 12);
  const [timeMinute, setTimeMinute] = useState<number>(initialNow.getMinutes());
  const [timePeriod, setTimePeriod] = useState<'AM' | 'PM'>(initialHour >= 12 ? 'PM' : 'AM');
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'hour' | 'minute'>('hour');
  const [isTimeInputMode, setIsTimeInputMode] = useState<boolean>(false);

  // Receipt voucher image state
  const [receiptImage, setReceiptImage] = useState<string | null>(
    editingTransaction?.receiptImage || null
  );
  const [showReceiptPreview, setShowReceiptPreview] = useState<boolean>(false);

  // In-App Calculator keypad state
  const [showCalculator, setShowCalculator] = useState<boolean>(false);
  const [calcExpression, setCalcExpression] = useState<string>('');

  // Initialize from editingTransaction or default
  useEffect(() => {
    if (!editingTransaction) {
      const now = new Date();
      const hour = now.getHours();
      setType('expense');
      setAmount('');
      setDescription('');
      setSelectedYear(now.getFullYear());
      setSelectedMonth(now.getMonth() + 1);
      setSelectedDay(now.getDate());
      setTimeHour(hour % 12 || 12);
      setTimeMinute(now.getMinutes());
      setTimePeriod(hour >= 12 ? 'PM' : 'AM');
      setReceiptImage(null);

      // Default category for expense
      const firstExp = categories.find((c) => c.type === 'expense');
      if (firstExp) setSelectedCategoryId(firstExp.id);

      // Default account
      if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }
      return;
    }

    if (editingTransaction) {
      const txType = editingTransaction.type === 'income' ? 'income' : 'expense';
      setType(txType);
      setAmount(String(editingTransaction.amount));
      setDescription(editingTransaction.note || '');
      setSelectedCategoryId(editingTransaction.categoryId || '');
      setSelectedAccountId(editingTransaction.accountId || (accounts[0]?.id || 'acc_cash'));
      setReceiptImage(editingTransaction.receiptImage || null);

      try {
        const [y, m, d] = editingTransaction.date.split('-').map(Number);
        if (y && m && d) {
          setSelectedYear(y);
          setSelectedMonth(m);
          setSelectedDay(d);
        }
      } catch {}

      if (editingTransaction.time) {
        const timeMatch = editingTransaction.time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
        if (timeMatch) {
          setTimeHour(Math.min(12, Math.max(1, parseInt(timeMatch[1], 10) || 12)));
          setTimeMinute(Math.min(59, Math.max(0, parseInt(timeMatch[2], 10) || 0)));
          if (timeMatch[3]) {
            setTimePeriod(timeMatch[3].toUpperCase() as 'AM' | 'PM');
          }
        }
      }
    }
  }, [editingTransaction, categories, accounts]);

  // When type changes, ensure category matches the current type
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    setFormError('');
    const matching = categories.filter((c) => c.type === newType);
    const currentlySelected = categories.find((c) => c.id === selectedCategoryId);
    if (!currentlySelected || currentlySelected.type !== newType) {
      setSelectedCategoryId(matching[0]?.id || '');
    }
  };

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ||
    filteredCategories[0];
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) ||
    accounts[0];

  // Formatted date string for button display: ১৫ অক্টো, ২০২৬
  const monthNames = isEn
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রি', 'মে', 'জুন', 'জুলা', 'আগ', 'সেপ্টে', 'অক্টো', 'নভে', 'ডিসে'];
  const formatDateNumber = (value: number) =>
    isEn || !settings.useBanglaNumerals ? String(value) : toBanglaNumber(value);
  const dateDisplay = `${formatDateNumber(selectedDay)} ${monthNames[selectedMonth - 1]}, ${formatDateNumber(selectedYear)}`;
  const displayedDate = new Date(selectedYear, selectedMonth - 1, selectedDay);

  // Formatted time string for button display: ১১:৩৬ AM
  const timeDisplay = `${isEn ? String(timeHour).padStart(2, '0') : toBanglaNumber(String(timeHour).padStart(2, '0'))}:${
    isEn ? String(timeMinute).padStart(2, '0') : toBanglaNumber(String(timeMinute).padStart(2, '0'))
  } ${timePeriod}`;

  // Image Upload handler with compression
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      alert(isEn ? 'Please choose an image smaller than 12 MB.' : '১২ MB-এর কম আকারের ছবি নির্বাচন করুন।');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxDimension = 1200;
        const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) return;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.65);
        setReceiptImage(compressed);
      };
      image.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  };

  // Calculator logic
  const handleCalcPress = (val: string) => {
    if (val === 'AC') {
      setCalcExpression('');
      setAmount('');
    } else if (val === '⌫') {
      const next = calcExpression.slice(0, -1);
      setCalcExpression(next);
      try {
        if (next && !isNaN(Number(next))) {
          setAmount(next);
        }
      } catch {}
    } else if (val === '=') {
      try {
        const sanitized = calcExpression.replace(/×/g, '*').replace(/÷/g, '/');
        if (/^[0-9+\-*/.() ]+$/.test(sanitized)) {
          const tokens = sanitized.match(/(?:\d+(?:\.\d*)?|\.\d+)|[()+\-*/]/g) || [];
          if (tokens.join('') !== sanitized.replace(/\s/g, '') || tokens.length === 0) return;
          let index = 0;
          const parsePrimary = (): number => {
            const token = tokens[index++];
            if (token === '+') return parsePrimary();
            if (token === '-') return -parsePrimary();
            if (token === '(') {
              const value = parseExpression();
              if (tokens[index++] !== ')') throw new Error('Missing parenthesis');
              return value;
            }
            if (token === undefined || !/^\d+(?:\.\d*)?$|^\.\d+$/.test(token)) throw new Error('Invalid number');
            return Number(token);
          };
          const parseTerm = (): number => {
            let value = parsePrimary();
            while (tokens[index] === '*' || tokens[index] === '/') {
              const operator = tokens[index++];
              const right = parsePrimary();
              if (operator === '/' && right === 0) throw new Error('Division by zero');
              value = operator === '*' ? value * right : value / right;
            }
            return value;
          };
          const parseExpression = (): number => {
            let value = parseTerm();
            while (tokens[index] === '+' || tokens[index] === '-') {
              const operator = tokens[index++];
              const right = parseTerm();
              value = operator === '+' ? value + right : value - right;
            }
            return value;
          };
          const result = parseExpression();
          if (index !== tokens.length || !Number.isFinite(result)) throw new Error('Invalid expression');
          const formatted = String(Math.round(result * 100) / 100);
          setAmount(formatted);
          setCalcExpression(formatted);
        }
      } catch {}
    } else {
      const next = calcExpression + val;
      setCalcExpression(next);
      if (!isNaN(Number(next))) {
        setAmount(next);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const normalizedAmount = amount.trim().replace(/,/g, '');
    if (!/^(?:\d+\.?\d*|\.\d+)$/.test(normalizedAmount)) {
      setFormError(isEn ? 'Please enter a valid amount' : 'সঠিক টাকার পরিমাণ লিখুন');
      return;
    }
    const numAmount = Number(normalizedAmount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setFormError(isEn ? 'Amount must be greater than zero' : 'টাকার পরিমাণ শূন্যের চেয়ে বেশি হতে হবে');
      return;
    }

    if (!selectedCategory) {
      setFormError(isEn ? 'Please select a category' : 'অনুগ্রহ করে একটি ক্যাটাগরি নির্বাচন করুন');
      return;
    }

    if (!selectedAccount) {
      setFormError(isEn ? 'Please select an account' : 'অনুগ্রহ করে একটি অ্যাকাউন্ট নির্বাচন করুন');
      return;
    }

    const rawDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(
      selectedDay
    ).padStart(2, '0')}`;
    const rawTime = `${timeHour}:${String(timeMinute).padStart(2, '0')} ${timePeriod}`;

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        type,
        amount: numAmount,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        categoryIcon: selectedCategory.icon,
        categoryColor: selectedCategory.color,
        accountId: selectedAccount.id,
        accountName: selectedAccount.name,
        note: description.trim() || undefined,
        date: rawDate,
        time: rawTime,
        receiptImage: receiptImage || undefined,
      });
      setEditingTransaction(null);
    } else {
      addTransaction({
        type,
        amount: numAmount,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        categoryIcon: selectedCategory.icon,
        categoryColor: selectedCategory.color,
        accountId: selectedAccount.id,
        accountName: selectedAccount.name,
        date: rawDate,
        time: rawTime,
        note: description.trim() || undefined,
        receiptImage: receiptImage || undefined,
      });
    }

    setActiveTab('dashboard');
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newCatName.trim();
    if (!clean) return;

    const exists = categories.some(
      (c) => c.type === type && c.name.toLowerCase() === clean.toLowerCase()
    );
    if (exists) {
      setNewCatError(isEn ? 'Category already exists' : 'এই ক্যাটাগরি ইতিমধ্যে বিদ্যমান');
      return;
    }

    const created = addCategory({
      name: clean,
      nameEn: clean,
      type,
      icon: 'Tag',
      color: type === 'income' ? '#10b981' : '#ef4444',
    });

    setSelectedCategoryId(created.id);
    setNewCatName('');
    setNewCatError('');
    setIsQuickAddCatOpen(false);
    setShowCatSheet(false);
    setFormError('');
  };

  const handleClear = () => {
    setAmount('');
    setDescription('');
    setReceiptImage(null);
    setCalcExpression('');
    setFormError('');
  };

  const handleGoBack = () => {
    setEditingTransaction(null);
    setActiveTab('dashboard');
  };

  // Helper calculation for Date Picker calendar
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const firstDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 is Sunday
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  // Helper for analog clock dial positions
  const getClockCoordinates = (index: number, total: number, radius: number = 85) => {
    const angle = (index * (360 / total) - 90) * (Math.PI / 180);
    const x = Math.round(radius * Math.cos(angle));
    const y = Math.round(radius * Math.sin(angle));
    return { x, y };
  };

  return (
    <div className="space-y-4 pb-24 pt-1 max-w-lg mx-auto">
      {/* Top Header: ← Update / New */}
      <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="p-1 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {isEn
              ? editingTransaction
                ? 'Update Transaction'
                : 'New Transaction'
              : editingTransaction
              ? 'লেনদেন সম্পাদনা'
              : 'নতুন হিসাব এন্ট্রি'}
          </h2>
        </div>

        {!editingTransaction && (
          <div className="flex items-center gap-3 text-slate-400">
            <button
              type="button"
              onClick={handleClear}
              className="hover:text-rose-500 p-1"
              title={isEn ? 'Reset form' : 'রিসেট করুন'}
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {formError && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 px-1">
        {/* Row 1: Type Switcher: Expense | Income */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-bold text-center">
          <button
            type="button"
            onClick={() => handleTypeChange('expense')}
            className={`py-2.5 rounded-xl transition-all ${
              type === 'expense'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isEn ? 'Expense (ব্যয়)' : 'ব্যয় (Expense)'}
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('income')}
            className={`py-2.5 rounded-xl transition-all ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isEn ? 'Income (আয়)' : 'আয় (Income)'}
          </button>
        </div>

        {/* Row 2: Amount Input with Calculator */}
        <div className="space-y-2">
          <div className="relative border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-4 pt-3 pb-2.5 bg-white dark:bg-slate-900 focus-within:border-blue-500 dark:focus-within:border-blue-400 shadow-xs transition-all flex items-center justify-between">
            <label className="absolute -top-2.5 left-3 px-1.5 bg-white dark:bg-slate-900 text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {isEn ? 'Amount (৳ / BDT) *' : 'টাকার পরিমাণ (৳) *'}
            </label>
            <div className="flex items-center gap-2.5 flex-1">
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">৳</span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setFormError('');
                }}
                placeholder="0"
                className="w-full text-2xl font-black text-slate-900 dark:text-white bg-transparent focus:outline-none tracking-tight"
                required
                autoFocus
              />
            </div>
            {/* Calculator Toggle Button */}
            <button
              type="button"
              onClick={() => setShowCalculator((c) => !c)}
              className={`p-2 rounded-xl transition-colors ${
                showCalculator
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
              title={isEn ? 'Toggle Calculator Keypad' : 'ক্যালকুলেটর কিপ্যাড'}
            >
              <Calculator className="w-5 h-5" />
            </button>
          </div>

          {/* Calculator Keypad */}
          {showCalculator && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-lg space-y-2 animate-in fade-in">
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl px-3 py-2 text-right">
                <span className="text-[11px] text-slate-400 block font-mono">
                  {calcExpression || (isEn ? 'Calculate...' : 'হিসাব করুন')}
                </span>
                <span className="text-base font-bold text-slate-900 dark:text-white">
                  ৳ {amount || (isEn ? '0' : '০')}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                <button type="button" onClick={() => handleCalcPress('AC')} className="py-2.5 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100">AC</button>
                <button type="button" onClick={() => handleCalcPress('(')} className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">(</button>
                <button type="button" onClick={() => handleCalcPress(')')} className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">)</button>
                <button type="button" onClick={() => handleCalcPress('÷')} className="py-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 hover:bg-blue-100">÷</button>

                <button type="button" onClick={() => handleCalcPress('7')} className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">7</button>
                <button type="button" onClick={() => handleCalcPress('8')} className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">8</button>
                <button type="button" onClick={() => handleCalcPress('9')} className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">9</button>
                <button type="button" onClick={() => handleCalcPress('×')} className="py-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 hover:bg-blue-100">×</button>

                <button type="button" onClick={() => handleCalcPress('4')} className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">4</button>
                <button type="button" onClick={() => handleCalcPress('5')} className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">5</button>
                <button type="button" onClick={() => handleCalcPress('6')} className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">6</button>
                <button type="button" onClick={() => handleCalcPress('-')} className="py-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 hover:bg-blue-100">-</button>

                <button type="button" onClick={() => handleCalcPress('1')} className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">1</button>
                <button type="button" onClick={() => handleCalcPress('2')} className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">2</button>
                <button type="button" onClick={() => handleCalcPress('3')} className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">3</button>
                <button type="button" onClick={() => handleCalcPress('+')} className="py-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 hover:bg-blue-100">+</button>

                <button type="button" onClick={() => handleCalcPress('0')} className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">0</button>
                <button type="button" onClick={() => handleCalcPress('.')} className="py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200">.</button>
                <button type="button" onClick={() => handleCalcPress('⌫')} className="py-2.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 hover:bg-amber-100">⌫</button>
                <button type="button" onClick={() => handleCalcPress('=')} className="py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm">=</button>
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Category Selector (Requirement 1 & Requirement 5) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              {isEn ? 'Category' : 'ক্যাটাগরি নির্বাচন করুন'} *
            </label>
            <button
              type="button"
              onClick={() => {
                setShowCatSheet(true);
                setIsQuickAddCatOpen(true);
              }}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isEn ? 'New Category' : 'নতুন ক্যাটাগরি'}</span>
            </button>
          </div>

          {/* Direct Category Dropdown Selector (Requirement 5) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <select
              value={selectedCategoryId}
              onChange={(e) => {
                setSelectedCategoryId(e.target.value);
                setFormError('');
              }}
              className="w-full px-3 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              <option value="">{isEn ? '-- Select Category --' : '-- ক্যাটাগরি নির্বাচন করুন --'}</option>
              {filteredCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {isEn ? (c.nameEn || c.name) : c.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setIsQuickAddCatOpen(false);
                setShowCatSheet(true);
              }}
              className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between text-left shadow-xs hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                  style={{ backgroundColor: selectedCategory?.color || '#2563eb' }}
                >
                  {renderCategoryIcon(selectedCategory?.icon, '#ffffff')}
                </div>
                <div className="truncate">
                  <span className="text-xs font-bold text-slate-800 dark:text-white block truncate">
                    {selectedCategory ? (isEn ? (selectedCategory.nameEn || selectedCategory.name) : selectedCategory.name) : (isEn ? 'Browse Icons' : 'আইকনসহ তালিকা')}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </button>
          </div>
        </div>

        {/* Row 4: Account / Wallet Selection (Requirement 3: Cash, bKash, Nagad, Bank) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
              {isEn ? 'Account / Wallet' : 'অ্যাকাউন্ট / ওয়ালেট নির্বাচন করুন'} *
            </label>
            <span className="text-[10px] text-slate-400 font-medium">
              {type === 'income' ? (isEn ? 'Where is money received?' : 'কোথায় জমা হবে?') : (isEn ? 'Where was money spent from?' : 'কোথা থেকে খরচ হয়েছে?')}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {accounts.map((acc) => {
              const isSelected = selectedAccountId === acc.id;
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    setSelectedAccountId(acc.id);
                    setFormError('');
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-500 ring-1 ring-blue-500 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ backgroundColor: acc.color || '#2563eb' }}
                    >
                      {acc.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <span className="text-xs font-bold text-slate-800 dark:text-white block truncate">
                        {acc.name}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 block">
                        {formatCurrency(acc.currentBalance, settings.useBanglaNumerals && !isEn)}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 5: Date & Time Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setShowDatePicker(true)}
            className="py-3 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 shadow-xs hover:border-blue-400 transition-colors"
          >
            <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{dateDisplay}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTimePicker(true)}
            className="py-3 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-2 shadow-xs hover:border-blue-400 transition-colors"
          >
            <ClockIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{timeDisplay}</span>
          </button>
        </div>

        {/* Row 6: Description Input with Note Icon */}
        <div className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-3 bg-white dark:bg-slate-900 flex items-center gap-2.5 shadow-xs focus-within:ring-2 focus-within:ring-blue-500 transition-all">
          <FileText className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={isEn ? 'Description / Note (optional)' : 'বিবরণ লিখুন (ঐচ্ছিক)'}
            className="w-full text-xs text-slate-800 dark:text-slate-100 bg-transparent focus:outline-none"
          />
        </div>

        {/* Row 7: Receipt Voucher Attachment */}
        <div className="space-y-2">
          {!receiptImage ? (
            <label className="flex items-center justify-center gap-2 py-3 px-4 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:border-blue-500 cursor-pointer transition-colors shadow-xs">
              <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{isEn ? 'Attach Voucher / Receipt Photo' : 'মেমো বা ভাউচারের ছবি যুক্ত করুন'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl">
              <div
                onClick={() => setShowReceiptPreview(true)}
                className="flex items-center gap-2.5 cursor-pointer flex-1"
              >
                <img
                  src={receiptImage}
                  alt="Receipt"
                  className="w-10 h-10 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-white block">
                    {isEn ? 'Attached Voucher' : 'সংযুক্ত ভাউচার'}
                  </span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400">
                    {isEn ? 'Click to view full size' : 'বড় করে দেখতে ক্লিক করুন'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReceiptImage(null)}
                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                title={isEn ? 'Delete photo' : 'ছবি মুছুন'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Row 8: Primary Save Button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            {isEn
              ? editingTransaction
                ? 'Update Transaction'
                : 'Save Transaction'
              : editingTransaction
              ? 'আপডেট করুন'
              : 'সংরক্ষণ করুন'}
          </button>
        </div>
      </form>

      {/* Full Receipt Image Preview Modal */}
      {showReceiptPreview && receiptImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 max-w-sm w-full space-y-3 shadow-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                {isEn ? 'Voucher / Receipt Image' : 'ভাউচার / মেমোর ছবি'}
              </h4>
              <button
                type="button"
                onClick={() => setShowReceiptPreview(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={receiptImage}
              alt="Receipt Preview"
              className="w-full max-h-[60vh] object-contain rounded-2xl bg-black/5"
            />
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-800 max-w-xs w-full">
            <div className="bg-white dark:bg-slate-900 px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Select date</span>
              <div className="flex items-center justify-between mt-1">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {displayedDate.toLocaleDateString(isEn ? 'en-US' : 'bn-BD', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </h3>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {displayedDate.toLocaleString(isEn ? 'en-US' : 'bn-BD', { month: 'long', year: 'numeric' })}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMonth === 1) {
                        setSelectedMonth(12);
                        setSelectedYear(selectedYear - 1);
                      } else {
                        setSelectedMonth(selectedMonth - 1);
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedMonth === 12) {
                        setSelectedMonth(1);
                        setSelectedYear(selectedYear + 1);
                      } else {
                        setSelectedMonth(selectedMonth + 1);
                      }
                    }}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 pb-1">
                <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {calendarCells.map((d, index) => {
                  if (d === null) return <div key={`empty-${index}`} />;
                  const isSelected = d === selectedDay;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setSelectedDay(d);
                        setShowDatePicker(false);
                      }}
                      className={`h-8 w-8 mx-auto rounded-full font-semibold transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white font-bold shadow-xs'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 p-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowDatePicker(false)}
                className="px-4 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Picker Modal */}
      {showTimePicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 max-w-xs w-full space-y-4">
            <span className="text-xs text-slate-400 block font-medium">Select time</span>
            <div className="flex items-center justify-center gap-2">
              <input
                type="number"
                min={1}
                max={12}
                value={timeHour}
                onChange={(e) => setTimeHour(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                className="w-16 text-center text-3xl font-black p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl"
              />
              <span className="text-2xl font-black">:</span>
              <input
                type="number"
                min={0}
                max={59}
                value={timeMinute}
                onChange={(e) => setTimeMinute(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                className="w-16 text-center text-3xl font-black p-2 bg-slate-100 dark:bg-slate-800 rounded-2xl"
              />
              <div className="flex flex-col gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => setTimePeriod('AM')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    timePeriod === 'AM' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => setTimePeriod('PM')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold ${
                    timePeriod === 'PM' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowTimePicker(false)}
                className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Bottom Sheet (Requirement 1 & Requirement 5) */}
      {showCatSheet && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl p-5 space-y-4 max-h-[80vh] flex flex-col shadow-2xl border-t border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">
                  {type === 'income' ? (isEn ? 'Select Income Category' : 'আয় ক্যাটাগরি নির্বাচন করুন') : (isEn ? 'Select Expense Category' : 'ব্যয় ক্যাটাগরি নির্বাচন করুন')}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {isEn ? 'Only relevant categories are shown' : 'বর্তমান হিসাবের ধরনের সাথে মিল রেখে দেখানো হচ্ছে'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCatSheet(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Inline Creator Form */}
            {isQuickAddCatOpen ? (
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-200">
                    {isEn ? '+ Quick Add New Category' : '+ নতুন ক্যাটাগরি যোগ করুন'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickAddCatOpen(false);
                      setNewCatError('');
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {newCatError && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">{newCatError}</p>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      setNewCatError('');
                    }}
                    placeholder={isEn ? 'Category name' : 'ক্যাটাগরির নাম লিখুন'}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                  >
                    {isEn ? 'Save' : 'যোগ'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsQuickAddCatOpen(true)}
                className="w-full py-2.5 px-3 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-blue-200 dark:border-blue-800"
              >
                <Plus className="w-4 h-4" />
                <span>{isEn ? '+ Create New Category' : '+ নতুন ক্যাটাগরি তৈরি করুন'}</span>
              </button>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder={isEn ? 'Search categories...' : 'ক্যাটাগরি খুঁজুন...'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Categories List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {filteredCategories
                .filter((c) =>
                  c.name.toLowerCase().includes(catSearch.toLowerCase()) ||
                  (c.nameEn && c.nameEn.toLowerCase().includes(catSearch.toLowerCase()))
                )
                .map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setShowCatSheet(false);
                        setFormError('');
                      }}
                      className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-500 ring-1 ring-blue-500'
                          : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                          style={{ backgroundColor: cat.color || '#2563eb' }}
                        >
                          {renderCategoryIcon(cat.icon, '#ffffff')}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-800 dark:text-white block">
                            {isEn ? (cat.nameEn || cat.name) : cat.name}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
