import React from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import App from './App';

// Mock global fetch to prevent network errors during test
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)), 
  })
);

// Mock ResizeObserver which is not present in JSDOM but often used by UI libraries
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Basic smoke test
it('renders without crashing', async () => {
  const div = document.createElement('div');
  const root = createRoot(div);
  
  // Wrap render in act to handle useEffects
  await act(async () => {
    root.render(<App />);
  });
  
  // Cleanup
  await act(async () => {
    root.unmount();
  });
});
