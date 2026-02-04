import { GOOGLE_SHEETS_CONFIG } from '../config';
import { log } from '../utils';
import { Logger } from './Logger';

class GoogleSheetsService {
    constructor(config) {
        this.sheetId = config.SHEET_ID;
        this.apiKey = config.API_KEY;
        this.sheets = config.SHEETS;
        this.cache = new Map();
        this.lastFetch = null;
    }

    // Build API URL for a specific sheet
    getSheetUrl(sheetName) {
        return `https://sheets.googleapis.com/v4/spreadsheets/${this.sheetId}/values/${encodeURIComponent(sheetName)}?key=${this.apiKey}`;
    }

    // Fetch a single sheet and convert to array of objects
    async fetchSheet(sheetName) {
        const url = this.getSheetUrl(sheetName);
        log(`Fetching sheet: ${sheetName}`);

        try {
            const response = await fetch(url);

            if (!response.ok) {
                const error = await response.json();
                const errorMessage = error.error?.message || `HTTP ${response.status}`;
                Logger.error('API Error', { url, status: response.status, message: errorMessage });
                throw new Error(errorMessage);
            }

            const data = await response.json();
            const rows = data.values || [];

            if (rows.length < 2) {
                log(`Sheet ${sheetName} is empty or has only headers`);
                return [];
            }

            // First row = headers, convert to snake_case
            const headers = rows[0].map(h =>
                String(h).trim().toLowerCase().replace(/\s+/g, '_')
            );

            // Convert remaining rows to objects
            const result = rows.slice(1).map((row, index) => {
                const obj = { _rowIndex: index + 2 }; // Track original row for debugging
                headers.forEach((header, i) => {
                    obj[header] = row[i] !== undefined ? String(row[i]).trim() : '';
                });
                return obj;
            });

            log(`Fetched ${result.length} rows from ${sheetName}`);
            return result;

        } catch (error) {
            console.error(`Error fetching ${sheetName}:`, error);
            throw error;
        }
    }

    // Fetch all sheets in parallel
    async fetchAllSheets(isManualRefresh = false) {
        log('Fetching all sheets...');

        // If we have cached data, return it immediately and refresh in background
        if (this.cache.has('lastData') && !isManualRefresh) {
            const cachedData = this.cache.get('lastData');
            const cacheAge = Date.now() - (this.cache.get('lastFetchTime') || 0);

            // Use cache if less than 5 minutes old
            if (cacheAge < 300000) {
                log('Using cached data, refreshing in background...');
                this.refreshInBackground(); // Don't await
                return cachedData;
            }
        }

        // Fetch fresh data
        return await this.doFetch();
    }

    async doFetch() {
        const startTime = Date.now();

        const sheetNames = Object.values(this.sheets);
        const results = await Promise.allSettled(
            sheetNames.map(name => this.fetchSheet(name))
        );

        // Build result object
        const data = {};
        Object.keys(this.sheets).forEach((key, index) => {
            const result = results[index];
            if (result.status === 'fulfilled') {
                data[key] = result.value;
            } else {
                console.error(`Failed to fetch ${this.sheets[key]}:`, result.reason);
                data[key] = [];
            }
        });

        // Update cache
        this.cache.set('lastData', data);
        this.cache.set('lastFetchTime', Date.now());
        this.lastFetch = new Date();

        log(`All sheets fetched in ${Date.now() - startTime}ms`);
        return data;
    }

    async refreshInBackground() {
        try {
            const freshData = await this.doFetch();
            // Note: Triggering re-render requires callback, implement in DataContext
            if (this.onDataUpdate) {
                this.onDataUpdate(freshData);
            }
        } catch (err) {
            console.warn('Background refresh failed, using cached data:', err);
        }
    }

    // Check if configuration is valid
    isConfigured() {
        // Validate sheet ID format
        const validSheetId = this.sheetId &&
            this.sheetId !== 'YOUR_SHEET_ID_HERE' &&
            !this.sheetId.startsWith('2PACX-') && // Published URL format (invalid)
            this.sheetId.length >= 20 && // Minimum valid length
            /^[a-zA-Z0-9_-]+$/.test(this.sheetId); // Valid characters only

        // Validate API key format
        const validApiKey = this.apiKey &&
            this.apiKey !== 'YOUR_GOOGLE_API_KEY_HERE' &&
            this.apiKey.startsWith('AIza') && // All Google API keys start with this
            this.apiKey.length >= 35; // Typical length

        return validSheetId && validApiKey;
    }
}

// Create singleton instance
export const sheetsService = new GoogleSheetsService(GOOGLE_SHEETS_CONFIG);
