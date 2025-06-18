import { getMetadata } from "./aem.js";

export default async function initConfig() {
    let configMeta;
    try {
        configMeta = getMetadata('config');
        const analyticsFilePath = configMeta ? new URL(configMeta).pathname : '/config';
        const resp = await fetch(`${analyticsFilePath}.json`);
        if (resp.ok) {
            const jsonText = await resp.text();
            const configObjects = JSON.parse(jsonText);
            let config = {};
            const data = {};

            configObjects.data.forEach(item => {
                data[item.Config] = item.Value;
            });
            config = data;
            window.config = config;
            return config;
        }
    } catch (error) {
        console.error('Error fetching metadata:', error);
    }
    
}