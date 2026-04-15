'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card, CardBody } from '@heroui/react';
import SectionHeader from './common/SectionHeader';
import Container from './common/Container';

type Testimonial = {
  name: string;
  role: string;
  institution: string;
  content: string;
  rating: number;
  avatar: string;
  color: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Dr. Sarah Chen',
    role: 'Professor of Computer Science',
    institution: 'MIT',
    content:
      'TeachAI has revolutionized how I handle student questions. The RAG system accurately references my lecture notes and course materials, giving students contextually relevant answers at any hour.',
    rating: 5,
    avatar: 'SC',
    color: 'from-violet-500 to-purple-600',
  },
  {
    name: 'James Okeith',
    role: 'High School Biology Teacher',
    institution: 'Lincoln Academy',
    content:
      'The analytics dashboard gives me insight I never had before. I can see exactly where students struggle the most and adjust my lessons accordingly. Student outcomes have improved measurably.',
    rating: 5,
    avatar: 'JO',
    color: 'from-blue-500 to-cyan-600',
  },
  {
    name: 'Prof. Amara Nwosu',
    role: 'Dean of Engineering',
    institution: 'Stanford University',
    content:
      'We deployed TeachAI across our entire engineering faculty. The ability to upload syllabi, textbooks, and problem sets so the AI can reference them precisely is a game-changer for university scale.',
    rating: 5,
    avatar: 'AN',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    name: 'Maria Gonzalez',
    role: 'ESL Curriculum Designer',
    institution: 'Global Language Institute',
    content:
      'Our students are across 40 time zones. TeachAI gives every learner a patient, consistent experience 24/7. The multilingual support and context-aware answers have been invaluable.',
    rating: 5,
    avatar: 'MG',
    color: 'from-rose-500 to-pink-600',
  },
  {
    name: 'Dr. Kevin Tanaka',
    role: 'Physics Lecturer',
    institution: 'University of Tokyo',
    content:
      'Setting up was surprisingly fast — I had my course documents uploaded and the AI trained to my syllabus in under an hour. Students now get accurate, cited answers instead of generic web results.',
    rating: 5,
    avatar: 'KT',
    color: 'from-amber-500 to-orange-600',
  },
  {
    name: 'Priya Sharma',
    role: 'Instructional Designer',
    institution: 'EdTech Solutions Ltd',
    content:
      'We have integrated TeachAI into three different LMS platforms for our clients. The API is clean and the white-labeling options let us maintain our brand while offering cutting-edge AI support.',
    rating: 5,
    avatar: 'PS',
    color: 'from-indigo-500 to-blue-600',
  },
];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function Testimonials() {
  return (
    <section
      id="testimonials"
      className="py-24 bg-slate-50 dark:bg-[#080f1e]"
    >
      <Container>
        <SectionHeader
          badge="Testimonials"
          title={
            <>
              Trusted by{' '}
              <span className="gradient-text">World-Class Educators</span>
            </>
          }
          subtitle="Hear how TeachAI is saving teachers hours each week while improving student outcomes."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div key={t.name} variants={cardVariants}>
              <Card
                shadow="none"
                classNames={{
                  base: 'h-full border border-slate-200/80 dark:border-slate-700/40 bg-white dark:bg-slate-800/50 hover:border-blue-300/50 dark:hover:border-blue-500/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
                }}
              >
                <CardBody className="p-6 flex flex-col gap-4">
                  {/* Stars */}
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className="fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="relative flex-1">
                    <Quote
                      size={28}
                      className="text-blue-200 dark:text-blue-800/60 mb-2"
                    />
                    <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                      {t.content}
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center shrink-0`}
                    >
                      <span className="text-xs font-bold text-white">{t.avatar}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {t.role} · {t.institution}
                      </p>
                    </div>
                  </div>
                </CardBody>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </Container>
    </section>
  );
}
