'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Zap, ArrowRight } from 'lucide-react';
import { Button, Card, CardBody, CardHeader, CardFooter, Chip } from '@heroui/react';
import SectionHeader from './common/SectionHeader';
import Container from './common/Container';

type Plan = {
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted: boolean;
  badge?: string;
};

const PLANS: Plan[] = [
  {
    name: 'Starter',
    price: '0',
    period: 'forever',
    description: 'Perfect for individual teachers exploring AI-assisted teaching.',
    features: [
      'Up to 3 course spaces',
      '50 student Q&A per day',
      '100 MB document storage',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Get Started Free',
    href: '/signup',
    highlighted: false,
  },
  {
    name: 'Pro',
    price: '29',
    period: 'per month',
    description: 'For educators who want the full power of AI for their courses.',
    features: [
      'Unlimited course spaces',
      'Unlimited student Q&A',
      '10 GB document storage',
      'Advanced analytics & insights',
      'Priority support',
      'Custom AI persona',
      'LMS integrations',
    ],
    cta: 'Start Pro Trial',
    href: '/signup?plan=pro',
    highlighted: true,
    badge: 'Most Popular',
  },
  {
    name: 'Institution',
    price: '99',
    period: 'per month',
    description: 'For universities and schools deploying AI at scale.',
    features: [
      'Everything in Pro',
      'Unlimited instructors',
      'Unlimited storage',
      'White-label options',
      'SSO / SAML',
      'Dedicated account manager',
      'SLA guarantee',
    ],
    cta: 'Contact Sales',
    href: '/contact',
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="py-24 bg-white dark:bg-slate-900"
    >
      <Container>
        <SectionHeader
          badge="Pricing"
          title={
            <>
              Simple,{' '}
              <span className="gradient-text">Transparent Pricing</span>
            </>
          }
          subtitle="Start for free. Upgrade as your courses grow. No hidden fees."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex"
            >
              <Card
                shadow="none"
                classNames={{
                  base: plan.highlighted
                    ? 'flex-1 border-2 border-blue-500 dark:border-blue-400 ring-4 ring-blue-100 dark:ring-blue-900/30 bg-white dark:bg-slate-800/80 relative'
                    : 'flex-1 border border-slate-200/80 dark:border-slate-700/40 bg-white dark:bg-slate-800/50',
                }}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Chip
                      color="primary"
                      variant="solid"
                      size="sm"
                      startContent={<Zap size={12} className="ml-1" />}
                      classNames={{ content: 'font-bold pr-1' }}
                    >
                      {plan.badge}
                    </Chip>
                  </div>
                )}

                <CardHeader className="flex flex-col items-start gap-2 px-6 pt-8 pb-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                    {plan.name}
                  </p>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                      {plan.price === '0' ? 'Free' : '$' + plan.price}
                    </span>
                    {plan.price !== '0' && (
                      <span className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                        /{plan.period}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardBody className="px-6 py-5">
                  <ul className="space-y-3">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                          <Check size={10} className="text-blue-600 dark:text-blue-400 stroke-[3]" />
                        </span>
                        <span className="text-sm text-slate-700 dark:text-slate-300">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </CardBody>

                <CardFooter className="px-6 pb-8 pt-0">
                  <Button
                    as={Link}
                    href={plan.href}
                    color={plan.highlighted ? 'primary' : 'default'}
                    variant={plan.highlighted ? 'solid' : 'bordered'}
                    fullWidth
                    size="md"
                    endContent={<ArrowRight size={16} />}
                    className={
                      plan.highlighted
                        ? 'font-semibold shadow-lg shadow-blue-500/25'
                        : 'font-semibold border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                    }
                  >
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Enterprise note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center text-sm text-slate-500 dark:text-slate-400 mt-10"
        >
          All plans include a 14-day free trial. No credit card required.{' '}
          <Link href="/contact" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
            Need a custom plan?
          </Link>
        </motion.p>
      </Container>
    </section>
  );
}
