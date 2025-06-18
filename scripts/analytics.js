import { getMetadata } from "./aem.js";

export default async function initAnalytics() {
    let analyticsMeta;
    try {
        analyticsMeta = getMetadata('analytics');
        const analyticsFilePath = analyticsMeta ? new URL(analyticsMeta).pathname : '/analytics';
        const resp = await fetch(`${analyticsFilePath}.json`);
        if (resp.ok) {
            const jsonText = await resp.text();
            const analyticsObjects = JSON.parse(jsonText);
            const digital = {};
            const data = {};
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const currentMonth = monthNames[new Date().getMonth()];
            const currentYear = new Date().getFullYear();

            analyticsObjects.data.forEach(item => {
                data[item.Object] = item.Value;
            });
            digital.data = data;
            digital.data.guide_category = "Genstudio PeM";
            digital.data.engagement_type = digital.data.engagement_type ?? "HOL";
            digital.data.month = digital.data.month ?? currentMonth;
            digital.data.year = digital.data.year ?? currentYear;
            window.digital = digital;
            return digital;
        } else {
            const digital = {};
            const data = {};
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const currentMonth = monthNames[new Date().getMonth()];
            const currentYear = new Date().getFullYear();

            digital.data = data;
            digital.data.guide_category = "Genstudio PeM";
            digital.data.engagement_type = "HOL";
            digital.data.month = currentMonth;
            digital.data.year = currentYear;
            window.digital = digital;
            return digital;
        }
    } catch (error) {
        console.error('Error fetching metadata:', error);
        const digital = {};
        const data = {};
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const currentMonth = monthNames[new Date().getMonth()];
        const currentYear = new Date().getFullYear();

        digital.data = data;
        digital.data.guide_category = "Genstudio PeM";
        digital.data.engagement_type = "HOL";
        digital.data.month = currentMonth;
        digital.data.year = currentYear;
        window.digital = digital;
    }
    
}
