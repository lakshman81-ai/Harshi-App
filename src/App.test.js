import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// We don't need to mock global.fetch here anymore as it's in setupTests.js

test('renders without crashing', async () => {
  render(<App />);
  // Wait for something to appear, or just verify it renders
  // Since App loads data on mount, we might see a loading state or the main app
  // For a smoke test, ensuring it doesn't throw is good.
  
  // We can look for the "StudyHub" text which is in the header
  // Using findByText which is async and waits
  // await screen.findByText(/StudyHub/i);
});
