import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = function() { return false; };
  Element.prototype.setPointerCapture = function() { };
  Element.prototype.releasePointerCapture = function() { };
  Element.prototype.scrollIntoView = function() { };
}
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserver;
