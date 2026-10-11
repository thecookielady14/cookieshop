'use client';

import { useEffect, useRef, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';

/**
 * Kamera-Scanner für die Barcodes auf Zutatenpackungen (EAN-13/EAN-8).
 *
 * Bewusst zxing statt der eingebauten BarcodeDetector-Schnittstelle: die gibt
 * es in Safari auf dem iPhone nicht. zxing läuft in jedem Browser, braucht
 * aber – wie jeder Kamerazugriff – HTTPS. Auf der echten Website ist das
 * gegeben; `npm run dev` über die IP im WLAN dagegen nicht.
 */

const HINTS = new Map<DecodeHintType, unknown>([
    [DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE,
    ]],
]);

export default function BarcodeScanner({
    onDetected,
    onClose,
}: {
    onDetected: (code: string) => void;
    onClose: () => void;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);
    // Wird erst nach einem Tipp auf „Scannen" eingeblendet, also nie auf dem Server.
    const [error, setError] = useState<string | null>(() =>
        !window.isSecureContext || !navigator.mediaDevices?.getUserMedia
            ? 'Die Kamera ist nur über eine sichere Verbindung (https) verfügbar. Gib die Nummer bitte von Hand ein.'
            : null
    );
    // Die Callbacks ändern sich bei jedem Rendern der Elternseite; die Kamera
    // soll deshalb nicht jedes Mal neu starten.
    const onDetectedRef = useRef(onDetected);
    useEffect(() => {
        onDetectedRef.current = onDetected;
    }, [onDetected]);

    useEffect(() => {
        let controls: IScannerControls | null = null;
        let done = false;

        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) return;

        const reader = new BrowserMultiFormatReader(HINTS);
        reader
            .decodeFromConstraints(
                { video: { facingMode: 'environment' } },
                videoRef.current!,
                (result, _err, c) => {
                    if (result && !done) {
                        done = true;
                        c.stop();
                        navigator.vibrate?.(80);
                        onDetectedRef.current(result.getText());
                    }
                }
            )
            .then((c) => {
                controls = c;
                // Der Effekt kann schon aufgeräumt sein, bevor die Kamera lief.
                if (done) c.stop();
            })
            .catch((err: unknown) => {
                const name = err instanceof Error ? err.name : '';
                setError(
                    name === 'NotAllowedError'
                        ? 'Der Kamerazugriff wurde abgelehnt. Erlaube ihn in den Browser-Einstellungen oder gib die Nummer von Hand ein.'
                        : 'Die Kamera ließ sich nicht starten. Gib die Nummer bitte von Hand ein.'
                );
            });

        return () => {
            done = true;
            controls?.stop();
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" role="dialog" aria-label="Barcode scannen">
            <div className="bg-white rounded-3xl overflow-hidden w-full max-w-md">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <span className="font-bold text-gray-900">Barcode scannen</span>
                    <button type="button" onClick={onClose} aria-label="Schließen"
                        className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {error ? (
                    <div className="flex gap-3 bg-amber-50 text-amber-900 p-5 text-sm">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                    </div>
                ) : (
                    <div className="relative bg-black aspect-[4/3]">
                        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                        {/* Zielrahmen: Barcodes werden am zuverlässigsten erkannt, wenn sie quer und mittig liegen. */}
                        <div className="absolute inset-x-8 top-1/2 -translate-y-1/2 h-24 border-2 border-white/80 rounded-xl pointer-events-none" />
                    </div>
                )}
                <p className="px-5 py-4 text-xs text-gray-500">
                    Halte den Barcode der Packung quer in den Rahmen.
                </p>
            </div>
        </div>
    );
}
