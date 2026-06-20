'use client';

import { motion } from 'framer-motion';
import { Accordion, AccordionItem } from '@heroui/react';
import Container from '../common/Container';
import SectionHeader from '../common/SectionHeader';

const FAQS = [
  {
    question: "What can I do with VTA?",
    answer: "You can ask questions from your class notes, PDFs, and lecture material, then get clear answers with source-backed references so you can verify where each answer came from."
  },
  {
    question: "What study materials are supported?",
    answer: "The platform works with course PDFs, lecture notes, slides, and textbook-style material shared in your classroom workspace."
  },
  {
    question: "How are answers made reliable?",
    answer: "Responses are generated from your classroom content and paired with citations, so you can cross-check the exact source instead of relying on generic web answers."
  },
  {
    question: "Is my data private?",
    answer: "Yes. Your questions and classroom materials stay within your learning workspace and are used only to support your study experience."
  },
  {
    question: "How long does setup take?",
    answer: "Most students can get started in a couple of minutes: sign up, join your class, and begin asking questions right away."
  },
  {
    question: "Do I need technical knowledge to use it?",
    answer: "No technical setup is required. If you can type a question, you can use VTA effectively."
  },
  {
    question: "Can I use it for exam prep?",
    answer: "Yes. It is designed for revision, concept clarification, and quick source-based lookups before quizzes and exams."
  },
  {
    question: "How do I join my class?",
    answer: "After signing in, you can join using your class invite or join code provided by your teacher, then access all assigned materials in one place."
  },
];

export default function FAQSection() {
  return (
    <section className="py-20 bg-[#fafcff]">
      <Container className="max-w-3xl">
        <SectionHeader
          badge="FAQ"
          title={<>Frequently Asked <span className="text-blue-600">Questions</span></>}
          subtitle="Everything you need to know about getting started with VTA."
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mt-12"
        >
          <Accordion
            variant="splitted"
            className="gap-3"
            itemClasses={{
              base: "bg-white shadow-sm border border-slate-200 rounded-xl px-2",
              title: "text-slate-900 font-semibold text-base text-left",
              trigger: "py-4 px-4 min-h-0",
              indicator: "text-slate-500 rotate-[-90deg] data-[open=true]:rotate-0 transition-transform duration-200",
              content: "px-4 pb-4 pt-0 text-slate-600 leading-relaxed font-medium text-sm",
            }}
          >
            {FAQS.map((faq) => (
               <AccordionItem
                key={faq.question}
                aria-label={faq.question}
                title={faq.question}
              >
                <p>
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
