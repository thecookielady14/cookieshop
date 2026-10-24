'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { AlertTriangle, CheckCircle2, Printer } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

type Kind = 'backtag' | 'monat';

interface Check {
    id: string;
    kind: Kind;
    check_date: string;
    fridge_temp: number | null;
    bake_info: string | null;
    items: Record<string, boolean>;
    deviation: string | null;
    signed_by: string;
    corrects_id: string | null;
    created_at: string;
}

/**
 * Prüfpunkte aus dem HACCP-Plan (HACCP/HACCP_Plan_Produktionskueche_ueberarbeitet.pdf).
 * Backtag = Formulare 2, 3B, 4A, 5 und 7; Monat = Formulare 3/4 Teil B.
 * Schlüssel nie umbenennen – sie stehen so in den gespeicherten Einträgen.
 */
const PUNKTE: Record<Kind, { gruppe: string; punkte: { key: string; text: string }[] }[]> = {
    backtag: [
        {
            gruppe: 'Vor dem Backen',
            punkte: [
                { key: 'personal', text: 'Saubere Arbeitskleidung, Haare gebunden, keine ansteckende Erkrankung' },
                { key: 'flaechen_vor', text: 'Arbeitsflächen, Maschine, Waage und Geräte sauber' },
                { key: 'schaedlinge', text: 'Keine Schädlingsspuren an Rohstoffen, im Produktions- und Lagerraum, an Türen/Fenstern und im Abfall' },
                { key: 'rohstoffe', text: 'Verwendete Rohstoffe einwandfrei (MHD, Verpackung, Geruch, Aussehen)' },
            ],
        },
        {
            gruppe: 'Backen und Verpacken',
            punkte: [
                { key: 'durchgebacken', text: 'Kekse vollständig durchgebacken (Sichtprüfung)' },
                { key: 'abgekuehlt', text: 'Vor dem Verpacken vollständig abgekühlt' },
                { key: 'fremdkoerper', text: 'Keine Fremdkörper, kein Glas- oder Geräteschaden' },
                { key: 'etikett', text: 'Etiketten geprüft: richtige Sorte, Allergene, MHD und L-Nummer eingetragen' },
                { key: 'gewicht', text: 'Gewichts-Stichprobe: mindestens Nennfüllmenge (65 g bzw. 100 g)' },
            ],
        },
        {
            gruppe: 'Nach dem Backen',
            punkte: [
                { key: 'flaechen_nach', text: 'Flächen, Geräte, Spülbecken und Spülmaschine gereinigt' },
                { key: 'boden_abfall', text: 'Fußboden gereinigt, Abfall geleert' },
            ],
        },
    ],
    monat: [
        {
            gruppe: 'Monatskontrolle',
            punkte: [
                { key: 'kuehlschrank_reinigung', text: 'Kühlschrank ausgeräumt und gründlich gereinigt' },
                { key: 'regale', text: 'Regale und Lagerflächen gereinigt, Verpackungen sauber' },
                { key: 'waende_tueren', text: 'Wände, Türen und Türgriffe gereinigt' },
                { key: 'schaedlinge_monat', text: 'Ecken, unter Regalen und schwer zugängliche Stellen auf Schädlinge geprüft' },
                { key: 'mhd_lager', text: 'Lager auf abgelaufene oder beschädigte Ware geprüft' },
                { key: 'geraete', text: 'Thermometer und Waage funktionieren, Geräte ohne Schäden' },
            ],
        },
    ],
};

const TITEL: Record<Kind, string> = { backtag: 'Backtag', monat: 'Monatskontrolle' };
const KUEHL_MAX = 7;
const today = () => format(new Date(), 'yyyy-MM-dd');

const offenePunkte = (c: Pick<Check, 'kind' | 'items'>) =>
    PUNKTE[c.kind].flatMap((g) => g.punkte).filter((p) => !c.items[p.key]);

/**
 * Hygiene-Checklisten statt Papierformularen. Einträge lassen sich nur
 * anlegen, nicht ändern – die Datenbank erlaubt kein UPDATE/DELETE. Fehler
 * werden mit einem Nachtrag korrigiert, so bleibt die Dokumentation prüffest.
 */
export default function AdminHygiene() {
    const [supabase] = useState(() =>
        createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );

    const [checks, setChecks] = useState<Check[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const [kind, setKind] = useState<Kind>('backtag');
    const [checkDate, setCheckDate] = useState(today);
    const [fridgeTemp, setFridgeTemp] = useState('');
    const [bakeInfo, setBakeInfo] = useState('');
    const [items, setItems] = useState<Record<string, boolean>>({});
    const [deviation, setDeviation] = useState('');
    const [signedBy, setSignedBy] = useState('');
    const [correctsId, setCorrectsId] = useState<string | null>(null);
    const [druckMonat, setDruckMonat] = useState(() => format(new Date(), 'yyyy-MM'));

    const fetchChecks = useCallback(() => supabase
        .from('hygiene_checks')
        .select('*')
        .order('check_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(500), [supabase]);

    const apply = useCallback(({ data, error: loadError }: Awaited<ReturnType<typeof fetchChecks>>) => {
        if (loadError) {
            setError('Die Tabelle für die Hygiene-Checklisten fehlt noch. Führe die Datei hygiene_checks.sql im Supabase SQL Editor aus. (' + loadError.message + ')');
        } else {
            setChecks((data ?? []) as Check[]);
        }
        // Kürzel merken, damit es nicht jedes Mal getippt werden muss
        try { setSignedBy((s) => s || (localStorage.getItem('hygiene-kuerzel') ?? '')); } catch { /* privat-Modus */ }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchChecks().then(apply);
    }, [fetchChecks, apply]);

    const reset = (k: Kind) => {
        setKind(k);
        setItems({});
        setFridgeTemp('');
        setBakeInfo('');
        setDeviation('');
        setCorrectsId(null);
        setCheckDate(today());
    };

    const temp = fridgeTemp.trim() ? parseFloat(fridgeTemp.replace(',', '.')) : null;
    const offen = offenePunkte({ kind, items });
    const brauchtMassnahme = offen.length > 0 || (temp !== null && temp > KUEHL_MAX);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaved(null);
        if (!signedBy.trim()) return setError('Bitte trage dein Kürzel ein.');
        if (kind === 'backtag' && (temp === null || isNaN(temp))) return setError('Bitte trage die Kühlschranktemperatur ein.');
        if (brauchtMassnahme && !deviation.trim()) {
            return setError('Nicht alles ist in Ordnung. Bitte beschreibe unter „Abweichung und Maßnahme“, was los war und was du getan hast.');
        }
        setSaving(true);
        const { data, error: saveError } = await supabase.from('hygiene_checks').insert({
            kind,
            check_date: checkDate || today(),
            fridge_temp: kind === 'backtag' ? temp : null,
            bake_info: kind === 'backtag' ? bakeInfo.trim() || null : null,
            items,
            deviation: deviation.trim() || null,
            signed_by: signedBy.trim(),
            corrects_id: correctsId,
        }).select('id');
        setSaving(false);
        if (saveError || !data?.length) {
            return setError('Fehler beim Speichern: ' + (saveError?.message ?? 'Die Anmeldung ist vermutlich abgelaufen. Bitte neu anmelden.'));
        }
        try { localStorage.setItem('hygiene-kuerzel', signedBy.trim()); } catch { /* egal */ }
        setSaved(`${TITEL[kind]} vom ${format(parseISO(checkDate), 'dd.MM.yyyy')} gespeichert.`);
        reset(kind);
        apply(await fetchChecks());
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const nachtrag = (c: Check) => {
        setKind(c.kind);
        setCheckDate(c.check_date);
        setFridgeTemp(c.fridge_temp?.toString().replace('.', ',') ?? '');
        setBakeInfo(c.bake_info ?? '');
        setItems(c.items);
        setDeviation('');
        setCorrectsId(c.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const heuteErledigt = checks.some((c) => c.kind === 'backtag' && c.check_date === today());
    const druckListe = useMemo(
        () => checks.filter((c) => c.check_date.startsWith(druckMonat)).sort((a, b) => a.check_date.localeCompare(b.check_date)),
        [checks, druckMonat]
    );

    const inputClass =
        'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all bg-white';

    if (loading) return <p className="text-gray-500">Checklisten werden geladen …</p>;

    return (
        <div className="max-w-4xl">
            <div className="print:hidden">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Hygiene</h1>
                <p className="text-gray-500 mb-8 max-w-2xl">
                    Die Eigenkontrollen aus deinem HACCP-Plan: an jedem Backtag eine Checkliste, einmal im Monat die Monatskontrolle.
                    Gespeicherte Einträge lassen sich <strong className="text-gray-700">nicht mehr ändern</strong> – Fehler korrigierst du mit einem Nachtrag.
                </p>

                {saved && (
                    <div className="flex gap-3 bg-green-50 border border-green-200 text-green-900 p-4 rounded-2xl mb-6 text-sm">
                        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>{saved}</p>
                    </div>
                )}
                {error && (
                    <div className="flex gap-3 bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl mb-6 text-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="flex gap-2 mb-4">
                    {(['backtag', 'monat'] as Kind[]).map((k) => (
                        <button key={k} type="button" onClick={() => reset(k)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold ${kind === k ? 'bg-[var(--color-brand-primary)] text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
                            {TITEL[k]}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8 space-y-5">
                    <h2 className="text-lg font-bold text-gray-900">
                        {correctsId ? `Nachtrag zum ${TITEL[kind]} vom ${format(parseISO(checkDate), 'dd.MM.yyyy')}` : `Neue Checkliste: ${TITEL[kind]}`}
                    </h2>
                    {kind === 'backtag' && !heuteErledigt && !correctsId && (
                        <p className="text-sm text-[var(--color-brand-accent)] font-medium">Für heute ist noch keine Backtag-Checkliste eingetragen.</p>
                    )}

                    <div className="grid md:grid-cols-3 gap-3">
                        <label className="block text-sm">
                            <span className="text-gray-600">Datum</span>
                            <input type="date" className={inputClass} value={checkDate} onChange={(e) => setCheckDate(e.target.value)} disabled={!!correctsId} />
                        </label>
                        {kind === 'backtag' && (
                            <label className="block text-sm">
                                <span className="text-gray-600">Kühlschrank (°C) *</span>
                                <input className={inputClass} value={fridgeTemp} onChange={(e) => setFridgeTemp(e.target.value)} inputMode="decimal" placeholder={`max. ${KUEHL_MAX} °C`} />
                            </label>
                        )}
                        <label className="block text-sm">
                            <span className="text-gray-600">Kürzel *</span>
                            <input className={inputClass} value={signedBy} onChange={(e) => setSignedBy(e.target.value)} placeholder="z. B. TL" />
                        </label>
                    </div>
                    {temp !== null && temp > KUEHL_MAX && (
                        <p className="text-sm text-red-700 bg-red-50 p-3 rounded-xl">
                            Über {KUEHL_MAX} °C: erneut messen, Ursache prüfen, betroffene Ware beurteilen und unten die Maßnahme eintragen.
                        </p>
                    )}

                    {PUNKTE[kind].map((g) => (
                        <fieldset key={g.gruppe}>
                            <legend className="text-sm font-bold text-gray-700 mb-2">{g.gruppe}</legend>
                            <div className="space-y-2">
                                {g.punkte.map((p) => (
                                    <label key={p.key} className="flex items-start gap-3 text-sm text-gray-800 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer">
                                        <input type="checkbox" className="mt-0.5 w-5 h-5 flex-shrink-0" checked={!!items[p.key]}
                                            onChange={(e) => setItems((prev) => ({ ...prev, [p.key]: e.target.checked }))} />
                                        <span>{p.text}</span>
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                    ))}
                    {kind === 'backtag' && (
                        <button type="button" className="text-sm underline text-gray-600"
                            onClick={() => setItems(Object.fromEntries(PUNKTE.backtag.flatMap((g) => g.punkte).map((p) => [p.key, true])))}>
                            Alles in Ordnung – alle Punkte abhaken
                        </button>
                    )}

                    {kind === 'backtag' && (
                        <label className="block text-sm">
                            <span className="text-gray-600">Backtemperatur, Backzeit, Gewichts-Stichprobe</span>
                            <input className={inputClass} value={bakeInfo} onChange={(e) => setBakeInfo(e.target.value)} placeholder="z. B. 175 °C Umluft, 11 min; Stichprobe 66 g" />
                        </label>
                    )}

                    <label className="block text-sm">
                        <span className="text-gray-600">Abweichung und Maßnahme{brauchtMassnahme ? ' *' : ''}</span>
                        <textarea rows={2} className={inputClass} value={deviation} onChange={(e) => setDeviation(e.target.value)}
                            placeholder={correctsId ? 'Was wird korrigiert und warum?' : 'Nur ausfüllen, wenn etwas nicht in Ordnung war'} />
                    </label>
                    {brauchtMassnahme && offen.length > 0 && (
                        <p className="text-xs text-gray-500">Nicht abgehakt: {offen.map((p) => p.text).join(' · ')}</p>
                    )}

                    <div className="flex flex-wrap gap-3">
                        <button type="submit" disabled={saving}
                            className="w-full md:w-auto bg-[var(--color-brand-primary)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50">
                            {saving ? 'Speichert …' : correctsId ? 'Nachtrag speichern' : 'Checkliste speichern'}
                        </button>
                        {correctsId && (
                            <button type="button" onClick={() => reset(kind)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-700">Abbrechen</button>
                        )}
                    </div>
                </form>

                <div className="flex flex-wrap items-end gap-3 mb-4">
                    <h2 className="text-lg font-bold text-gray-900 mr-auto">Bisherige Einträge</h2>
                    <label className="text-sm">
                        <span className="text-gray-600 block">Monat</span>
                        <input type="month" className="px-3 py-2 rounded-xl border border-gray-200 bg-white" value={druckMonat} onChange={(e) => setDruckMonat(e.target.value)} />
                    </label>
                    <button type="button" onClick={() => window.print()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700">
                        <Printer className="w-4 h-4" /> Monat drucken
                    </button>
                </div>
            </div>

            {/* Druckansicht: nur der gewählte Monat */}
            <div className="hidden print:block mb-4">
                <h1 className="text-xl font-bold">Hygiene-Eigenkontrollen – The Cookie Lady, Mering</h1>
                <p className="text-sm">Monat: {format(parseISO(druckMonat + '-01'), 'MMMM yyyy', { locale: de })} · gedruckt am {format(new Date(), 'dd.MM.yyyy')}</p>
            </div>

            {druckListe.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-500">Keine Einträge in diesem Monat.</div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 divide-y divide-gray-100 print:rounded-none print:shadow-none print:border-0">
                    {druckListe.map((c) => {
                        const fehlt = offenePunkte(c);
                        const ok = fehlt.length === 0 && !(c.fridge_temp !== null && c.fridge_temp > KUEHL_MAX);
                        return (
                            <div key={c.id} className="p-4 text-sm break-inside-avoid">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="font-bold text-gray-900">{format(parseISO(c.check_date), 'EEE, dd.MM.yyyy', { locale: de })}</span>
                                    <span className="text-gray-600">{TITEL[c.kind]}{c.corrects_id ? ' · Nachtrag' : ''}</span>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${ok ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-900'}`}>
                                        {ok ? 'alles in Ordnung' : 'Abweichung'}
                                    </span>
                                    <span className="text-gray-500 ml-auto">
                                        {c.signed_by} · eingetragen {format(parseISO(c.created_at), 'dd.MM. HH:mm')}
                                    </span>
                                    <button type="button" onClick={() => nachtrag(c)} className="text-xs underline text-gray-500 print:hidden">Nachtrag</button>
                                </div>
                                <div className="text-gray-700 mt-1 space-y-0.5">
                                    {c.fridge_temp !== null && <p>Kühlschrank: {c.fridge_temp.toString().replace('.', ',')} °C</p>}
                                    {c.bake_info && <p>Backen: {c.bake_info}</p>}
                                    {fehlt.length > 0 && <p>Nicht abgehakt: {fehlt.map((p) => p.text).join(' · ')}</p>}
                                    {c.deviation && <p>Abweichung/Maßnahme: {c.deviation}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
