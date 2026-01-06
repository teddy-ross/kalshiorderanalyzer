import React, { useState, useEffect } from 'react';
import { OrderFlowTable } from './components/OrderFlowTable';
import { MarketSelector } from './components/MarketSelector';
import { StatsPanel } from './components/StatsPanel';
import { useWebSocket } from './hooks/useWebSocket';
import { apiService } from './services/api';
import './App.css';

function App() {
  const [selectedMarket, setSelectedMarket] = useState<string | undefined>();
  const [historicalOrderFlows, setHistoricalOrderFlows] = useState<any[]>([]);
  const { orderFlows: realtimeOrderFlows, isConnected } = useWebSocket(
    'ws://localhost:3001'
  );

  // Combine real-time and historical order flows
  const allOrderFlows = [...realtimeOrderFlows, ...historicalOrderFlows]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 500);

  useEffect(() => {
    loadHistoricalData();
    const interval = setInterval(loadHistoricalData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [selectedMarket]);

  const loadHistoricalData = async () => {
    try {
      const data = await apiService.getOrderFlows(100, selectedMarket);
      setHistoricalOrderFlows(data);
    } catch (error) {
      console.error('Failed to load historical data:', error);
    }
  };

  const handleMarketSelect = async (ticker: string) => {
    setSelectedMarket(ticker);
    try {
      await apiService.addMarketToMonitor(ticker);
    } catch (error) {
      console.error('Failed to add market to monitor:', error);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>📊 Kalshi Order Flow Monitor</h1>
        <div className="status-indicator">
          <span
            className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`}
          />
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </header>

      <main className="app-main">
        <div className="sidebar">
          <MarketSelector
            onMarketSelect={handleMarketSelect}
            selectedMarket={selectedMarket}
          />
        </div>

        <div className="content">
          <StatsPanel marketTicker={selectedMarket} />
          <OrderFlowTable orderFlows={allOrderFlows} />
        </div>
      </main>
    </div>
  );
}

export default App;
