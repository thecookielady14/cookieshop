'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FaqItem {
    question: string;
    answer: React.ReactNode;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
    const [openIndex, setOpenIndex] = useState<number | null>(0); // first item open by default

    return (
        <div className="space-y-3">
            {items.map((item, i) => {
                const isOpen = openIndex === i;
                return (
                    <div
                        key={i}
                        className="border border-neutral-100 rounded-2xl overflow-hidden transition-shadow duration-300 hover:shadow-md"
                    >
                        <button
                            onClick={() => setOpenIndex(isOpen ? null : i)}
                            className="w-full flex justify-between items-center p-6 text-left bg-white hover:bg-neutral-50 transition-colors"
                            aria-expanded={isOpen}
                        >
                            <h2 className="font-bold text-xl text-gray-900 pr-4">{item.question}</h2>
                            <ChevronDown
                                className={`w-5 h-5 text-[var(--color-brand-primary)] flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Smooth height animation via grid trick */}
                        <div
                            className="grid transition-all duration-300 ease-in-out"
                            style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                        >
                            <div className="overflow-hidden">
                                <div className="px-6 pb-6 pt-0 text-neutral-700 leading-relaxed bg-white">
                                    {item.answer}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
