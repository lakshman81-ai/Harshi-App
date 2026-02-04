// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'text-encoding';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock fetch global
global.fetch = jest.fn((url) => {
    console.log('Mock fetch called with:', url);
    // Return empty array buffer for xlsx files to avoid parsing errors in tests
    if (url && url.endsWith && url.endsWith('.xlsx')) {
        return Promise.resolve({
            ok: true,
            arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
        });
    }
    // Return JSON for other requests
    return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
    });
});
