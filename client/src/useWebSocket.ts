import { useEffect, useRef } from 'react';

const useWebSocket = (url: string, onMessage: (event: MessageEvent) => void) => {
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    ws.onmessage = onMessage;

    ws.onclose = () => {
      console.log('Disconnected from WebSocket server');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [url, onMessage]);

  return wsRef;
};

export default useWebSocket;