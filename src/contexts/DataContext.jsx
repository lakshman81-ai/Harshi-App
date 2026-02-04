import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { sheetsService } from '../services/GoogleSheetsService';
import { DataTransformer } from '../services/DataTransformer';
import unifiedDataService from '../services/unifiedDataService';
import { GOOGLE_SHEETS_CONFIG } from '../config';
import { log } from '../utils';

const DataContext = createContext(null);

const DATA_SOURCE_KEY = 'studyhub_data_source';

export const useData = () => {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be used within DataProvider');
    return ctx;
};

export const DataProvider = ({ children }) => {
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [lastSync, setLastSync] = useState(null);
    const [syncStatus, setSyncStatus] = useState('loading'); // loading, syncing, success, error, offline

    // Data source selection: 'local' or 'google'
    const [dataSource, setDataSource] = useState(() => {
        try {
            const saved = window.localStorage.getItem(DATA_SOURCE_KEY);
            return saved || 'local';
        } catch {
            return 'local';
        }
    });

    // Save data source preference
    const updateDataSource = useCallback((source) => {
        setDataSource(source);
        try {
            window.localStorage.setItem(DATA_SOURCE_KEY, source);
        } catch (e) {
            console.warn('Could not save data source preference:', e);
        }
    }, []);

    // Check if Google Sheets is configured
    const isGoogleSheetsConfigured = sheetsService.isConfigured();

    // Demo mode means using local Excel (either by choice or because Google Sheets isn't configured)
    const isDemoMode = dataSource === 'local' || !isGoogleSheetsConfigured;

    // Load data based on selected data source
    const loadData = useCallback(async (isManualRefresh = false) => {
        if (isManualRefresh) {
            setIsRefreshing(true);
            setSyncStatus('syncing');
        } else if (!data) {
            setSyncStatus('loading');
        }
        setError(null);

        // Load from local Excel/CSV
        if (dataSource === 'local' || !isGoogleSheetsConfigured) {
            log('Loading local data (CSV-first with Excel fallback)');
            try {
                const rawData = await unifiedDataService.loadAppData();
                const transformed = DataTransformer.transformAll(rawData);
                setData(transformed);
                setLastSync(new Date());
                setSyncStatus('success');
                log(`Local data loaded successfully from ${rawData._dataSource || 'unknown'} source`);
            } catch (e) {
                console.error('Local data load error:', e);
                setError('Failed to load local data: ' + e.message);
                setSyncStatus('error');
            }
            setIsLoading(false);
            setIsRefreshing(false);
            return;
        }

        // Load from Google Sheets
        log('Loading data from Google Sheets');
        setSyncStatus('syncing');

        try {
            const rawData = await sheetsService.fetchAllSheets();
            const transformed = DataTransformer.transformAll(rawData);

            // Validate we got some data
            if (Object.keys(transformed.subjects).length === 0) {
                throw new Error('No subjects found in spreadsheet');
            }

            setData(transformed);
            setLastSync(new Date());
            setSyncStatus('success');
            log('Google Sheets data synced successfully');

        } catch (err) {
            console.error('Sync error:', err);
            setError(err.message);
            setSyncStatus('error');

            // Use fallback data from local Excel/CSV if enabled
            if (!data) {
                log('Attempting to load local data as fallback...');
                try {
                    const rawLocalData = await unifiedDataService.loadAppData();
                    const transformed = DataTransformer.transformAll(rawLocalData);
                    setData(transformed);
                    setLastSync(new Date());
                    setSyncStatus('offline');
                } catch (fallbackErr) {
                    console.error('Fallback load error:', fallbackErr);
                }
            }
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [dataSource, isGoogleSheetsConfigured, data]);

    // Initial load
    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reload when data source changes
    useEffect(() => {
        if (data) {
            // Only reload if we already have data (not on initial load)
            loadData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataSource]);

    // Auto-refresh interval (only for Google Sheets mode)
    useEffect(() => {
        if (!GOOGLE_SHEETS_CONFIG.AUTO_REFRESH || dataSource === 'local' || !isGoogleSheetsConfigured) return;

        const interval = setInterval(() => {
            loadData();
        }, GOOGLE_SHEETS_CONFIG.REFRESH_INTERVAL);

        return () => clearInterval(interval);
    }, [dataSource, isGoogleSheetsConfigured, loadData]);

    const value = {
        ...data,
        isLoading,
        isRefreshing,
        error,
        lastSync,
        syncStatus,
        isDemoMode,
        dataSource,
        updateDataSource,
        isGoogleSheetsConfigured,
        refresh: () => loadData(true)
    };

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};
