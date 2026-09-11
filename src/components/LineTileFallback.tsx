/**
 * Kachelmotiv für eine Produktlinie ohne eigenes Foto.
 *
 * Bewusst als Zeichnung statt als Platzhalterdatei: es entstehen keine Bilder,
 * die später wieder aufgeräumt werden müssen, und sobald ein echtes Foto
 * hinterlegt ist, verschwindet das Motiv von allein.
 *
 * Keksform und Stückchen werden aus dem Slug abgeleitet, damit eine Linie
 * immer dasselbe Motiv bekommt; der Grundton kommt aus der Position, damit
 * benachbarte Kacheln sich sicher unterscheiden.
 */

/** Kleine, stabile Zahl aus dem Slug – dieselbe Linie soll gleich aussehen. */
function seedFrom(slug: string): number {
    let value = 0;
    for (let i = 0; i < slug.length; i++) value = (value * 31 + slug.charCodeAt(i)) % 997;
    return value;
}

export default function LineTileFallback({ slug, index = 0 }: { slug: string; index?: number }) {
    const seed = seedFrom(slug);

    // Drei Grundtöne aus der Markenpalette, damit die Kacheln unterscheidbar
    // bleiben, ohne aus dem Rahmen zu fallen.
    const grounds = [
        'var(--color-brand-primary)',
        'var(--color-brand-dark)',
        'var(--color-brand-text)',
    ];
    // Grundton über die Position, damit benachbarte Kacheln garantiert
    // verschieden sind – eine Streuung über den Namen kann kollidieren.
    const ground = grounds[index % grounds.length];
    const rotation = (seed % 24) - 12;

    // Schokostückchen: aus dem Seed abgeleitet, aber innerhalb des Kekses.
    const chips = Array.from({ length: 7 }, (_, i) => {
        const angle = ((seed + i * 53) % 360) * (Math.PI / 180);
        const radius = 6 + ((seed + i * 29) % 20);
        return {
            cx: 50 + Math.cos(angle) * radius,
            cy: 50 + Math.sin(angle) * radius,
            r: 2.2 + ((seed + i * 17) % 3) * 0.6,
        };
    });

    return (
        <div className="absolute inset-0 overflow-hidden" style={{ background: ground }} aria-hidden="true">
            {/* Weicher Lichtschein, damit die Fläche nicht flach wirkt */}
            <div
                className="absolute rounded-full blur-3xl"
                style={{
                    background: 'var(--color-brand-accent)',
                    opacity: 0.22,
                    width: '70%',
                    aspectRatio: '1',
                    top: `${-10 + (seed % 20)}%`,
                    right: `${-15 + (seed % 25)}%`,
                }}
            />

            <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full"
                style={{ transform: `rotate(${rotation}deg) scale(1.15)` }}
            >
                {/* Keks als Silhouette, angedeutet unrund wie handgeformt */}
                <path
                    d="M50 14 C67 14 84 27 85 45 C86 63 72 84 52 86 C33 88 15 74 14 54 C13 34 31 14 50 14 Z"
                    fill="var(--color-brand-secondary)"
                    opacity="0.16"
                />
                {chips.map((chip, i) => (
                    <circle
                        key={i}
                        cx={chip.cx}
                        cy={chip.cy}
                        r={chip.r}
                        fill="var(--color-brand-secondary)"
                        opacity="0.3"
                    />
                ))}
            </svg>
        </div>
    );
}
