import React, { useState, useEffect } from 'react';
import { apiService, Market } from '../services/api';
import './MarketSelector.css';

interface MarketSelectorProps {
  onMarketSelect: (ticker: string) => void;
  selectedMarket?: string;
}

export const MarketSelector: React.FC<MarketSelectorProps> = ({
  onMarketSelect,
  selectedMarket,
}) => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMarkets();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMarkets = async () => {
    try {
      setLoading(true);
      const data = await apiService.getMarkets(100);
      setMarkets(data);
    } catch (error) {
      console.error('Failed to load markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMarkets = markets.filter(
    (market) =>
      market.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      market.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="market-selector">
      <div className="selector-header">
        <h2>Markets</h2>
        <input
          type="text"
          placeholder="Search markets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      {loading ? (
        <div className="loading">Loading markets...</div>
      ) : (
        <div className="markets-list">
          {filteredMarkets.map((market) => (
            <div
              key={market.ticker}
              className={`market-item ${selectedMarket === market.ticker ? 'selected' : ''}`}
              onClick={() => onMarketSelect(market.ticker)}
            >
              <div className="market-ticker">
                <code>{market.ticker}</code>
              </div>
              <div className="market-title">{market.title || 'No title'}</div>
              {market.yes_bid && market.yes_ask && (
                <div className="market-prices">
                  <span className="price yes">
                    YES: ${market.yes_bid.toFixed(2)} / ${market.yes_ask.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
