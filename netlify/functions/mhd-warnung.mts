/**
 * Netlify Scheduled Function: stößt jeden Morgen die MHD-Prüfung der Zutaten
 * an. Die eigentliche Arbeit macht /api/cron/mhd-warnung – dort stehen
 * Datenbankzugriff und Mailversand, die der Shop ohnehin hat.
 *
 * Läuft um 05:00 UTC, also 06:00 im Winter und 07:00 im Sommer.
 * Geplante Funktionen sind von außen nicht aufrufbar; geschützt werden muss
 * nur die Route, das übernimmt CRON_SECRET.
 */
export default async () => {
    const base = process.env.URL;
    const secret = process.env.CRON_SECRET;
    if (!base || !secret) {
        console.error('MHD-Prüfung übersprungen: URL oder CRON_SECRET fehlt.');
        return;
    }

    const res = await fetch(`${base}/api/cron/mhd-warnung`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${secret}` },
    });
    console.log('MHD-Prüfung:', res.status, await res.text());
};

export const config = {
    schedule: '0 5 * * *',
};
