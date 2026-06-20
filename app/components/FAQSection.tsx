'use client';

import { motion } from 'framer-motion';
import { Accordion, AccordionItem } from '@heroui/react';
import Container from './common/Container';
import SectionHeader from './common/SectionHeader';

const FAQS = [
  {
    question: "How long does setup take?",
    answer: "Setup takes less than 5 minutes. You simply upload your course PDFs, slides, or connect your Google Drive folder, and VTA instantly starts learning your curriculum."
  },
  {
    question: "Do students need to create accounts?",
    answer: "Yes, students have a simple onboarding process so they can save their chat history and receive personalized support across multiple classes."
  },
  {
    question: "Is our data secure?",
    answer: "Absolutely. We employ institutional-grade security. Your course materials are siloed to your classroom, and we never use your data to train external public AI models."
  },
  {
    question: "Can this integrate with our LMS?",
    answer: "Yes, VTA supports seamless integrations with major Learning Management Systems like Canvas, Moodle, and Blackboard, ensuring a unified experience for students."
  }
];

export default function FAQSection() {
  return (
    <section className="py-24 bg-white dark:bg-[#03070f]">
      <Container className="max-w-4xl">
        <SectionHeader
          badge="FAQ"
          title={<>Frequently Asked <span className="text-blue-600 dark:text-blue-400">Questions</span></>}
          subtitle="Everything you need to know about getting started with VTA."
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
                className="bg-slate-50 dark:bg-slate-800/50 shadow-none border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-2xl"
              >
                <p className="text-slate-600 dark:text-slate-400 pb-4 leading-relaxed">
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
