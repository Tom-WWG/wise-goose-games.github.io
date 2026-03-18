// src/components/FAQDrawer.tsx
import { useState, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  faqs: FAQItem[];
}

function FAQAccordionItem({ item, index }: { item: FAQItem; index: number }) {
  const [open, setOpen] = useState(false);
  const answerId = `faq-answer-${index}`;

  return (
    <div
      style={{ borderBottom: '1px solid var(--border)' }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={answerId}
        className="w-full flex items-center justify-between gap-4 py-4 px-0 text-left transition-colors"
        style={{ color: open ? 'var(--accent)' : 'var(--text-primary)' }}
      >
        <span
          className="font-body text-[13px] font-semibold"
          style={{ letterSpacing: '0.5px' }}
        >
          {item.question}
        </span>
        <ChevronDown
          size={14}
          className="shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', color: 'var(--accent)' }}
        />
      </button>

      {/* Answer — always in DOM for crawlers, height-animated for UX */}
      <div
        id={answerId}
        role="region"
        aria-labelledby={`faq-question-${index}`}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: open ? '400px' : '0px' }}
      >
        <p
          className="font-body text-[13px] leading-relaxed pb-4"
          style={{ color: 'var(--text-muted)' }}
        >
          {item.answer}
        </p>
      </div>
    </div>
  );
}

export default function FAQDrawer({ faqs }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div
      data-reveal-content
      style={{ borderTop: '1px solid var(--border)' }}
    >
      {/* Trigger */}
      <button
        onClick={() => setDrawerOpen((o) => !o)}
        aria-expanded={drawerOpen}
        aria-controls="faq-drawer"
        className="w-full flex items-center justify-between px-6 md:px-8 py-3 transition-colors group"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        <span
          className="font-body text-[11px] font-semibold tracking-widest uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          Frequently Asked Questions
        </span>
        <ChevronDown
          size={14}
          className="transition-transform duration-300"
          style={{
            transform: drawerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            color: 'var(--text-muted)',
          }}
        />
      </button>

      {/* Drawer panel — content always in DOM */}
      <div
        id="faq-drawer"
        ref={drawerRef}
        role="region"
        aria-label="Frequently Asked Questions"
        className="overflow-hidden transition-all duration-400 ease-in-out"
        style={{
          maxHeight: drawerOpen ? '2000px' : '0px',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <div className="px-6 md:px-8 pt-2 pb-6">
          {faqs.map((item, i) => (
            <FAQAccordionItem key={i} item={item} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
