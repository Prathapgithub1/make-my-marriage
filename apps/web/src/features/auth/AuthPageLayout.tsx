import type { PropsWithChildren, ReactNode } from 'react';
import { Link } from 'react-router';
import { BrandLockup } from '../home/components/BrandMark';
import { SignupPreviewCard } from './SignupPreviewCard';

type AuthPageLayoutProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  eyebrow: string;
  intro: string;
  footer?: ReactNode;
  id: string;
}>;

export function AuthPageLayout({
  title,
  subtitle,
  eyebrow,
  intro,
  footer,
  id,
  children,
}: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen bg-canvas font-sans text-ink antialiased">
      <a
        className="fixed left-3 top-3 z-50 -translate-y-[160%] rounded-lg bg-primary px-4 py-3 text-white focus:translate-y-0"
        href={`#${id}`}
      >
        Skip to form
      </a>
      <header className="border-b border-outline bg-canvas/95">
        <div className="mx-auto flex min-h-16 w-[min(calc(100%_-_24px),_1080px)] items-center justify-between gap-3">
          <Link
            aria-label="Make My Marriage home"
            className="inline-flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary"
            to="/"
          >
            <BrandLockup compact />
          </Link>
          <Link className="text-xs font-medium text-muted hover:text-primary sm:text-sm" to="/">
            Explore the platform{' '}
            <span aria-hidden="true" className="ml-1 text-primary">
              →
            </span>
          </Link>
        </div>
      </header>
      <main
        className="mx-auto grid w-[min(calc(100%_-_24px),_1080px)] items-start gap-7 py-7 sm:py-9 lg:grid-cols-[1.08fr_0.92fr] lg:gap-9 lg:py-12"
        id={id}
      >
        <section aria-labelledby={`${id}-intro-title`} className="pt-1 lg:pt-2">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-[#c9d4c2] bg-[#e7eee1] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-sage sm:text-xs">
            <span aria-hidden="true" className="size-2 rounded-full bg-sage" />
            {eyebrow}
          </p>
          <h1
            className="mt-4 max-w-4xl font-serif text-[clamp(2.025rem,3.75vw,3.1875rem)] font-medium leading-[1.08] tracking-[-0.045em] text-ink"
            id={`${id}-intro-title`}
          >
            Your wedding plans, <em className="font-normal">all in one place.</em>
          </h1>
          <p className="mt-4 max-w-2xl text-[13.5px] leading-6 text-muted sm:text-[15px] sm:leading-[27px]">
            {intro}
          </p>
          <SignupPreviewCard />
          <p className="mt-2 text-right text-[10px] text-muted">
            Illustrative dashboard preview · sample names, events, and progress.
          </p>
        </section>
        <section
          aria-labelledby={`${id}-form-title`}
          className="mx-auto w-full max-w-[420px] rounded-2xl border border-outline bg-surface p-5 shadow-[0_4px_18px_rgba(37,39,35,0.04)] sm:p-6 lg:p-7"
        >
          <div className="mb-5">
            <h2
              className="font-serif text-[22px] font-semibold tracking-[-0.03em] text-ink sm:text-[27px]"
              id={`${id}-form-title`}
            >
              {title}
            </h2>
            <p className="mt-1.5 text-xs leading-5 text-muted">{subtitle}</p>
          </div>
          {children}
          {footer && (
            <div className="mt-5 border-t border-line pt-4 text-center text-xs leading-5 text-muted">
              {footer}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
