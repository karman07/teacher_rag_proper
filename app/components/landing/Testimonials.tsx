'use client';

import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { Card, CardBody } from '@heroui/react';
import SectionHeader from '../common/SectionHeader';
import Container from '../common/Container';

type Testimonial = {
  name: string;
  course: string;
  content: string;
  rating: number;
  avatar: string;
  color: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: '2nd year student',
    course: 'Computer Science',
    content:
      'I stopped re-reading notes 5 times. This just explains it perfectly and points exactly to the page I need to study.',
    rating: 5,
    avatar: 'S',
    color: 'from-indigo-500 to-blue-600',
  },
  {
    name: 'B.Tech student',
    course: 'Mechanical Engineering',
    content:
      "Saves me hours before exams. I just upload my professor's slides and ask it to test me on the core concepts.",
    rating: 5,
    avatar: 'A',
    color: 'from-emerald-500 to-teal-600',
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
    <section id="testimonials" className="py-24 bg-white border-y border-slate-100">
      <Container>
        <SectionHeader
          badge="Testimonials"
          title={
            <>
              Used by students across{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">every major</span>
            </>
          }
          subtitle="Hear how Study Assistant is saving students hours each week while improving their grades."
        />

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div key={t.name} variants={cardVariants}>
              <Card
                shadow="none"
                classNames={{
                  base: 'h-full border border-slate-200/80 bg-[#fafcff] hover:border-blue-300/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300',
                }}
              >
                <CardBody className="p-8 flex flex-col gap-6">
                  {/* Stars */}
                  <div className="flex gap-1">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className="fill-amber-400 text-amber-400"
                      />
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="relative flex-1">
                    <Quote
                      size={28}
                      className="text-blue-200 mb-2"
                    />
                    <p className="text-slate-700 text-lg font-semibold leading-relaxed">
                      "{t.content}"
                    </p>
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center shrink-0`}
                    >
                      <span className="text-sm font-bold text-white">{t.avatar}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {t.name}
                      </p>
                      <p className="text-xs font-medium text-slate-500 truncate">
                        {t.course}
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
