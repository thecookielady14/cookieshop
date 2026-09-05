import { ImageResponse } from 'next/og';

export const alt = 'The Cookie Lady – Handgemachte Cookies';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Vorschaubild für WhatsApp, Instagram, Facebook & Co. Wird zur Buildzeit
 * gerendert – 1200x630 ist das Format, das `summary_large_image` erwartet.
 */
export default function OpengraphImage() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#331f16',
                    color: '#fef5e7',
                    fontFamily: 'serif',
                    position: 'relative',
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        top: -160,
                        right: -160,
                        width: 520,
                        height: 520,
                        borderRadius: '50%',
                        background: '#e6b840',
                        opacity: 0.18,
                        display: 'flex',
                    }}
                />
                <div style={{ fontSize: 110, display: 'flex' }}>🍪</div>
                <div
                    style={{
                        fontSize: 76,
                        fontWeight: 700,
                        marginTop: 16,
                        letterSpacing: -1,
                        display: 'flex',
                    }}
                >
                    The Cookie Lady
                </div>
                <div
                    style={{
                        fontSize: 32,
                        color: '#e6b840',
                        marginTop: 20,
                        letterSpacing: 4,
                        textTransform: 'uppercase',
                        display: 'flex',
                    }}
                >
                    Handgemachte Cookies
                </div>
                <div
                    style={{
                        fontSize: 26,
                        color: 'rgba(254,245,231,0.72)',
                        marginTop: 28,
                        display: 'flex',
                    }}
                >
                    Frisch gebacken aus regionalem Dinkelmehl · Mering
                </div>
            </div>
        ),
        size
    );
}
