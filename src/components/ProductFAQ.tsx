import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import './ProductFAQ.css';

export interface FAQItem {
  question: string;
  answer: string;
}

interface ProductFAQProps {
  items: FAQItem[];
}

export function ProductFAQ({ items }: ProductFAQProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className="pfaq-root">
      <h3 className="pfaq-title">Perguntas Frequentes</h3>

      <AccordionPrimitive.Root
        type="single"
        defaultValue="item-0"
        collapsible
        className="pfaq-list"
      >
        {items.map((item, idx) => (
          <AccordionPrimitive.Item
            key={idx}
            value={`item-${idx}`}
            className="pfaq-item"
          >
            <AccordionPrimitive.Header className="pfaq-header">
              <AccordionPrimitive.Trigger className="pfaq-trigger">
                <span className="pfaq-question">{item.question}</span>
                <ChevronDown size={18} className="pfaq-chevron" aria-hidden />
              </AccordionPrimitive.Trigger>
            </AccordionPrimitive.Header>

            <AccordionPrimitive.Content className="pfaq-content">
              <p className="pfaq-answer">{item.answer}</p>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        ))}
      </AccordionPrimitive.Root>
    </div>
  );
}
