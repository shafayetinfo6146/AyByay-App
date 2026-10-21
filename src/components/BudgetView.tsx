import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  PiggyBank,
  ChevronDown,
  Search,
  X,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  formatCurrency,
  toBanglaNumber,
  BANGLA_MONTHS,
} from '../utils/formatters';
import { BudgetItem } from '../types';

export const BudgetView: React.FC = () => {
  const {
    budgets,
    addBudget,
    deleteBudget,
    categories,
    monthlyExpense,
    selectedMonth,
    selectedYear,
    settings,
  } = useApp();

  const isEn = settings.language === 'en';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetType, setBudgetType] = useState<'percentage' | 'fixed'>('percentage');
  const [amountValue, setAmountValue] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');
  const [isCatSheetOpen, setIsCatSheetOpen] = useState(false);
  const [catSearch, setCatSearch] = useState('');
  const [period, setPeriod] = useState<'month' | 'year' | 'total'>('month');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const currentMonthName = isEn
    ? new Date(selectedYear, selectedMonth - 1).toLocaleString('en', { month: 'short' })
    : BANGLA_MONTHS[selectedMonth - 1] || 'অক্টোবর';

  const totalBudgetAmount = budgets.reduce((sum, b) => {
    return sum + (b.type === 'fixed' ? b.value : (monthlyExpense * b.value) / 100);
  }, 0);

  const remainingBudget = Math.max(0, totalBudgetAmount - monthlyExpense);

  const budgetUsage =
    totalBudgetAmount > 0
      ? Math.min(100, Math.round((monthlyExpense / totalBudgetAmount) * 100))
      : 0;

  const handleAddBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountValue);
    if (isNaN(val) || val <= 0) return;

    const cat = categories.find((c) => c.id === selectedCatId) || {
      id: 'all',
      name: isEn ? 'All Categories' : 'সকল ক্যাটাগরি',
    };

    addBudget({
      type: budgetType,
      value: val,
      categoryId: cat.id,
      categoryName: cat.name,
      month: selectedMonth,
      year: selectedYear,
    });

    setIsModalOpen(false);
    setAmountValue('');
    setSelectedCatId('');
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-24 pt-1">
      {/* 1. Main Summary Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
        {/* Segmented Pill Selector: Month | Yearly | Total */}
        <div className="bg-[#f0f3f8] dark:bg-slate-800/80 rounded-xl p-1 flex items-center text-xs font-semibold">
          <button
            onClick={() => setPeriod('month')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              period === 'month'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {currentMonthName}
          </button>
          <button
            onClick={() => setPeriod('year')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              period === 'year'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isEn ? 'Yearly' : 'বাৎসরিক'}
          </button>
          <button
            onClick={() => setPeriod('total')}
            className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
              period === 'total'
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isEn ? 'Total' : 'মোট'}
          </button>
        </div>

        {/* 3 Metric Columns: Total Budget | Spent | Remaining */}
        <div className="grid grid-cols-3 gap-2 items-center">
          {/* Total Budget */}
          <div className="text-center">
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 block mb-0.5">
              {isEn ? 'Total Budget' : 'মোট বাজেট'}
            </span>
            <span className="text-base font-bold text-blue-600 dark:text-blue-400 block truncate">
              {totalBudgetAmount > 0 ? (
                formatCurrency(totalBudgetAmount, settings.useBanglaNumerals && !isEn)
              ) : (
                settings.useBanglaNumerals && !isEn ? '০' : '0'
              )}
            </span>
          </div>

          {/* Spent */}
          <div className="text-center">
            <span className="text-xs font-semibold text-rose-500 block mb-0.5">
              {isEn ? 'Spent' : 'খরচ হয়েছে'}
            </span>
            <span className="text-base font-bold text-rose-500 block truncate">
              {monthlyExpense > 0 ? (
                formatCurrency(monthlyExpense, settings.useBanglaNumerals && !isEn)
              ) : (
                settings.useBanglaNumerals && !isEn ? '০' : '0'
              )}
            </span>
          </div>

          {/* Remaining */}
          <div className="bg-[#e4efff] dark:bg-blue-950/60 rounded-xl py-2 px-3 text-center">
            <span className="text-xs font-semibold text-[#1a73e8] dark:text-blue-400 block mb-0.5">
              {isEn ? 'Remaining' : 'অবশিষ্ট'}
            </span>
            <span className="text-base font-bold text-[#1a73e8] dark:text-blue-400 block truncate">
              {remainingBudget > 0 ? (
                formatCurrency(remainingBudget, settings.useBanglaNumerals && !isEn)
              ) : (
                settings.useBanglaNumerals && !isEn ? '০' : '0'
              )}
            </span>
          </div>
        </div>

        {/* Progress Bar & Percentage */}
        <div className="pt-1">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold mb-1">
            <span>{isEn ? 'Budget Utilization' : 'বাজেট ব্যবহার'}</span>
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {settings.useBanglaNumerals && !isEn ? toBanglaNumber(budgetUsage) : budgetUsage}%
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                budgetUsage > 90 ? 'bg-rose-500' : 'bg-blue-600'
              }`}
              style={{ width: `${Math.min(100, budgetUsage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Action Bar */}
      <div className="flex items-center justify-between px-1 relative">
        <button
          onClick={() => setIsModalOpen(true)}
          className="border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 bg-blue-50/20 hover:bg-blue-50/80 rounded-xl px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <span className="text-sm leading-none font-bold">+</span>
          <span>{isEn ? 'Add Budget' : 'নতুন বাজেট'}</span>
        </button>

        <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500">
          <button
            onClick={() => setShowSearchBar((s) => !s)}
            className={`hover:text-slate-600 dark:hover:text-slate-300 transition-colors ${
              showSearchBar ? 'text-blue-600 dark:text-blue-400' : ''
            }`}
            title={isEn ? 'Search' : 'সার্চ'}
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowMenu((m) => !m)}
            className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title={isEn ? 'Menu' : 'মেনু'}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-1 top-10 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 w-48 text-xs font-semibold animate-in fade-in">
            <button
              onClick={() => {
                setShowMenu(false);
                setIsModalOpen(true);
              }}
              className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 text-slate-700 dark:text-slate-200"
            >
              <Plus className="w-4 h-4 text-slate-400" />
              <span>{isEn ? 'Add New Budget' : 'নতুন বাজেট যোগ'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Search Input Bar */}
      {showSearchBar && (
        <div className="relative px-1 animate-in fade-in">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isEn ? 'Filter by category...' : 'ক্যাটাগরি অনুযায়ী খুঁজুন...'}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            autoFocus
          />
        </div>
      )}

      {/* 2. Content / Empty State */}
      {budgets.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <div className="text-slate-300 dark:text-slate-600 mb-3">
            <svg
              className="w-16 h-16"
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M38 20c0-6.6-5.4-12-12-12-5.7 0-10.4 4-11.7 9.3L8 20v8l6.3 2.7C16 34 20.7 36 26 36c6.6 0 12-5.4 12-12v-4z" />
              <path d="M22 8v4" />
              <circle cx="32" cy="18" r="1.5" />
            </svg>
          </div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {isEn ? 'No budget set for this period' : 'কোন বাজেট নেই'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {isEn ? 'Click the + button to create a category budget' : 'নিচের + বাটন ক্লিক করে বাজেট যোগ করুন'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {budgets.map((b) => (
            <div
              key={b.id}
              className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 shadow-xs flex items-center justify-between"
            >
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                  {b.categoryName}
                </h4>
                <p className="text-[10px] text-slate-400">
                  {b.type === 'percentage'
                    ? isEn
                      ? `${b.value}% of total monthly expense`
                      : `বাজেটের ${b.value}%`
                    : isEn
                    ? `Fixed budget ৳${b.value}`
                    : `নির্দিষ্ট বাজেট ৳${b.value}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {b.type === 'percentage' ? `${b.value}%` : `৳${b.value}`}
                </span>
                <button
                  onClick={() => deleteBudget(b.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg"
                  title={isEn ? 'Delete Budget' : 'মুছুন'}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#1877f2] hover:bg-blue-600 active:scale-95 text-white shadow-xl shadow-blue-500/30 flex items-center justify-center transition-all focus:outline-none"
        title={isEn ? 'Add Budget' : 'নতুন বাজেট যোগ করুন'}
        aria-label="Add budget"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>

      {/* 3. Add Budget Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white text-center">
              {isEn ? 'Add New Budget' : 'নতুন বাজেট যোগ করুন'}
            </h3>

            {/* Switcher: Percentage (%) | Fixed (৳) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setBudgetType('percentage')}
                className={`py-1.5 rounded-lg transition-all ${
                  budgetType === 'percentage'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {isEn ? 'Percentage (%)' : 'পার্সেন্টেজ (%)'}
              </button>
              <button
                type="button"
                onClick={() => setBudgetType('fixed')}
                className={`py-1.5 rounded-lg transition-all ${
                  budgetType === 'fixed'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {isEn ? 'Fixed Amount (৳)' : 'ফিক্সড টাকা (৳)'}
              </button>
            </div>

            {/* Input */}
            <div>
              <input
                type="number"
                step="any"
                value={amountValue}
                onChange={(e) => setAmountValue(e.target.value)}
                placeholder={
                  budgetType === 'percentage'
                    ? isEn
                      ? 'Percentage (e.g. 25)'
                      : 'পার্সেন্টেজ (%)'
                    : isEn
                    ? 'Amount in BDT (e.g. 5000)'
                    : 'টাকার পরিমাণ (৳)'
                }
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Category Dropdown */}
            <div>
              <button
                type="button"
                onClick={() => setIsCatSheetOpen(true)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between"
              >
                <span>
                  {categories.find((c) => c.id === selectedCatId)?.name || (isEn ? 'Choose Category' : 'ক্যাটাগরি বেছে নিন')}
                </span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Actions: Cancel | Add */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                {isEn ? 'Cancel' : 'বাতিল'}
              </button>
              <button
                type="button"
                onClick={handleAddBudgetSubmit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                {isEn ? 'Add' : 'অ্যাড'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Bottom Sheet */}
      {isCatSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-t-3xl p-5 space-y-4 max-h-[70vh] flex flex-col shadow-2xl border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white">
                {isEn ? 'Select Category' : 'ক্যাটাগরি বেছে নিন'}
              </h4>
              <button
                onClick={() => setIsCatSheetOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={catSearch}
                onChange={(e) => setCatSearch(e.target.value)}
                placeholder={isEn ? 'Search category...' : 'ক্যাটাগরি খুঁজুন...'}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCatId(cat.id);
                    setIsCatSheetOpen(false);
                  }}
                  className="w-full py-2.5 text-left text-xs font-medium text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: cat.color || '#3b82f6' }}
                    />
                    <span>{cat.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {cat.type === 'expense' ? (isEn ? 'Expense' : 'ব্যয়') : (isEn ? 'Income' : 'আয়')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
