import { Logger } from './Logger';
import { search } from 'duck-duck-scrape';

// Helper to check if string contains any of these terms
const contains = (text, terms) => terms.some(t => text.toLowerCase().includes(t.toLowerCase()));

/**
 * Fallback to DuckDuckGo search if Gemini is unavailable
 * @param {object} context - { question, wrongAnswer, correctAnswer }
 */
export const getFallbackExplanation = async (context) => {
    Logger.info('Using DuckDuckGo Fallback for Explanation');
    try {
        const query = `explain why "${context.wrongAnswer}" is wrong and "${context.correctAnswer}" is correct for question: "${context.question}"`;
        const searchResults = await search(query, {
            safeSearch: "Strict",
            limit: 3
        });

        if (searchResults.results && searchResults.results.length > 0) {
            // Try to find a good snippet
            const snippet = searchResults.results[0].description || searchResults.results[0].title;
            return `I couldn't generate a custom explanation right now, but here is what I found online: "${snippet}" (Source: ${searchResults.results[0].url})`;
        }
    } catch (error) {
        Logger.error('DuckDuckGo Fallback Failed', error);
    }

    return "Check your textbook or class notes for more details on this concept. (AI Service Unavailable)";
};

export const validateApiKey = async (apiKey) => {
    if (!apiKey) return false;

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Hello' }] }]
                })
            }
        );

        if (!response.ok) {
            Logger.error('Gemini API Error', { status: response.status });
        }

        return response.ok;
    } catch (e) {
        console.error('API Validation Failed:', e);
        Logger.error('Gemini API Validation Failed', e);
        return false;
    }
};

export const explainMisconception = async (apiKey, question, wrongAnswer, correctAnswer) => {
    // 1. Try Gemini
    if (apiKey) {
        try {
            const prompt = `
            Context: Grade 8 Student.
            Question: "${question}"
            Correct Answer: "${correctAnswer}"
            Student Answer: "${wrongAnswer}"

            Task: Explain why the student's answer is wrong and the correct logic.
            Tone: Encouraging, simple.
            Max Length: 2 sentences.
            `;

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                }
            );

            if (response.ok) {
                const data = await response.json();
                const text = data.candidates[0].content.parts[0].text;
                Logger.info('Gemini Explanation Generated');
                return text;
            } else {
                 Logger.warn('Gemini API returned error', { status: response.status });
            }

        } catch (error) {
            Logger.error('Gemini Explanation Failed', error);
        }
    } else {
        Logger.warn('No Gemini API Key provided, skipping AI explanation');
    }

    // 2. Fallback to DuckDuckGo/Static
    return await getFallbackExplanation({ question, wrongAnswer, correctAnswer });
};
