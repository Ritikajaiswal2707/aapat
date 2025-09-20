import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock socket.io to avoid real connections in tests
jest.mock('socket.io-client', () => {
  return () => ({
    on: jest.fn(),
    close: jest.fn()
  });
});

beforeEach(() => {
  // Mock network requests used by App
  // @ts-ignore
  global.fetch = jest.fn((url: string) => {
    if (url.includes('/api/analytics/dashboard')) {
      return Promise.resolve({
        json: () => Promise.resolve({
          success: true,
          data: { metrics: { total_emergencies: 0, avg_response_time_minutes: 0, available_ambulances: 0, total_hospitals: 0, critical_emergencies: 0, high_emergencies: 0, medium_emergencies: 0, low_emergencies: 0, completed_emergencies: 0 } }
        })
      } as any);
    }
    if (url.includes('/api/ambulances')) {
      return Promise.resolve({ json: () => Promise.resolve({ success: true, data: [] }) } as any);
    }
    if (url.includes('/api/hospitals')) {
      return Promise.resolve({ json: () => Promise.resolve({ success: true, data: [] }) } as any);
    }
    if (url.includes('/api/emergency/recent')) {
      return Promise.resolve({ json: () => Promise.resolve({ success: true, data: [] }) } as any);
    }
    return Promise.resolve({ json: () => Promise.resolve({}) } as any);
  });

  // Mock alert to avoid JSDOM errors
  // @ts-ignore
  window.alert = jest.fn();
});

test('renders dashboard heading', async () => {
  render(<App />);
  expect(await screen.findByRole('heading', { name: /Aapat Emergency Dashboard/i })).toBeInTheDocument();
});


