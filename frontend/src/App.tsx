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
  
  // Get WebSocket URL from environment or use default
  const wsUrl = import.meta.env.VITE_WS_URL || 
    (import.meta.env.VITE_API_URL 
      ? import.meta.env.VITE_API_URL.replace('http', 'ws').replace('/api', '')
      : 'ws://localhost:3001');
  
  const { orderFlows: realtimeOrderFlows, isConnected } = useWebSocket(wsUrl);

  // Combine real-time and historical order flows, removing duplicates by order_id
  const orderFlowMap = new Map<string, any>();
  
  // Add historical first (they're more complete)
  historicalOrderFlows.forEach(flow => {
    const key = flow.order_id || `${flow.timestamp}-${flow.market_ticker}-${flow.side}-${flow.action}-${flow.price}`;
    if (!orderFlowMap.has(key)) {
      orderFlowMap.set(key, flow);
    }
  });
  
  // Add real-time, overwriting if duplicate
  realtimeOrderFlows.forEach(flow => {
    const key = flow.order_id || `${flow.timestamp}-${flow.market_ticker}-${flow.side}-${flow.action}-${flow.price}`;
    orderFlowMap.set(key, flow);
  });
  
  const allOrderFlows = Array.from(orderFlowMap.values())
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 500);

  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        const data = await apiService.getOrderFlows(100, selectedMarket);
        setHistoricalOrderFlows(data);
      } catch (error) {
        console.error('Failed to load historical data:', error);
      }
    };

    loadHistoricalData();
    const interval = setInterval(loadHistoricalData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [selectedMarket]);

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
        <h1>Kalshi Order Flow Monitor</h1>
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
