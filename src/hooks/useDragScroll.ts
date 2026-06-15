'use client';

import { useEffect, useRef } from 'react';

/** 가로 스크롤 컨테이너를 마우스 드래그로 이동 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const dragState = useRef({
    isDown: false,
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      dragState.current = {
        isDown: true,
        startX: event.pageX,
        scrollLeft: element.scrollLeft,
        moved: false,
      };
      element.style.cursor = 'grabbing';
      element.style.userSelect = 'none';
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!dragState.current.isDown) return;
      event.preventDefault();
      const delta = event.pageX - dragState.current.startX;
      if (Math.abs(delta) > 4) {
        dragState.current.moved = true;
      }
      element.scrollLeft = dragState.current.scrollLeft - delta;
    };

    const stopDrag = () => {
      if (!dragState.current.isDown) return;
      dragState.current.isDown = false;
      element.style.cursor = '';
      element.style.userSelect = '';
    };

    element.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDrag);
    element.addEventListener('mouseleave', stopDrag);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      element.removeEventListener('mouseleave', stopDrag);
    };
  }, []);

  const wasDragging = () => dragState.current.moved;

  return { ref, wasDragging };
}
