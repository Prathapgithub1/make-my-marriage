import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ApiRequestError } from '../../lib/api-client';
import { useAuth } from '../auth/AuthProvider';
import { BrandLockup } from '../../components/BrandMark';
import { createWedding } from './weddingApi';
import { weddingSetupSchema, type WeddingSetupFormValues } from './weddingFormSchema';
import { calculateDaysRemaining } from './DashboardPage';
import weddingHeroImage from '../../assets/images/wedding-hero.jpg';

function getHeroImageSrc(): string {
  if (weddingHeroImage) return weddingHeroImage;
  if (typeof document !== 'undefined') {
    const link = document.getElementById('wedding-hero-preload') as HTMLLinkElement | null;
    if (link?.href) return link.href;
  }
  return '';
}

export function WeddingSetupPage() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState('');

  const initialPartner1 = session?.user.displayName ?? session?.user.name ?? '';

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<WeddingSetupFormValues>({
    resolver: zodResolver(weddingSetupSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      brideName: initialPartner1,
      groomName: '',
      weddingDate: '',
      location: '',
      city: '',
      state: '',
      country: '',
      description: '',
    },
  });

  const watchedDate = useWatch({ control, name: 'weddingDate' });
  const watchedLocation = useWatch({ control, name: 'location' });

  // Calculate live countdown for editorial card preview
  const liveCountdown = useMemo(() => {
    return calculateDaysRemaining(watchedDate);
  }, [watchedDate]);

  const formattedDatePreview = useMemo(() => {
    if (!watchedDate) return null;
    const d = new Date(watchedDate);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }, [watchedDate]);

  const onSubmit = async (values: WeddingSetupFormValues) => {
    setServerError('');
    try {
      const created = await createWedding({
        title: values.title,
        brideName: values.brideName,
        groomName: values.groomName,
        weddingDate: values.weddingDate ? values.weddingDate : null,
        location: values.location ? values.location : null,
        city: values.city ? values.city : null,
        state: values.state ? values.state : null,
        country: values.country ? values.country : null,
        description: values.description ? values.description : null,
      });

      // Update session query cache immediately so ProtectedRoute recognizes hasWedding = true
      if (session) {
        queryClient.setQueryData(['auth', 'me'], {
          ...session,
          hasWedding: true,
          membership: { role: 'ADMIN' },
          wedding: {
            id: created.id,
            title: created.title,
            brideName: created.brideName,
            groomName: created.groomName,
            weddingDate: created.weddingDate,
            location: created.location,
          },
        });
      }

      // Invalidate queries to refresh dashboard data
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });

      navigate('/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof ApiRequestError) {
        if (error.code === 'ALREADY_HAS_WEDDING') {
          // User already has a wedding, route them directly to dashboard
          queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
          navigate('/dashboard', { replace: true });
          return;
        }

        if (error.code === 'VALIDATION_ERROR' && error.details) {
          Object.entries(error.details).forEach(([field, msg]) => {
            setError(field as keyof WeddingSetupFormValues, {
              type: 'server',
              message: String(msg),
            });
          });
          setServerError('Please review the errors highlighted below.');
          return;
        }

        setServerError(error.message);
      } else {
        setServerError(
          'Unable to create wedding workspace. Please check your connection and try again.',
        );
      }
    }
  };

  const userInitials = useMemo(() => {
    const name = session?.user.displayName ?? session?.user.name ?? session?.user.email ?? 'W';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }, [session]);

  const userName = session?.user.displayName ?? session?.user.name ?? 'Valued Member';
  const userEmail = session?.user.email ?? '';
  const heroImageSrc = getHeroImageSrc();

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#fafaf3] text-[#1a1c18] antialiased">
      {/* Top Header Navigation */}
      <header className="w-full bg-white border-b border-[#e3e3dc]/60 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10 h-16 flex items-center justify-between">
          <BrandLockup />

          {/* Authenticated User Pill & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-[#f4f4ed] pl-2 pr-3.5 py-1.5 rounded-full border border-[#d8c2bb]/40">
              <div className="w-7 h-7 rounded-full bg-[#8a4b35]/10 text-[#8a4b35] border border-[#8a4b35]/20 flex items-center justify-center font-semibold text-xs">
                {userInitials}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-semibold text-[#1a1c18] leading-tight">
                  {userName}
                </span>
                <span className="text-[11px] text-[#556251] leading-tight">{userEmail}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate('/login', { replace: true });
              }}
              className="text-xs font-medium text-[#53433e] hover:text-[#8a4b35] px-2.5 py-1.5 rounded-lg border border-[#d8c2bb]/40 hover:bg-[#eeeee8] transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10 py-8 md:py-12 flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left / Form Section (7 cols on desktop) */}
          <section className="lg:col-span-7 flex flex-col justify-center">
            <div className="bg-white rounded-2xl border border-[#d8c2bb]/40 p-6 sm:p-8 md:p-10 shadow-[0_4px_24px_rgba(37,39,35,0.03)]">
              {/* Step indicator badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d9e7d2] text-[#3e4a3b] text-xs font-semibold w-fit mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#556251]"></span>
                Step 1 of 1 • Workspace Setup
              </div>

              {/* Page Heading & Editorial Introduction */}
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1a1c18] mb-2 tracking-tight font-medium">
                Let's plan your special day
              </h1>
              <p className="text-sm sm:text-base text-[#53433e] max-w-xl mb-8 leading-relaxed">
                Create your wedding workspace and bring every detail of your celebration together in
                one serene place.
              </p>

              {serverError && (
                <div
                  aria-live="polite"
                  className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800"
                  role="alert"
                >
                  <p className="font-semibold">Setup could not be completed</p>
                  <p className="mt-1">{serverError}</p>
                </div>
              )}

              {/* Onboarding Form */}
              <form className="space-y-5" noValidate onSubmit={handleSubmit(onSubmit)}>
                {/* Wedding Name Input */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-baseline">
                    <label
                      className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
                      htmlFor="title"
                    >
                      Wedding name <span className="text-[#8a4b35]">*</span>
                    </label>
                    <span className="text-xs text-[#86736d]">Workspace display name</span>
                  </div>
                  <input
                    {...register('title')}
                    id="title"
                    type="text"
                    placeholder="e.g., Prathap & Akshitha's Wedding"
                    aria-invalid={Boolean(errors.title)}
                    className={`w-full min-h-11 px-3.5 bg-white border rounded-lg text-sm text-[#1a1c18] placeholder:text-[#86736d] outline-none transition-all ${
                      errors.title
                        ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                        : 'border-[#d8c2bb]/70 focus:border-[#8a4b35] focus:ring-4 focus:ring-[#8a4b35]/10'
                    }`}
                  />
                  {errors.title ? (
                    <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                      {errors.title.message}
                    </p>
                  ) : (
                    <p className="text-xs text-[#53433e]">
                      This will name your shared workspace and member portal.
                    </p>
                  )}
                </div>

                {/* Couple's Names: Two side-by-side inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Partner 1 */}
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
                      htmlFor="brideName"
                    >
                      Partner 1 (You) <span className="text-[#8a4b35]">*</span>
                    </label>
                    <input
                      {...register('brideName')}
                      id="brideName"
                      type="text"
                      placeholder="e.g., Akshitha Rao"
                      aria-invalid={Boolean(errors.brideName)}
                      className={`w-full min-h-11 px-3.5 bg-white border rounded-lg text-sm text-[#1a1c18] placeholder:text-[#86736d] outline-none transition-all ${
                        errors.brideName
                          ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-[#d8c2bb]/70 focus:border-[#8a4b35] focus:ring-4 focus:ring-[#8a4b35]/10'
                      }`}
                    />
                    {errors.brideName && (
                      <p className="text-xs text-red-600 mt-1">{errors.brideName.message}</p>
                    )}
                  </div>

                  {/* Partner 2 */}
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
                      htmlFor="groomName"
                    >
                      Partner 2 <span className="text-[#8a4b35]">*</span>
                    </label>
                    <input
                      {...register('groomName')}
                      id="groomName"
                      type="text"
                      placeholder="e.g., Prathap Kumar"
                      aria-invalid={Boolean(errors.groomName)}
                      className={`w-full min-h-11 px-3.5 bg-white border rounded-lg text-sm text-[#1a1c18] placeholder:text-[#86736d] outline-none transition-all ${
                        errors.groomName
                          ? 'border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-[#d8c2bb]/70 focus:border-[#8a4b35] focus:ring-4 focus:ring-[#8a4b35]/10'
                      }`}
                    />
                    {errors.groomName && (
                      <p className="text-xs text-red-600 mt-1">{errors.groomName.message}</p>
                    )}
                  </div>
                </div>

                {/* Wedding Date & Location Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Wedding Date Picker */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label
                        className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
                        htmlFor="weddingDate"
                      >
                        Wedding Date
                      </label>
                      {formattedDatePreview && (
                        <span className="text-xs text-[#8a4b35] font-semibold">
                          {formattedDatePreview}
                        </span>
                      )}
                    </div>
                    <input
                      {...register('weddingDate')}
                      id="weddingDate"
                      type="date"
                      className="w-full min-h-11 px-3.5 bg-white border border-[#d8c2bb]/70 rounded-lg text-sm text-[#1a1c18] outline-none focus:border-[#8a4b35] focus:ring-4 focus:ring-[#8a4b35]/10 transition-all"
                    />
                    <p className="text-xs text-[#53433e]">
                      Calculates your live planning countdown.
                    </p>
                  </div>

                  {/* Wedding Location / City */}
                  <div className="space-y-1.5">
                    <label
                      className="text-xs font-semibold uppercase tracking-wider text-[#1a1c18]"
                      htmlFor="location"
                    >
                      Wedding Location / City
                    </label>
                    <input
                      {...register('location')}
                      id="location"
                      type="text"
                      placeholder="e.g., Hyderabad • The Oberoi Udaivilas"
                      className="w-full min-h-11 px-3.5 bg-white border border-[#d8c2bb]/70 rounded-lg text-sm text-[#1a1c18] placeholder:text-[#86736d] outline-none focus:border-[#8a4b35] focus:ring-4 focus:ring-[#8a4b35]/10 transition-all"
                    />
                    <p className="text-xs text-[#53433e]">
                      Primary celebration city or destination.
                    </p>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-4">
                  <button
                    id="create-workspace-submit"
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full min-h-12 rounded-lg bg-[#8a4b35] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 hover:bg-[#a8624b] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-sm"
                  >
                    {isSubmitting ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v8H4z"
                          ></path>
                        </svg>
                        <span>Creating Workspace...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Wedding Workspace</span>
                        <span aria-hidden="true">→</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Reassurance Note */}
                <div className="flex items-center justify-center gap-2 pt-2 text-center">
                  <span className="text-sm">🔒</span>
                  <p className="text-xs text-[#53433e]">
                    Wedding details, dates, and locations can always be adjusted later in your
                    workspace settings.
                  </p>
                </div>
              </form>
            </div>
          </section>

          {/* Right / Editorial Visual Section (5 cols on desktop) */}
          <section className="lg:col-span-5 flex flex-col">
            <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden border border-[#d8c2bb]/50 shadow-[0_4px_24px_rgba(37,39,35,0.03)] bg-[#e8e9e2] wedding-hero-bg flex flex-col justify-end p-6 sm:p-8">
              {/* High-Resolution Editorial Nuptials Image */}
              {heroImageSrc ? (
                <img
                  src={heroImageSrc}
                  alt="Royal Indian wedding celebration portrait"
                  className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
                  loading="eager"
                />
              ) : null}

              {/* Subtle targeted gradient scrim for text readability without darkening the couple or architecture */}
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#1a1c18]/90 via-[#1a1c18]/30 via-50% to-transparent pointer-events-none"
                aria-hidden="true"
              />

              {/* Feature Highlights Pill Badge */}
              <div className="relative z-10 mb-4">
                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-[#1a1c18] border border-white/50 text-xs font-semibold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-[#8a4b35]"></span>
                  Events • Guest RSVPs • Expenses • Vendor Hub
                </span>
              </div>

              {/* Editorial Quote & Countdown Preview Box */}
              <div className="relative z-10 text-white">
                <div className="w-10 h-0.5 bg-[#f4ba9c] mb-3 rounded-full"></div>
                <blockquote className="font-serif text-xl sm:text-2xl lg:text-[1.65rem] italic leading-snug mb-2 font-normal text-white drop-shadow-sm">
                  “One central space for ceremonies, loved ones, and timeless memories.”
                </blockquote>
                <p className="font-sans text-xs sm:text-sm text-white/90 leading-relaxed mb-5 drop-shadow-xs">
                  Curated for discerning couples and boutique planners worldwide.
                </p>

                {/* Mini Live Countdown Preview Box */}
                <div className="pt-4 border-t border-white/20 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-sans font-semibold uppercase tracking-wider text-[#f4ba9c]">
                      Live Countdown
                    </p>
                    <p className="text-base sm:text-lg font-sans font-semibold text-white">
                      {liveCountdown !== null
                        ? liveCountdown >= 0
                          ? `${liveCountdown} Days to Celebration`
                          : `${Math.abs(liveCountdown)} Days Ago`
                        : 'Choose your wedding date'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs text-white border border-white/25 shadow-xs">
                      {watchedLocation?.trim() || 'Destination Sanctuary'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Shared Footer */}
      <footer className="w-full bg-[#fafaf3] border-t border-[#e3e3dc] py-6 mt-12">
        <div className="w-full max-w-[1360px] mx-auto px-4 sm:px-6 md:px-10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-[#53433e]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-[#8a4b35] text-sm">
              Make My Marriage
            </span>
            <span>•</span>
            <span>
              © 2025 Make My Marriage. Warm editorial minimalism for elevated celebrations.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#privacy" className="hover:text-[#8a4b35] transition-colors">
              Privacy Policy
            </a>
            <a href="#terms" className="hover:text-[#8a4b35] transition-colors">
              Terms of Service
            </a>
            <a href="#support" className="hover:text-[#8a4b35] transition-colors">
              Concierge Support
            </a>
            <a href="#journal" className="hover:text-[#8a4b35] transition-colors">
              Style Journal
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
