import { useState, useCallback, useEffect } from 'react';

// Default API key from config (can be overridden by user)
const DEFAULT_API_KEY = '';

/**
 * Mask an API key for display (show first 4 and last 4 characters)
 */
export function maskApiKey(key) {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••••••••••••••' + key.substring(key.length - 4);
}

/**
 * Validate if a string looks like a valid API key
 */
export function isValidApiKeyFormat(key) {
    if (!key) return false;
    // Basic validation: should be at least 20 characters
    return key.length >= 20;
}

/**
 * Extract Google Sheet ID from a full URL
 */
export function extractSheetId(urlOrId) {
    if (!urlOrId) return '';

    // If it's already just an ID (no slashes), return it
    if (!urlOrId.includes('/')) return urlOrId.trim();

    // Extract ID from URL pattern: /spreadsheets/d/{ID}/
    const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : urlOrId.trim();
}

/**
 * Validate Google Sheets URL format
 */
export function isValidSheetsUrl(url) {
    if (!url) return true; // Empty is valid (will use default)

    // Check if it's a valid Sheet ID (alphanumeric, hyphens, underscores)
    if (!url.includes('/')) {
        return /^[a-zA-Z0-9-_]+$/.test(url);
    }

    // Check if it's a valid Google Sheets URL
    return url.includes('docs.google.com/spreadsheets');
}

export const APP_SETTINGS_KEY = 'harshi_app_settings';

const DEFAULT_SETTINGS = {
    geminiApiKey: DEFAULT_API_KEY,
    customSheetUrl: '',
    shuffleQuestions: false,
    autoValidate: true
};

/**
 * Hook for managing app-specific settings with localStorage persistence
 */
export function useAppSettings() {
    const [settings, setSettings] = useState(() => {
        try {
            const stored = localStorage.getItem(APP_SETTINGS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return { ...DEFAULT_SETTINGS, ...parsed };
            }
        } catch (error) {
            console.warn('Error loading app settings:', error);
        }
        return DEFAULT_SETTINGS;
    });

    // Save to localStorage whenever settings change
    useEffect(() => {
        try {
            localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(settings));
        } catch (error) {
            console.warn('Error saving app settings:', error);
        }
    }, [settings]);

    const updateApiKey = useCallback((key) => {
        setSettings(prev => ({ ...prev, geminiApiKey: key }));
    }, []);

    const updateSheetUrl = useCallback((url) => {
        setSettings(prev => ({ ...prev, customSheetUrl: url }));
    }, []);

    const toggleShuffleQuestions = useCallback(() => {
        setSettings(prev => ({ ...prev, shuffleQuestions: !prev.shuffleQuestions }));
    }, []);

    const setShuffleQuestions = useCallback((value) => {
        setSettings(prev => ({ ...prev, shuffleQuestions: value }));
    }, []);

    const resetToDefaults = useCallback(() => {
        setSettings(DEFAULT_SETTINGS);
        return DEFAULT_SETTINGS;
    }, []);

    const getApiKey = useCallback(() => {
        return settings.geminiApiKey || DEFAULT_API_KEY;
    }, [settings.geminiApiKey]);

    const getSheetId = useCallback(() => {
        return extractSheetId(settings.customSheetUrl);
    }, [settings.customSheetUrl]);

    return {
        settings,
        updateApiKey,
        updateSheetUrl,
        toggleShuffleQuestions,
        setShuffleQuestions,
        resetToDefaults,
        getApiKey,
        getSheetId
    };
}

/**
 * Get stored API key (for use in services without hook)
 */
export function getStoredApiKey() {
    try {
        const stored = localStorage.getItem(APP_SETTINGS_KEY);
        if (stored) {
            const settings = JSON.parse(stored);
            return settings.geminiApiKey || DEFAULT_API_KEY;
        }
    } catch (error) {
        console.warn('Error reading API key from storage:', error);
    }
    return DEFAULT_API_KEY;
}
