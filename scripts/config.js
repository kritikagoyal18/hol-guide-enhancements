import { getMetadata } from "./aem.js";

/**
 * Fetches and caches the project's configuration from a JSON file.
 * The JSON file is expected to be at '/config.json' unless overridden by a 'config' metadata tag.
 * The configuration is stored in a global `window.config` object.
 * @returns {Promise<object>} A promise that resolves to the configuration object.
 */
export default async function initConfig() {
    // Return cached config if available
    if (window.config) {
        return window.config;
    }

    try {
        const configMeta = getMetadata('config');
        const configPath = configMeta ? new URL(configMeta).pathname : '/config';
        const resp = await fetch(`${configPath}.json`);
        if (resp.ok) {
            const json = await resp.json();
            const cfg = {};
            json.data.forEach((item) => {
                cfg[item.Config] = item.Value;
            });
            window.config = cfg;
            return window.config;
        }
    } catch (error) {
        console.error('Failed to fetch or parse project config:', error);
    }

    // Return empty config object in case of failure
    window.config = {};
    return window.config;
}