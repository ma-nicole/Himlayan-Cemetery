import React, { useEffect, useState, useRef } from 'react';
import './StatCard.css';

const StatCard = ({
  title,
  value,
  icon,
  trend,
  trendValue,
  color = 'primary',
  animated = true,
  onClick,
  loading = false,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef(null);

  // Animate number counting up
  useEffect(() => {
    if (!animated || loading || !isVisible) {
      setDisplayValue(value);
      return;
    }

    const duration = 1000;
    const steps = 60;
    const stepTime = duration / steps;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, animated, isVisible, loading]);

  // Intersection Observer for visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const formatValue = (val) => {
    if (typeof val !== 'number') return val;
    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return val.toLocaleString();
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  return (
    <div
      ref={cardRef}
      className={`stat-card-modern stat-card-${color} ${onClick ? 'clickable' : ''} ${isVisible ? 'visible' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {loading ? (
        <div className="stat-card-loading">
          <div className="skeleton-icon" />
          <div className="skeleton-text" />
          <div className="skeleton-value" />
        </div>
      ) : (
        <>
          <div className="stat-card-header">
            <span className="stat-card-icon">{icon}</span>
            {trend && (
              <span className={`stat-card-trend trend-${trend}`}>
                {getTrendIcon()} {trendValue}
              </span>
            )}
          </div>
          <div className="stat-card-body">
            <h3 className="stat-card-title">{title}</h3>
            <div className="stat-card-value">{formatValue(displayValue)}</div>
          </div>
          <div className="stat-card-decoration" />
        </>
      )}
    </div>
  );
};

export default StatCard;
