/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CreditCard,
  TrendingDown,
  TrendingUp,
  FileSpreadsheet,
  Award,
  HardDriveDownload,
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  KeyRound,
  Bell,
  School,
} from 'lucide-react';
import { SidebarTab } from '../types';

interface SidebarProps {
  notificationCount: number;
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  currentUser: { name: string; role: string; email: string };
  onManageAccount: () => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  notificationCount,
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  currentUser,
  onManageAccount,
  onLogout,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const navItems = [
    { key: 'dashboard' as SidebarTab, name: 'داشبورد', icon: LayoutDashboard },
    { key: 'notifications' as SidebarTab, name: 'اعلان‌ها', icon: Bell },
    { key: 'students' as SidebarTab, name: 'دانشجویان', icon: Users },
    { key: 'teachers' as SidebarTab, name: 'استادان', icon: GraduationCap },
    { key: 'classes' as SidebarTab, name: 'اتاق‌های درسی', icon: School },
    { key: 'courses' as SidebarTab, name: 'دوره‌ها', icon: BookOpen },
    { key: 'payments' as SidebarTab, name: 'پرداخت‌ها', icon: CreditCard },
    { key: 'expenses' as SidebarTab, name: 'مصارف', icon: TrendingDown },
    { key: 'incomes' as SidebarTab, name: 'درآمدها', icon: TrendingUp },
    { key: 'exams' as SidebarTab, name: 'آزمون‌ها', icon: FileSpreadsheet },
    { key: 'results' as SidebarTab, name: 'ثبت نمرات', icon: Award },
    { key: 'backup' as SidebarTab, name: 'بکاپ و بازیابی', icon: HardDriveDownload },
    { key: 'reports' as SidebarTab, name: 'گزارش‌گیری', icon: FileText },
  ];

  return (
    <aside
      id="sidebar"
      className={`app-sidebar fixed top-0 right-0 h-screen bg-white text-slate-800 flex flex-col border-l border-slate-200 transition-all duration-300 z-30 overflow-hidden ${isMobileOpen ? 'sidebar-mobile-open' : ''} ${
        isCollapsed ? 'w-[70px]' : 'w-[240px]'
      }`}
    >
      <div className="min-h-0 flex flex-col flex-1">
        <div
          className={`flex items-center border-b border-slate-200/80 flex-shrink-0 ${
            isCollapsed ? 'h-24 flex-col justify-center gap-2 px-2' : 'h-16 justify-between px-4'
          }`}
        >
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 animate-fade-in text-right">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shadow-blue-500/10 overflow-hidden border border-blue-100">
                <img src="./logo/navand.png" alt="Navand" className="w-full h-full object-contain p-1" />
              </div>
              <div className="text-right">
                <h1 className="font-extrabold text-blue-600 text-base leading-none">آکادمی ناوند</h1>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block mt-1">Navand Academy</span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md shadow-blue-500/10 overflow-hidden border border-blue-100">
              <img src="./logo/navand.png" alt="Navand" className="w-full h-full object-contain p-1" />
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-200 cursor-pointer"
            title={isCollapsed ? 'بازکردن منو' : 'جمع‌کردن منو'}
            aria-label={isCollapsed ? 'بازکردن منو' : 'جمع‌کردن منو'}
          >
            {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        <nav className="py-4 space-y-1 select-none overflow-y-auto flex-1 min-h-0">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => { setActiveTab(item.key); onMobileClose(); }}
                className={`w-full flex items-center gap-3.5 py-3 text-right transition-all duration-200 group relative cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : 'px-6'
                } ${
                  isActive
                    ? 'text-blue-600 bg-slate-50 border-r-4 border-blue-600 font-bold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                }`}
                title={isCollapsed ? item.name : undefined}
                aria-label={item.name}
                id={`sidebar-tab-${item.key}`}
              >
                <IconComponent className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />

                {!isCollapsed && (
                  <span className="text-[13.5px] tracking-wide grow text-right animate-fade-in">
                    {item.name}
                  </span>
                )}

                {item.key === 'notifications' && notificationCount > 0 && (
                  <span className={isCollapsed ? 'absolute top-1 left-1 rounded-full bg-yellow-200 px-1 text-xs font-bold text-yellow-900' : 'rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-900'}>
                    {new Intl.NumberFormat('fa-AF').format(notificationCount)}
                  </span>
                )}
                {isCollapsed && isActive && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-blue-600 rounded-l-md" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-3 border-t border-slate-200/80 flex-shrink-0">
        {!isCollapsed ? (
          <div className="bg-slate-50 p-2.5 rounded-xl mb-2 flex items-center gap-3 border border-slate-200/50 text-right animate-fade-in">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden grow">
              <h4 className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</h4>
              <p className="text-xs text-slate-400 truncate mt-0.5">{currentUser.email}</p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm mx-auto mb-2" title={`${currentUser.name} (${currentUser.email})`}>
            <User className="w-4 h-4" />
          </div>
        )}

        <button
          onClick={onManageAccount}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200 cursor-pointer mb-1 ${
            isCollapsed ? 'justify-center' : 'text-right'
          }`}
          title="تغییر نام کاربری و رمز"
          id="btn-change-credentials"
        >
          <KeyRound className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-xs sm:text-sm font-bold grow">تغییر رمز</span>}
        </button>

        <button
          onClick={onLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors duration-200 cursor-pointer ${
            isCollapsed ? 'justify-center' : 'text-right'
          }`}
          title="خروج از سیستم"
          id="btn-logout"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-xs sm:text-sm font-bold grow">خروج</span>}
        </button>
      </div>
    </aside>
  );
}
