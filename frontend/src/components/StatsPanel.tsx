import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import './StatsPanel.css';

interface StatsPanelProps {
  marketTicker?: string;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ marketTicker }) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (marketTicker) {
      loadStats();
      const interval = setInterval(loadStats, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [marketTicker]);

  const loadStats = async () => {
    if (!marketTicker) return;
    try {
      setLoading(true);
      const data = await apiService.getMarketStats(marketTicker, 60);
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!marketTicker) {
    return (
      <div className="stats-panel">
        <h2>Market Statistics</h2>
        <p>Select a market to view statistics</p>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="stats-panel">
        <h2>Market Statistics</h2>
        <div className="loading">Loading statistics...</div>
      </div>
    );
  }

  return (
    <div className="stats-panel">
      <h2>Market Statistics: {marketTicker}</h2>
      {stats && stats.stats && stats.stats.length > 0 ? (
        <div className="stats-grid">
          {stats.stats.map((stat: any, index: number) => (
            <div key={index} className="stat-card">
              <div className="stat-label">
                {stat.action.toUpperCase()} - {stat.side.toUpperCase()}
              </div>
              <div className="stat-value">{stat.count}</div>
              <div className="stat-details">
                <div>Total Size: {stat.total_size}</div>
                <div>Avg Price: ${stat.avg_price?.toFixed(2) || 'N/A'}</div>
                <div>
                  Range: ${stat.min_price?.toFixed(2) || 'N/A'} - ${stat.max_price?.toFixed(2) || 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No statistics available for this market</p>
      )}
    </div>
  );
};
