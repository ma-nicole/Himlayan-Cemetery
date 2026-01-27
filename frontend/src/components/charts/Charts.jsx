import React, { useMemo } from 'react';
import './Charts.css';

// Simple Bar Chart
export const BarChart = ({
  data = [],
  height = 200,
  showValues = true,
  animate = true,
  color = 'primary',
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="chart bar-chart" style={{ height }}>
      <div className="bar-chart-container">
        {data.map((item, index) => (
          <div key={index} className="bar-column">
            <div className="bar-wrapper">
              {showValues && (
                <span className="bar-value">{item.value}</span>
              )}
              <div
                className={`bar bar-${color} ${animate ? 'animate' : ''}`}
                style={{
                  height: `${(item.value / maxValue) * 100}%`,
                  animationDelay: animate ? `${index * 0.1}s` : '0s',
                }}
              />
            </div>
            <span className="bar-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Horizontal Bar Chart
export const HorizontalBarChart = ({
  data = [],
  showValues = true,
  animate = true,
  color = 'primary',
}) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="chart horizontal-bar-chart">
      {data.map((item, index) => (
        <div key={index} className="h-bar-row">
          <span className="h-bar-label">{item.label}</span>
          <div className="h-bar-wrapper">
            <div
              className={`h-bar h-bar-${color} ${animate ? 'animate' : ''}`}
              style={{
                width: `${(item.value / maxValue) * 100}%`,
                animationDelay: animate ? `${index * 0.1}s` : '0s',
              }}
            />
            {showValues && (
              <span className="h-bar-value">{item.value}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Donut/Pie Chart
export const DonutChart = ({
  data = [],
  size = 180,
  strokeWidth = 20,
  animate = true,
  showLegend = true,
  showCenter = true,
  centerValue,
  centerLabel,
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const colors = ['primary', 'success', 'warning', 'error', 'info'];
  
  const segments = useMemo(() => {
    let currentOffset = 0;
    return data.map((item, index) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      const dashArray = (percentage / 100) * circumference;
      const dashOffset = -currentOffset;
      currentOffset += dashArray;
      
      return {
        ...item,
        percentage,
        dashArray,
        dashOffset,
        color: item.color || colors[index % colors.length],
      };
    });
  }, [data, total, circumference]);

  return (
    <div className="chart donut-chart">
      <div className="donut-container" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} className={animate ? 'animate' : ''}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--border-light, #e5e7eb)"
            strokeWidth={strokeWidth}
          />
          
          {/* Data segments */}
          {segments.map((segment, index) => (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              className={`donut-segment donut-${segment.color}`}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segment.dashArray} ${circumference - segment.dashArray}`}
              strokeDashoffset={segment.dashOffset}
              style={{
                animationDelay: animate ? `${index * 0.15}s` : '0s',
              }}
            />
          ))}
        </svg>
        
        {/* Center content */}
        {showCenter && (
          <div className="donut-center">
            <span className="donut-center-value">
              {centerValue !== undefined ? centerValue : total}
            </span>
            <span className="donut-center-label">
              {centerLabel || 'Total'}
            </span>
          </div>
        )}
      </div>
      
      {/* Legend */}
      {showLegend && (
        <div className="chart-legend">
          {segments.map((segment, index) => (
            <div key={index} className="legend-item">
              <span className={`legend-dot legend-${segment.color}`} />
              <span className="legend-label">{segment.label}</span>
              <span className="legend-value">{segment.value}</span>
              <span className="legend-percent">
                ({segment.percentage.toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Line/Area Chart
export const LineChart = ({
  data = [],
  height = 200,
  showDots = true,
  showArea = true,
  animate = true,
  color = 'primary',
}) => {
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 400; // Will be responsive via CSS
  
  const values = data.map(d => d.value);
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const points = data.map((item, index) => ({
    x: padding.left + (index / (data.length - 1 || 1)) * chartWidth,
    y: padding.top + chartHeight - ((item.value - minValue) / (maxValue - minValue || 1)) * chartHeight,
    ...item,
  }));
  
  const linePath = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');
  
  const areaPath = linePath + 
    ` L ${points[points.length - 1]?.x || 0} ${padding.top + chartHeight}` +
    ` L ${padding.left} ${padding.top + chartHeight} Z`;

  return (
    <div className="chart line-chart">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((percent, i) => {
          const y = padding.top + (chartHeight * (100 - percent) / 100);
          return (
            <g key={i}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                className="grid-line"
              />
              <text
                x={padding.left - 8}
                y={y}
                className="grid-label"
                textAnchor="end"
                dominantBaseline="middle"
              >
                {Math.round(minValue + (maxValue - minValue) * percent / 100)}
              </text>
            </g>
          );
        })}
        
        {/* Area */}
        {showArea && points.length > 1 && (
          <path
            d={areaPath}
            className={`line-area line-area-${color} ${animate ? 'animate' : ''}`}
          />
        )}
        
        {/* Line */}
        {points.length > 1 && (
          <path
            d={linePath}
            className={`line-path line-path-${color} ${animate ? 'animate' : ''}`}
            fill="none"
          />
        )}
        
        {/* Dots */}
        {showDots && points.map((point, index) => (
          <g key={index} className="line-dot-group">
            <circle
              cx={point.x}
              cy={point.y}
              r={5}
              className={`line-dot line-dot-${color}`}
            />
            <title>{`${point.label}: ${point.value}`}</title>
          </g>
        ))}
        
        {/* X-axis labels */}
        {points.map((point, index) => (
          <text
            key={index}
            x={point.x}
            y={height - 10}
            className="x-label"
            textAnchor="middle"
          >
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
};

// Progress Ring
export const ProgressRing = ({
  value = 0,
  max = 100,
  size = 120,
  strokeWidth = 10,
  color = 'primary',
  showValue = true,
  label,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const offset = circumference - percentage * circumference;

  return (
    <div className="chart progress-ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`}>
        {/* Background */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-light, #e5e7eb)"
          strokeWidth={strokeWidth}
        />
        
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={`progress-arc progress-${color}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      
      {/* Center content */}
      {showValue && (
        <div className="progress-center">
          <span className="progress-value">
            {Math.round(percentage * 100)}%
          </span>
          {label && (
            <span className="progress-label">{label}</span>
          )}
        </div>
      )}
    </div>
  );
};

// Sparkline (mini inline chart)
export const Sparkline = ({
  data = [],
  width = 100,
  height = 30,
  color = 'primary',
  showEndDot = true,
}) => {
  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data, 0);
  const range = maxValue - minValue || 1;
  
  const points = data.map((value, index) => ({
    x: (index / (data.length - 1 || 1)) * width,
    y: height - ((value - minValue) / range) * height,
  }));
  
  const path = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} width={width} height={height}>
      <path d={path} className={`sparkline-path sparkline-${color}`} fill="none" />
      {showEndDot && points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={3}
          className={`sparkline-dot sparkline-dot-${color}`}
        />
      )}
    </svg>
  );
};

// Stats Overview Card with Mini Chart
export const StatsOverviewCard = ({
  title,
  value,
  change,
  changeType = 'neutral', // 'positive', 'negative', 'neutral'
  sparklineData = [],
  icon,
}) => {
  return (
    <div className="stats-overview-card">
      <div className="stats-header">
        {icon && <span className="stats-icon">{icon}</span>}
        <span className="stats-title">{title}</span>
      </div>
      <div className="stats-body">
        <span className="stats-value">{value}</span>
        {sparklineData.length > 0 && (
          <Sparkline 
            data={sparklineData} 
            color={changeType === 'positive' ? 'success' : changeType === 'negative' ? 'error' : 'primary'}
          />
        )}
      </div>
      {change && (
        <div className={`stats-change stats-${changeType}`}>
          <span className="change-icon">
            {changeType === 'positive' ? '↑' : changeType === 'negative' ? '↓' : '→'}
          </span>
          <span>{change}</span>
        </div>
      )}
    </div>
  );
};

export default {
  BarChart,
  HorizontalBarChart,
  DonutChart,
  LineChart,
  ProgressRing,
  Sparkline,
  StatsOverviewCard,
};
