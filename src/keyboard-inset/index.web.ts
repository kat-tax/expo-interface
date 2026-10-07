import type {RefObject} from 'react';
import type {View} from 'react-native';
import {useEffect, useState} from 'react';

/**
 * Web: how much of the view the on-screen keyboard covers, read from the
 * visual viewport, which a phone's browser shrinks to what the keyboard
 * leaves: the part of the view inside the page's viewport that the visual
 * one no longer shows. Zero with no on-screen keyboard, and where the
 * browser has no visual viewport.
 */
export function useKeyboardInset(ref: RefObject<View | null>): number {
  const [inset, setInset] = useState(0);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return undefined;
    const measure = () => {
      // A react-native-web view's ref is its DOM element.
      const element = ref.current as unknown as HTMLElement | null;
      if (!element) return;
      const bottom = Math.min(element.getBoundingClientRect().bottom, window.innerHeight);
      setInset(Math.max(0, Math.round(bottom - (viewport.offsetTop + viewport.height))));
    };
    viewport.addEventListener('resize', measure);
    viewport.addEventListener('scroll', measure);
    return () => {
      viewport.removeEventListener('resize', measure);
      viewport.removeEventListener('scroll', measure);
    };
  }, [ref]);
  return inset;
}
