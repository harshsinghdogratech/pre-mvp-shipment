import { useEffect } from "react";

const APP_MAIN_SELECTOR = "[data-app-shell-main]";

export function useScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const html = document.documentElement;
    const body = document.body;
    const main = document.querySelector(APP_MAIN_SELECTOR);
    const prevHtml = html.style.overflow;
    const prevBody = body.style.overflow;
    const prevHtmlOverscroll = html.style.overscrollBehaviorY;
    const prevMain =
      main instanceof HTMLElement ? main.style.overflow : undefined;
    html.style.overflow = "hidden";
    html.style.overscrollBehaviorY = "none";
    body.style.overflow = "hidden";
    if (main instanceof HTMLElement) main.style.overflow = "hidden";
    return () => {
      html.style.overflow = prevHtml;
      html.style.overscrollBehaviorY = prevHtmlOverscroll;
      body.style.overflow = prevBody;
      if (main instanceof HTMLElement && prevMain !== undefined) {
        main.style.overflow = prevMain;
      }
    };
  }, [locked]);
}
