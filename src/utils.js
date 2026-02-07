export const cn = (...classes) => {
    return classes.flat().filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
};

export const log = (...args) => {
    // Check if DEBUG is enabled (we'll need a way to check config, or just default to true/false)
    console.log('[StudyHub]', ...args);
};
