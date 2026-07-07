/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { toPersianDigits, formatCurrency } from '../utils';

interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

interface CourseDistribution {
  name: string;
  count: number;
  color: string;
}

interface MonthlyFinanceChartProps {
  data: MonthlyData[];
}

export function MonthlyFinanceChart({ data }: MonthlyFinanceChartProps) {
  const [activeBar, setActiveBar] = useState<{ index: number; type: 'income' | 'expense' } | null>(null);

  // Layout parameters for the SVG Bar Chart
  const width = 500;
  const height = 260;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 45;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Find max value for Y-axis scaling
  const maxVal = Math.max(...data.flatMap((d) => [d.income, d.expense]), 10000000);
  const yMax = Math.ceil(maxVal / 5000000) * 5000000; // Round to nearest 5 Million

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / yMax) * chartHeight;
  };

  const getX = (index: number) => {
    return paddingLeft + (chartWidth / data.length) * index + (chartWidth / data.length) / 2;
  };

  const barWidth = 18;
  const gap = 4;

  // Label ticks
  const yTicks = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax];

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative transition-all duration-300 hover:shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-800 text-sm sm:text-base">تحلیل درآمد و مصارف آکادمی (ماهانه)</h3>
        <div className="flex gap-4 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            درآمدها
          </span>
          <span className="flex items-center gap-1.5 text-rose-600">
            <span className="w-3 h-3 rounded-full bg-rose-500"></span>
            مصارف
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[420px]">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto text-slate-400 font-sans text-[10px]" dir="ltr">
            {/* Grid Lines */}
            {yTicks.map((tick, i) => {
              const y = getY(tick);
              return (
                <g key={i} className="opacity-70">
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={width - paddingRight}
                    y2={y}
                    stroke="#E2E8F0"
                    strokeDasharray="4 4"
                    strokeWidth={1}
                  />
                  {/* Left Label in Persian format */}
                  <text
                    x={paddingLeft - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-slate-500 font-medium font-mono"
                  >
                    {tick === 0 ? '۰' : toPersianDigits((tick / 1000000).toFixed(1)) + 'M'}
                  </text>
                </g>
              );
            })}

            {/* Render Bars */}
            {data.map((d, index) => {
              const groupCenterX = getX(index);
              const incomeX = groupCenterX - barWidth - gap / 2;
              const expenseX = groupCenterX + gap / 2;

              const incomeY = getY(d.income);
              const expenseY = getY(d.expense);

              const zeroY = getY(0);

              return (
                <g key={index}>
                  {/* Income Bar (Left in group) */}
                  <rect
                    x={incomeX}
                    y={incomeY}
                    width={barWidth}
                    height={Math.max(zeroY - incomeY, 2)}
                    rx={4}
                    fill={activeBar?.index === index && activeBar?.type === 'income' ? '#059669' : '#10B981'}
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setActiveBar({ index, type: 'income' })}
                    onMouseLeave={() => setActiveBar(null)}
                  />

                  {/* Expense Bar (Right in group) */}
                  <rect
                    x={expenseX}
                    y={expenseY}
                    width={barWidth}
                    height={Math.max(zeroY - expenseY, 2)}
                    rx={4}
                    fill={activeBar?.index === index && activeBar?.type === 'expense' ? '#E11D48' : '#F43F5E'}
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setActiveBar({ index, type: 'expense' })}
                    onMouseLeave={() => setActiveBar(null)}
                  />

                  {/* X-axis Month Label */}
                  <text
                    x={groupCenterX}
                    y={height - paddingBottom + 18}
                    textAnchor="middle"
                    className="fill-slate-600 font-medium text-[11px]"
                  >
                    {d.month}
                  </text>
                </g>
              );
            })}

            {/* Base Line */}
            <line
              x1={paddingLeft}
              y1={getY(0)}
              x2={width - paddingRight}
              y2={getY(0)}
              stroke="#CBD5E1"
              strokeWidth={1}
            />
          </svg>
        </div>
      </div>

      {/* Interactive Tooltip Card */}
      {activeBar !== null && (
        <div className="absolute top-16 right-5 bg-slate-900/95 text-white p-2.5 rounded-lg text-xs shadow-lg border border-slate-800 backdrop-blur-sm z-10 pointer-events-none transition-all duration-250 animate-fade-in font-medium">
          <p className="text-slate-300 font-bold mb-1 border-b border-slate-800 pb-1 text-right">
            جزئیات {data[activeBar.index].month}
          </p>
          <div className="space-y-1 text-right">
            <p className="flex justify-between gap-4">
              <span className="text-emerald-400 font-mono">
                {formatCurrency(data[activeBar.index].income)}
              </span>
              <span>درآمد کل:</span>
            </p>
            <p className="flex justify-between gap-4">
              <span className="text-rose-400 font-mono">
                {formatCurrency(data[activeBar.index].expense)}
              </span>
              <span>مصارف کل:</span>
            </p>
            <p className="flex justify-between gap-4 border-t border-slate-700 mt-1 pt-1 font-bold">
              <span className={data[activeBar.index].income - data[activeBar.index].expense >= 0 ? 'text-emerald-400 font-mono' : 'text-rose-400 font-mono'}>
                {formatCurrency(data[activeBar.index].income - data[activeBar.index].expense)}
              </span>
              <span>سود خالص:</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

interface CourseDistributionChartProps {
  data: CourseDistribution[];
}

export function CourseDistributionChart({ data }: CourseDistributionChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Show largest courses first for a tidier, easier-to-scan layout.
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const totalStudents = sorted.reduce((sum, item) => sum + item.count, 0);

  // SVG parameters
  const size = 180;
  const radius = 65;
  const strokeWidth = 18;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = 0;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
      <h3 className="font-bold text-slate-800 text-sm sm:text-base mb-4">توزیع هنرجویان در دوره‌ها</h3>

      {totalStudents === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-slate-400">
          داده‌ای برای نمایش موجود نیست
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Donut Chart SVG */}
          <div className="col-span-1 md:col-span-5 flex justify-center relative">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="transparent"
                stroke="#E2E8F0"
                strokeWidth={strokeWidth}
              />
              {sorted.map((item, index) => {
                const percentage = totalStudents > 0 ? item.count / totalStudents : 0;
                const strokeLength = percentage * circumference;
                const strokeOffset = circumference - strokeLength;
                const strokeDashOffset = -currentAngle;

                // Increment for next loop
                currentAngle += strokeLength;

                return (
                  <circle
                    key={index}
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="transparent"
                    stroke={item.color}
                    strokeWidth={hoveredIdx === index ? strokeWidth + 4 : strokeWidth}
                    strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                    strokeDashoffset={strokeDashOffset}
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-300"
                    onMouseEnter={() => setHoveredIdx(index)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Centered Total Indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-slate-800 font-mono">
                {toPersianDigits(totalStudents)}
              </span>
              <span className="text-xs text-slate-500 font-semibold">کل هنرجویان</span>
            </div>
          </div>

          {/* Detailed Course Badges (sorted, with proportion bars) */}
          <div className="col-span-1 md:col-span-7 space-y-1.5 max-h-52 overflow-y-auto pl-1">
            {sorted.map((item, idx) => {
              const percentage = totalStudents > 0 ? (item.count / totalStudents) * 100 : 0;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl transition-all duration-250 border ${
                    hoveredIdx === idx ? 'bg-slate-50 border-slate-200' : 'border-transparent'
                  }`}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-3.5 h-3.5 rounded-full inline-block shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-bold text-slate-700 text-right truncate">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 font-mono text-xs shrink-0">
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-[10px] sm:text-xs">
                        {toPersianDigits(item.count)} نفر
                      </span>
                      <span className="text-slate-400 text-[10px] sm:text-xs w-9 text-left">
                        ({toPersianDigits(percentage.toFixed(0))}٪)
                      </span>
                    </div>
                  </div>
                  {/* Proportion bar */}
                  <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden" dir="ltr">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
