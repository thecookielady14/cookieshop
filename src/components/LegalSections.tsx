import Link from 'next/link';
import type { Inline, LegalText } from '@/lib/legal-texts';

/**
 * Rendert AGB oder Widerrufsbelehrung aus `lib/legal-texts.ts` – derselbe
 * Text, der auch in der Bestellbestätigung steht.
 */

function InlineText({ parts }: { parts: Inline[] }) {
    return (
        <>
            {parts.map((part, i) => {
                if (typeof part === 'string') return part;
                if ('strong' in part) return <strong key={i}>{part.strong}</strong>;
                return (
                    <Link key={i} href={part.href} className="text-[var(--color-brand-primary)] hover:underline">
                        {part.text}
                    </Link>
                );
            })}
        </>
    );
}

export default function LegalSections({ text }: { text: LegalText }) {
    return (
        <>
            <h1 className="font-serif text-3xl font-bold mb-8">{text.title}</h1>
            <div className="space-y-8 text-neutral-700 leading-relaxed">
                {text.intro && (
                    <p className="text-lg">
                        <InlineText parts={text.intro} />
                    </p>
                )}
                {text.sections.map((section) => (
                    <section
                        key={section.heading}
                        className={section.warning ? 'bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl' : undefined}
                    >
                        {section.sub ? (
                            <h3 className="font-bold text-lg mb-2">{section.heading}</h3>
                        ) : (
                            <h2 className={`font-bold text-xl mb-3 ${section.warning ? 'text-red-700' : ''}`}>{section.heading}</h2>
                        )}
                        {section.blocks.map((block, i) =>
                            'p' in block ? (
                                <p key={i} className={`mb-4 last:mb-0 ${section.warning ? 'text-red-900' : ''}`}>
                                    <InlineText parts={block.p} />
                                </p>
                            ) : (
                                <ul key={i} className="list-disc pl-5 space-y-2 mb-4 last:mb-0">
                                    {block.list.map((item, j) => (
                                        <li key={j}><InlineText parts={item} /></li>
                                    ))}
                                </ul>
                            )
                        )}
                    </section>
                ))}
            </div>
        </>
    );
}
