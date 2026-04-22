import { useState, useEffect } from 'react';
import { getQueue } from '../services/api';
import QueueCard from '../components/QueueCard';

export default function Queue() {
  const [queueData, setQueueData] = useState({ preparing: [], serving: [], total_active: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    loadQueue();
    const interval = setInterval(loadQueue, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const response = await getQueue();
      setQueueData(response.data.data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to load queue:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="queue-page" id="queue-page">
      <div className="container">
        <div className="page-header animate-fade-in-up">
          <h1 className="page-title">Order Queue</h1>
          <p className="page-subtitle">
            {loading ? 'Loading active orders...' : `${queueData.total_active} active order${queueData.total_active !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <div className="queue-loading-shimmer" style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div className="shimmer-card" style={{ height: '200px', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-xl)', animation: 'shimmer 2s infinite linear' }}></div>
          </div>
        ) : (
          <div className="queue-columns">
            <div className="queue-column animate-fade-in-up delay-1">
              <div className="queue-column-header">
                <span className="dot dot-preparing"></span>
                Preparing ({queueData.preparing.length})
              </div>
              {queueData.preparing.length === 0 ? (
                <div className="queue-empty">No orders being prepared</div>
              ) : (
                queueData.preparing.map((order) => (
                  <QueueCard key={order.id} order={order} />
                ))
              )}
            </div>

            <div className="queue-column animate-fade-in-up delay-2">
              <div className="queue-column-header">
                <span className="dot dot-serving"></span>
                Now Serving ({queueData.serving.length})
              </div>
              {queueData.serving.length === 0 ? (
                <div className="queue-empty">No orders ready</div>
              ) : (
                queueData.serving.map((order) => (
                  <QueueCard key={order.id} order={order} />
                ))
              )}
            </div>
          </div>
        )}

        <div className="queue-refresh">
          {loading ? 'Fetching latest data...' : `Auto-refreshing every 5 seconds • Last updated: ${lastUpdated?.toLocaleTimeString() || 'Just now'}`}
        </div>
      </div>
    </div>
  );
}
