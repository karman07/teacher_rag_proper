'use client';

import { motion } from 'framer-motion';
import Container from './common/Container';
import SectionHeader from './common/SectionHeader';
import { Card, CardBody, Button } from '@heroui/react';
import { Shield, Building2, Workflow, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const BENEFITS = [
  {
    icon: Building2,
    title: "Scalable Across Departments",
    description: "Easily deploy TeachAI across your entire institution. Centralized billing and management for IT teams."
  },
  {
    icon: Shield,
    title: "Secure and Compliant",
    description: "Built to meet strict educational privacy standards (FERPA). We never train public AI models on your data."
  },
  {
    icon: Workflow,
    title: "Easy Onboarding",
    description: "Works with Google Drive and integrates seamlessly with major LMS platforms like Canvas, Moodle, and Blackboard."
  }
];

export default function B2BSection() {
  return (
    <section className="py-24 bg-slate-50 dark:bg-[#080f1e] border-y border-slate-200 dark:border-slate-800">
      <Container>
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-12 lg:gap-20 items-center">
          
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <SectionHeader
              badge="For Institutions"
              title={<>Deploy TeachAI at <span className="text-blue-600 dark:text-blue-400">Scale</span></>}
              subtitle="Empower your faculty with the tools they need to succeed, while maintaining complete control over data and security."
              align="left"
            />
            <Button
              as={Link}
              href="/demo"
              color="primary"
              size="lg"
              endContent={<ArrowRight size={18} />}
              className="mt-8 font-bold px-8 h-14 rounded-2xl shadow-lg shadow-blue-500/20 text-white"
            >
              Book a Demo for Your School
            </Button>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.6 }}
                  className={i === 0 ? "sm:col-span-2" : ""}
                >
                  <Card className="h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:-translate-y-1 transition-transform">
                    <CardBody className="p-8">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                        <Icon size={24} />
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{b.title}</h3>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{b.description}</p>
                    </CardBody>
                  </Card>
                </motion.div>
              );
            })}
          </div>

        </div>
      </Container>
    </section>
  );
}
