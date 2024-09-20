import { useEffect, useRef } from 'react';

const useAnimation = (callback: () => void) => {
  const requestRef = useRef<number>();

  const animate = () => {
    callback();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current!);
  }, []);
};

export default useAnimation;