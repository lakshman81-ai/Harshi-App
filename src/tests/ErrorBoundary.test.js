import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorBoundary from '../components/ErrorBoundary';
import { Logger } from '../services/Logger';

// Mock Logger
jest.mock('../services/Logger', () => ({
    Logger: {
        error: jest.fn()
    }
}));

const ProblemChild = () => {
    throw new Error('Test Error');
};

describe('ErrorBoundary', () => {
    test('renders children when no error', () => {
        render(
            <ErrorBoundary>
                <div>Safe Content</div>
            </ErrorBoundary>
        );
        expect(screen.getByText('Safe Content')).toBeInTheDocument();
    });

    test('renders fallback UI when error occurs', () => {
        // Prevent console.error from cluttering output
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

        render(
            <ErrorBoundary>
                <ProblemChild />
            </ErrorBoundary>
        );

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(Logger.error).toHaveBeenCalled();

        spy.mockRestore();
    });
});
