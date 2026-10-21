import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus,
  Trash2,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { TransactionType } from '../types';
import {
  getTodayString,
  getCurrentTimeString,
  formatCurrency,
  toBanglaNumber,
} from '../utils/formatters';
import { renderCategoryIcon } from '../utils/iconMap';

export const AddTransactionModal: React.FC = () => {
  const {
    isAddTxOpen,
    setIsAddTxOpen,
    editingTransaction,
    setEditingTransaction,
    categories,
    accounts,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    transferBetweenAccounts,
    addCategory,
    settings,
    setActiveTab,
  } = useApp();

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [accountId, setAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayString());
  const [time, setTime] = useState<string>(getCurrentTimeString());
  const [note, setNote] = useState<string>('');
  const [person, setPerson] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isQuickCatOpen, setIsQuickCatOpen] = useState<boolean>(false);
  const [newCatInput, setNewCatInput] = useState<string>('');
  const [newCatError, setNewCatError] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setCategoryId(editingTransaction.categoryId);
      setAccountId(editingTransaction.accountId);
      setToAccountId(editingTransaction.toAccountId || '');
      setDate(editingTransaction.date);
      setTime(editingTransaction.time);
      setNote(editingTransaction.note || '');
      setPerson(editingTransaction.person || '');
      setError('');
    } else {
      setAmount('');
      setDate(getTodayString());
      setTime(getCurrentTimeString());
      setNote('');
      setPerson('');
      setError('');
      setShowDeleteConfirm(false);

      if (accounts.length > 0 && !accountId) {
        setAccountId(accounts[0].id);
      }
      if (accounts.length > 1 && !toAccountId) {
        setToAccountId(accounts[1].id);
      }
    }
  }, [editingTransaction, isAddTxOpen, accounts]);

  const filteredCategories = categories.filter((cat) => cat.type === type);
  useEffect(() => {
    if (!editingTransaction && type !== 'transfer') {
      const match = filteredCategories[0];
      if (match) {
        setCategoryId(match.id);
      }
    }
  }, [type, editingTransaction, categories]);

  if (!isAddTxOpen) return null;

  const handleClose = () => {
    setIsAddTxOpen(false);
    setEditingTransaction(null);
    setShowDeleteConfirm(false);
  };

  const handleQuickAdd = (value: number) => {
    const current = parseFloat(amount) || 0;
    setAmount(String(current + value));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন');
      return;
    }

    if (!accountId) {
      setError('অনুগ্রহ করে একটি অ্যাকাউন্ট নির্বাচন করুন');
      return;
    }

    const selectedAcc = accounts.find((a) => a.id === accountId);
    if (!selectedAcc) {
      setError('অ্যাকাউন্ট পাওয়া যায়নি');
      return;
    }

    if (type === 'transfer') {
      if (!toAccountId || toAccountId === accountId) {
        setError('অনুগ্রহ করে ভিন্ন একটি প্রাপক অ্যাকাউন্ট নির্বাচন করুন');
        return;
      }
      const toAcc = accounts.find((a) => a.id === toAccountId);
      if (!toAcc) {
        setError('প্রাপক অ্যাকাউন্ট পাওয়া যায়নি');
        return;
      }

      if (editingTransaction) {
        updateTransaction(editingTransaction.id, {
          type: 'transfer',
          amount: numAmount,
          accountId,
          accountName: selectedAcc.name,
          toAccountId,
          toAccountName: toAcc.name,
          date,
          time,
          note: note.trim() || 'অ্যাকাউন্ট স্থানান্তর',
        });
      } else {
        transferBetweenAccounts(
          accountId,
          toAccountId,
          numAmount,
          date,
          time,
          note.trim() || 'অ্যাকাউন্ট স্থানান্তর'
        );
      }
      handleClose();
      return;
    }

    const selectedCat = categories.find((c) => c.id === categoryId);
    if (!selectedCat) {
      setError('অনুগ্রহ করে একটি ক্যাটাগরি নির্বাচন করুন');
      return;
    }

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, {
        type,
        amount: numAmount,
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        categoryIcon: selectedCat.icon,
        categoryColor: selectedCat.color,
        accountId: selectedAcc.id,
        accountName: selectedAcc.name,
        date,
        time,
        note: note.trim() || undefined,
        person: person.trim() || undefined,
      });
    } else {
      addTransaction({
        type,
        amount: numAmount,
        categoryId: selectedCat.id,
        categoryName: selectedCat.name,
        categoryIcon: selectedCat.icon,
        categoryColor: selectedCat.color,
        accountId: selectedAcc.id,
        accountName: selectedAcc.name,
        date,
        time,
        note: note.trim() || undefined,
        person: person.trim() || undefined,
      });
    }

    handleClose();
  };

  const handleDelete = () => {
    if (editingTransaction) {
      deleteTransaction(editingTransaction.id);
      handleClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Grab Handle for clean minimal mobile feel */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Minimal Header */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-800 dark:text-white">
            {editingTransaction ? 'লেনদেন সম্পাদনা' : 'নতুন হিসাব এন্ট্রি'}
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {/* Segmented Type Switcher */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setError('');
              }}
              className={`py-1.5 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                type === 'expense'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              ব্যয়
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setError('');
              }}
              className={`py-1.5 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              আয়
            </button>
            <button
              type="button"
              onClick={() => {
                setType('transfer');
                setError('');
              }}
              className={`py-1.5 px-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${
                type === 'transfer'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              স্থানান্তর
            </button>
          </div>

          {/* Large Minimal Amount Input */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              টাকার পরিমাণ (Amount) *
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xl font-bold text-slate-400">
                ৳
              </span>
              <input
                type="number"
                step="any"
                inputMode="decimal"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                placeholder="0"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xl font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            {/* Quick Chips */}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {[100, 500, 1000, 2000, 5000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleQuickAdd(val)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300 font-medium"
                >
                  +{settings.useBanglaNumerals ? toBanglaNumber(val) : val}
                </button>
              ))}
            </div>
          </div>

          {/* Transfer Accounts */}
          {type === 'transfer' ? (
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">
                  উৎস (From) *
                </label>
                <select
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-medium text-slate-500 mb-1">
                  গন্তব্য (To) *
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="">নির্বাচন করুন</option>
                  {accounts
                    .filter((a) => a.id !== accountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <>
              {/* Category Grid */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-500">
                    ক্যাটাগরি *
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsQuickCatOpen(!isQuickCatOpen)}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3 h-3" />
                    {isQuickCatOpen ? 'বাতিল' : 'নতুন ক্যাটাগরি'}
                  </button>
                </div>

                {isQuickCatOpen && (
                  <div className="mb-2 p-2.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1.5 animate-in fade-in">
                    {newCatError && (
                      <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">{newCatError}</p>
                    )}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCatInput}
                        onChange={(e) => {
                          setNewCatInput(e.target.value);
                          setNewCatError('');
                        }}
                        placeholder="ক্যাটাগরির নাম লিখুন"
                        className="flex-1 px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const clean = newCatInput.trim();
                          if (!clean) return;
                          const exists = categories.some((c) => c.type === type && c.name.toLowerCase() === clean.toLowerCase());
                          if (exists) {
                            setNewCatError('এই ক্যাটাগরি ইতিমধ্যে আছে');
                            return;
                          }
                          const created = addCategory({
                            name: clean,
                            nameEn: clean,
                            type: type === 'income' ? 'income' : 'expense',
                            icon: 'Tag',
                            color: type === 'income' ? '#10b981' : '#ef4444',
                          });
                          setCategoryId(created.id);
                          setNewCatInput('');
                          setNewCatError('');
                          setIsQuickCatOpen(false);
                          setError('');
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-xs hover:bg-blue-700"
                      >
                        যোগ
                      </button>
                    </div>
                  </div>
                )}

                {/* Explicit Category Dropdown Selector (Requirement 5) */}
                <div className="mb-2">
                  <select
                    value={categoryId}
                    onChange={(e) => {
                      setCategoryId(e.target.value);
                      setError('');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                  >
                    <option value="">-- ক্যাটাগরি নির্বাচন করুন --</option>
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({type === 'income' ? 'আয়' : 'ব্যয়'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-50/60 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                  {filteredCategories.map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategoryId(cat.id);
                          setError('');
                        }}
                        className={`p-1.5 rounded-lg text-center flex flex-col items-center transition-all ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800 ring-2 ring-blue-500 shadow-xs'
                            : 'hover:bg-white/60 dark:hover:bg-slate-800/40 opacity-80'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white mb-0.5"
                          style={{ backgroundColor: cat.color }}
                        >
                          {renderCategoryIcon(cat.icon, 'w-3.5 h-3.5', '#ffffff')}
                        </div>
                        <span className="text-[10px] font-medium text-slate-700 dark:text-slate-200 line-clamp-1">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Account Selector with live balances */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  অ্যাকাউন্ট *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {accounts.map((acc) => {
                    const isSelected = accountId === acc.id;
                    return (
                      <button
                        key={acc.id}
                        type="button"
                        onClick={() => setAccountId(acc.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-left border text-xs flex items-center justify-between ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="truncate">
                          <span className="truncate block font-semibold">{acc.name}</span>
                          <span className="text-[10px] text-slate-400 block">
                            ৳ {settings.useBanglaNumerals ? toBanglaNumber(acc.currentBalance) : acc.currentBalance}
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Date & Time Row */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">
                তারিখ
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-slate-500 mb-1">
                সময়
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-[10px] font-medium text-slate-500 mb-1">
              নোট বা বিবরণ (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="যেমন: দুপুরের নাস্তা, যাতায়াত..."
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>

          {error && (
            <div className="p-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Delete Confirm */}
          {showDeleteConfirm && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 rounded-xl space-y-2">
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                মুছে ফেলতে চান?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1 bg-rose-600 text-white rounded-md text-xs font-bold"
                >
                  হ্যাঁ, মুছুন
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded-md text-xs"
                >
                  বাতিল
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="pt-1 flex items-center gap-2">
            {editingTransaction && !showDeleteConfirm && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2.5 text-rose-600 bg-rose-50 dark:bg-rose-950/40 rounded-xl hover:bg-rose-100"
                title="মুছে ফেলুন"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editingTransaction ? 'সংরক্ষণ করুন' : 'যোগ করুন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
