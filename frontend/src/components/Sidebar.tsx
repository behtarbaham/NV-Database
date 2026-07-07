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
  FileText,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu
} from 'lucide-react';
import { SidebarTab } from '../types';

interface SidebarProps {
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  currentUser: { name: string; role: string; email: string };
  onLogout: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isCollapsed,
  setIsCollapsed,
  currentUser,
  onLogout,
}: SidebarProps) {
  // Navigation tabs with localized Persian names, corresponding keys and icons
  const navItems = [
    { key: 'dashboard' as SidebarTab, name: 'داشبورد', icon: LayoutDashboard, badge: null },
    { key: 'students' as SidebarTab, name: 'دانش‌آموزان', icon: Users, badge: 'studentsCount' },
    { key: 'teachers' as SidebarTab, name: 'آموزگاران', icon: GraduationCap, badge: null },
    { key: 'courses' as SidebarTab, name: 'دوره‌ها', icon: BookOpen, badge: null },
    { key: 'payments' as SidebarTab, name: 'پرداخت‌ها', icon: CreditCard, badge: null },
    { key: 'expenses' as SidebarTab, name: 'مصارف', icon: TrendingDown, badge: null },
    { key: 'incomes' as SidebarTab, name: 'درآمدها', icon: TrendingUp, badge: null },
    { key: 'exams' as SidebarTab, name: 'آزمون‌ها', icon: FileSpreadsheet, badge: null },
    { key: 'results' as SidebarTab, name: 'ثبت نمرات', icon: Award, badge: null },
    { key: 'reports' as SidebarTab, name: 'گزارش‌گیری', icon: FileText, badge: null },
  ];

  return (
    <aside
      id="sidebar"
      className={`fixed top-0 right-0 h-screen bg-white text-slate-800 flex flex-col justify-between border-l border-slate-200 transition-all duration-300 z-30 ${
        isCollapsed ? 'w-[70px]' : 'w-[240px]'
      }`}
    >
      {/* Upper Logo / Title Area */}
      <div>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 animate-fade-in text-right">
              <div className="w-10 h-10 rounded-xl bg-[#1A73E8] flex items-center justify-center shadow-md shadow-blue-500/10 font-bold text-white text-lg">
                ن
              </div>
              <div className="text-right">
                <h1 className="font-extrabold text-[#1A73E8] text-base leading-none">آکادمی ناوند</h1>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mt-1">Navand Academy</span>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-[#1A73E8] flex items-center justify-center shadow-md shadow-blue-500/10 font-bold text-white text-lg mx-auto">
              ن
            </div>
          )}

          {/* Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-200 cursor-pointer"
            title={isCollapsed ? "بزرگ‌نمایی منو" : "کوچک‌نمایی منو"}
          >
            {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="py-4 space-y-1 select-none">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.key;

            return (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`w-full flex items-center gap-3.5 px-6 py-3 text-right transition-all duration-200 group relative cursor-pointer ${
                  isActive
                    ? 'text-[#1A73E8] bg-[#F5F7FA] border-r-4 border-[#1A73E8] font-bold'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50/50'
                }`}
                title={isCollapsed ? item.name : undefined}
                id={`sidebar-tab-${item.key}`}
              >
                <IconComponent className={`w-4.5 h-4.5 flex-shrink-0 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-[#1A73E8]' : 'text-slate-400 group-hover:text-slate-600'}`} />
                
                {!isCollapsed && (
                  <span className="text-[13.5px] tracking-wide grow text-right animate-fade-in">
                    {item.name}
                  </span>
                )}

                {/* Left Active indicator when collapsed */}
                {isCollapsed && isActive && (
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-[#1A73E8] rounded-l-md" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Session card and logout */}
      <div className="p-3 border-t border-slate-200/80">
        {!isCollapsed ? (
          <div className="bg-[#F5F7FA] p-2.5 rounded-xl mb-2 flex items-center gap-3 border border-slate-200/50 text-right animate-fade-in">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-[#1A73E8] font-bold text-sm">
              <User className="w-4 h-4" />
            </div>
            <div className="overflow-hidden grow">
              <h4 className="text-xs font-bold text-slate-855 truncate">{currentUser.name}</h4>
              <p className="text-[10px] text-slate-400 truncate mt-0.5">{currentUser.email}</p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-[#1A73E8] font-bold text-sm mx-auto mb-2" title={`${currentUser.name} (${currentUser.email})`}>
            <User className="w-4 h-4" />
          </div>
        )}

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
