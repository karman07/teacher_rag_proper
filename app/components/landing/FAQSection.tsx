'use client';

import { motion } from 'framer-motion';
import { Accordion, AccordionItem } from '@heroui/react';
import Container from '../common/Container';
import SectionHeader from '../common/SectionHeader';

const FAQS = [
  {
    question: "Is this free?",
    answer: "Yes, completely free for students."
  },
  {
    question: "What materials work?",
    answer: "PDFs, notes, textbooks, and lecture material. The AI can read and understand them all."
  },
  {
    question: "Is my data safe?",
    answer: "Yes. We only use your classroom content to answer your questions. We do not train external models on your private notes."
  }
];

export default function FAQSection() {
  return (
    <section className="py-24 bg-[#fafcff] dark:bg-[#03070f]">
      <Container className="max-w-4xl">
        <SectionHeader
          badge="FAQ"
          title={<>Frequently Asked <span className="text-blue-600 dark:text-blue-400">Questions</span></>}
          subtitle="Everything you need to know about getting started with Study Assistant."
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-16"
        >
          <Accordion variant="splitted" className="gap-4">
            {FAQS.map((faq, index) => (
               <AccordionItem
                key={index}
                aria-label={faq.question}
                title={<span className="font-semibold text-lg">{faq.question}</span>}
                className="bg-white dark:bg-slate-800/50 shadow-sm border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl"
              >
                <p className="text-slate-600 dark:text-slate-400 pb-4 leading-relaxed font-medium">
                  {faq.answer}
                </p>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </Container>
    </section>
  );
}
