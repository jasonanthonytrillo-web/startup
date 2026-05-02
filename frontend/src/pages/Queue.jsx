import { useState, useEffect } from 'react';
import { getQueue } from '../services/api';
import QueueCard from '../components/QueueCard';

export default function Queue() {
  const [queueData, setQueueData] = useState({ preparing: [], serving: [], total_active: 0 });
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    // Try to load from session cache for instant display
    const cachedQueue = sessionStorage.getItem('cached_queue_data');
    if (cachedQueue) {
      setQueueData(JSON.parse(cachedQueue));
      setLoading(false);

    }

    loadQueue();
    const interval = setInterval(loadQueue, 10000); // Poll every 10 seconds to save server resources
    return () => clearInterval(interval);
  }, []);

  const loadQueue = async () => {
    try {
      const response = await getQueue();
      const newData = response.data.data;
      setQueueData(newData);

      
      // Cache for next time
      sessionStorage.setItem('cached_queue_data', JSON.stringify(newData));
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


      </div>
    </div>
  );
}
