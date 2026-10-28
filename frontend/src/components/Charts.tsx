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
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const chartData = data.length > 0 ? data : [{ month: 'بدون داده', income: 0, expense: 0 }];
  const width = Math.max(620, chartData.length * 90);
  const height = 250;
  const paddingLeft = 58;
  const paddingRight = 18;
  const paddingTop = 22;
  const paddingBottom = 38;
  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const rawMax = Math.max(...chartData.flatMap((item) => [item.income, item.expense]), 0);
  const yMax = Math.max(5000, Math.ceil(rawMax / 5000) * 5000);
  const yTicks = Array.from({ length: 5 }, (_, index) => (yMax / 4) * index);

  const getX = (index: number) =>
    chartData.length === 1 ? paddingLeft + chartWidth / 2 : paddingLeft + (chartWidth / (chartData.length - 1)) * index;
  const getY = (value: number) => paddingTop + chartHeight - (Math.max(0, value) / yMax) * chartHeight;
  const incomePoints = chartData.map((item, index) => ({ x: getX(index), y: getY(item.income) }));
  const expensePoints = chartData.map((item, index) => ({ x: getX(index), y: getY(item.expense) }));

  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    return points.reduce((path, point, index) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const previous = points[index - 1];
      const middleX = (previous.x + point.x) / 2;
      return `${path} C ${middleX} ${previous.y}, ${middleX} ${point.y}, ${point.x} ${point.y}`;
    }, '');
  };

  const incomePath = createSmoothPath(incomePoints);
  const expensePath = createSmoothPath(expensePoints);
  const baselineY = getY(0);
  const createAreaPath = (linePath: string, points: { x: number; y: number }[]) =>
    `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

  return (
    <div className="dashboard-chart-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden transition-all duration-300">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
        <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">تحلیل درآمد و مصارف آکادمی (ماهانه)</h3>
        <div className="flex gap-4 text-xs font-bold">
          <span className="flex items-center gap-1.5 text-emerald-600"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />درآمدها</span>
          <span className="flex items-center gap-1.5 text-rose-600"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" />مصارف</span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-[250px] flex items-center justify-center text-sm font-bold text-slate-400">داده‌ای برای نمایش موجود نیست</div>
      ) : (
        <div className="overflow-x-auto">
          <div style={{ minWidth: `${width}px` }}>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto font-sans text-xs" dir="ltr" role="img" aria-label="Monthly income and expense chart">
              <defs>
                <linearGradient id="income-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="expense-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.13" />
                  <stop offset="100%" stopColor="#F43F5E" stopOpacity="0" />
                </linearGradient>
              </defs>
              {yTicks.map((tick) => {
                const y = getY(tick);
                return (
                  <g key={tick}>
                    <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#E8EDF4" strokeDasharray="3 4" />
                    <text x={paddingLeft - 9} y={y + 3} textAnchor="end" className="fill-slate-400 font-mono">
                      {toPersianDigits(Math.round(tick).toLocaleString('en-US'))}
                    </text>
                  </g>
                );
              })}
              <path d={createAreaPath(incomePath, incomePoints)} fill="url(#income-area)" />
              <path d={createAreaPath(expensePath, expensePoints)} fill="url(#expense-area)" />
              <path d={incomePath} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
              <path d={expensePath} fill="none" stroke="#F43F5E" strokeWidth="2.5" strokeLinecap="round" />
              {chartData.map((item, index) => (
                <g key={`${item.month}-${index}`}>
                  <circle cx={incomePoints[index].x} cy={incomePoints[index].y} r="4" fill="#10B981" stroke="#fff" strokeWidth="2" />
                  <circle cx={expensePoints[index].x} cy={expensePoints[index].y} r="4" fill="#F43F5E" stroke="#fff" strokeWidth="2" />
                  <rect
                    x={getX(index) - Math.max(20, chartWidth / chartData.length / 2)}
                    y={paddingTop}
                    width={Math.max(40, chartWidth / chartData.length)}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    tabIndex={0}
                    aria-label={`${item.month}: ${formatCurrency(item.income)} income, ${formatCurrency(item.expense)} expenses`}
                    onFocus={() => setActivePoint(index)}
                    onBlur={() => setActivePoint(null)}
                    onMouseEnter={() => setActivePoint(index)}
                    onMouseLeave={() => setActivePoint(null)}
                  />
                  <text x={getX(index)} y={height - 12} textAnchor="middle" className="fill-slate-500 font-semibold text-xs">{item.month}</text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}
      {activePoint !== null && data[activePoint] && (
        <div className="absolute top-14 left-5 z-10 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs font-bold shadow-xl backdrop-blur-sm">
          <p className="mb-2 border-b border-slate-100 pb-2 text-slate-700">{data[activePoint].month}</p>
          <p className="text-emerald-600">درآمد: {formatCurrency(data[activePoint].income)}</p>
          <p className="mt-1 text-rose-600">مصارف: {formatCurrency(data[activePoint].expense)}</p>
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
    <div className="dashboard-chart-card bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all duration-300">
      <h3 className="font-extrabold text-slate-800 text-sm sm:text-base mb-4">توزیع دانشجویان در دوره‌ها</h3>

      {totalStudents === 0 ? (
        <div className="flex items-center justify-center h-48 text-sm text-slate-400">
          داده‌ای برای نمایش موجود نیست
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Donut Chart SVG */}
          <div className="col-span-1 md:col-span-5 flex justify-center relative">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90" role="img" aria-label="Course student distribution">
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
                    tabIndex={0}
                    aria-label={`${item.name}: ${toPersianDigits(item.count)} students`}
                    onFocus={() => setHoveredIdx(index)}
                    onBlur={() => setHoveredIdx(null)}
                    onMouseEnter={() => setHoveredIdx(index)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </svg>

            {/* Centered Total Indicator */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-extrabold text-slate-800 font-mono">
                {toPersianDigits(totalStudents)}
              </span>
              <span className="text-xs text-slate-500 font-semibold">کل دانشجویان</span>
            </div>
          </div>

          {/* Detailed Course Badges (sorted, with proportion bars) */}
          <div className="col-span-1 md:col-span-7 space-y-1.5 max-h-52 overflow-y-auto pl-1">
            {sorted.map((item, idx) => {
              const percentage = totalStudents > 0 ? (item.count / totalStudents) * 100 : 0;
              return (
                <div
                  key={idx}
                  className={`p-2 rounded-xl transition-all duration-200 border ${
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
                      <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs sm:text-xs">
                        {toPersianDigits(item.count)} نفر
                      </span>
                      <span className="text-slate-400 text-xs sm:text-xs w-9 text-left">
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
