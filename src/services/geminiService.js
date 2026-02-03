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
        return response.ok;
    } catch (e) {
        console.error('API Validation Failed:', e);
        return false;
    }
};
