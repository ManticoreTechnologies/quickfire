import { useEffect } from 'react';

const useEventListeners = (events: { type: string, listener: EventListenerOrEventListenerObject }[]) => {
  useEffect(() => {
    events.forEach(({ type, listener }) => {
      document.addEventListener(type, listener);
    });

    return () => {
      events.forEach(({ type, listener }) => {
        document.removeEventListener(type, listener);
      });
    };
  }, [events]);
};

export default useEventListeners;