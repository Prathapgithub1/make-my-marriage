import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import weddingHeroImage from 'url:../../assets/images/wedding-hero.jpg';
import { BrandMark } from '../../components/BrandMark';
import {
  getPublicInvitation,
  submitPublicRsvp,
  type PublicInvitationSummary,
} from '../guests/guestsApi';

export function PublicInvitationPage() {
  const { token } = useParams<{ token: string }>();
  const queryClient = useQueryClient();

  const [rsvpStatus, setRsvpStatus] = useState<'ATTENDING' | 'NOT_ATTENDING'>('ATTENDING');
  const [attendingCount, setAttendingCount] = useState<number>(1);
  const [wishesNotes, setWishesNotes] = useState<string>('');
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditingExistingRsvp, setIsEditingExistingRsvp] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);

  // Web Audio Context for ambient ceremonial chime
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicTimerRef = useRef<number | null>(null);

  const heroImageSrc = useMemo(() => {
    if (weddingHeroImage && typeof weddingHeroImage === 'string') return weddingHeroImage;
    if (weddingHeroImage && typeof weddingHeroImage === 'object') {
      const def = (weddingHeroImage as unknown as { default?: string })?.default;
      if (def) return def;
    }
    if (typeof window !== 'undefined') {
      const preloadEl = document.getElementById('wedding-hero-preload') as HTMLLinkElement | null;
      if (preloadEl?.href) return preloadEl.href;
    }
    return '';
  }, []);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery<PublicInvitationSummary>({
    queryKey: ['public-invitation', token],
    queryFn: () => getPublicInvitation(token || ''),
    enabled: Boolean(token),
    retry: 1,
  });

  useEffect(() => {
    if (data?.guest) {
      if (data.guest.rsvpStatus === 'NOT_ATTENDING') {
        setRsvpStatus('NOT_ATTENDING');
        setAttendingCount(0);
      } else {
        setRsvpStatus('ATTENDING');
        setAttendingCount(data.guest.attendingCount > 0 ? data.guest.attendingCount : 1);
      }
    }
  }, [data]);

  const rsvpMutation = useMutation({
    mutationFn: (payload: {
      rsvpStatus: 'ATTENDING' | 'NOT_ATTENDING';
      attendingCount: number;
      notes?: string | null;
    }) => submitPublicRsvp(token || '', payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['public-invitation', token], updated);
      setIsSubmittedSuccess(true);
      setIsEditingExistingRsvp(false);
      setSubmitError(null);
    },
    onError: (err: Error) => {
      setSubmitError(err.message || 'Could not save your RSVP response. Please try again.');
    },
  });

  const wedding = data?.wedding;
  const guest = data?.guest;
  const invitedEvents = data?.invitedEvents || [];

  const formattedWeddingDate = useMemo(() => {
    if (!wedding?.weddingDate) return null;
    return new Date(wedding.weddingDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, [wedding?.weddingDate]);

  const weddingLocationString = useMemo(() => {
    if (!wedding) return '';
    return [wedding.location, wedding.city, wedding.state].filter(Boolean).join(', ');
  }, [wedding]);

  const formattedMonth = useMemo(() => {
    if (!wedding?.weddingDate) return 'Seasonal';
    return new Date(wedding.weddingDate).toLocaleDateString('en-US', { month: 'long' });
  }, [wedding?.weddingDate]);

  // Dynamic RSVP deadline: 7 days before wedding or fallback
  const rsvpDeadlineFormatted = useMemo(() => {
    if (!wedding?.weddingDate) return 'November 10, 2026';
    const d = new Date(wedding.weddingDate);
    d.setDate(d.getDate() - 7);
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }, [wedding?.weddingDate]);

  // Live countdown calculation
  const countdown = useMemo(() => {
    if (!wedding?.weddingDate) return { days: 142, hours: 18, minutes: 45 };
    const target = new Date(wedding.weddingDate).getTime();
    const now = Date.now();
    const diff = target - now;
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return { days, hours, minutes };
  }, [wedding?.weddingDate]);

  // Direct Google Calendar Add Event link
  const googleCalendarUrl = useMemo(() => {
    if (!wedding?.weddingDate) return null;
    const title = encodeURIComponent(`${wedding.brideName} & ${wedding.groomName}'s Wedding`);
    const dateFormatted = wedding.weddingDate.replace(/-/g, '');
    const dates = `${dateFormatted}/${dateFormatted}`;
    const location = encodeURIComponent(weddingLocationString || '');
    const details = encodeURIComponent(
      `Celebrating the wedding of ${wedding.brideName} and ${wedding.groomName} on Make My Marriage.`,
    );
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}&location=${location}`;
  }, [wedding, weddingLocationString]);

  // Ambient Ceremonial Chime Toggle (Offline safe Web Audio)
  const toggleMusic = () => {
    if (isPlayingMusic) {
      if (musicTimerRef.current) clearInterval(musicTimerRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => { });
        audioCtxRef.current = null;
      }
      setIsPlayingMusic(false);
      return;
    }

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;

      const pentatonicChimes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
      let step = 0;

      const playNote = () => {
        if (!ctx || ctx.state === 'closed') return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(
          pentatonicChimes[step % pentatonicChimes.length],
          ctx.currentTime,
        );
        step++;

        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.9);
      };

      playNote();
      musicTimerRef.current = window.setInterval(playNote, 1600);
      setIsPlayingMusic(true);
    } catch {
      setIsPlayingMusic(false);
    }
  };

  useEffect(() => {
    return () => {
      if (musicTimerRef.current) clearInterval(musicTimerRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => { });
    };
  }, []);

  const handleShare = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2500);
      }
    } catch {
      // fallback
    }
  };

  const scrollToRsvp = () => {
    const el = document.getElementById('rsvp-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full border-3 border-[#851321] border-t-transparent animate-spin mx-auto" />
          <p className="font-serif text-xl font-medium text-[#851321]">Opening your invitation...</p>
          <span className="text-xs uppercase tracking-[0.2em] text-[#86736D]">Make My Marriage</span>
        </div>
      </div>
    );
  }

  if (isError || !data || !guest || !wedding) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-[#EBE4DC] shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-[#FEF0F0] text-[#C0392B] flex items-center justify-center mx-auto border border-[#FADBD8]">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="font-serif text-2xl font-bold text-[#1A1C18]">Invitation Not Found</h2>
          <p className="text-sm text-[#86736D] leading-relaxed">
            This wedding invitation link is invalid, revoked, or has expired. Please contact the wedding couple or organizers for an updated link.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-block px-6 py-2.5 text-xs font-semibold rounded-xl bg-[#851321] text-white hover:bg-[#6D0F1B] transition-colors"
            >
              Go to Make My Marriage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const maxCapacity = guest.maxGuests ?? 1;
  const hasAlreadyResponded = guest.rsvpStatus === 'ATTENDING' || guest.rsvpStatus === 'NOT_ATTENDING';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    rsvpMutation.mutate({
      rsvpStatus,
      attendingCount: rsvpStatus === 'ATTENDING' ? attendingCount : 0,
      notes: wishesNotes.trim() || null,
    });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1C18] antialiased selection:bg-[#851321]/15">
      {/* 1. TOP FLOATING NAVIGATION BAR */}
      <nav className="fixed top-3 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-xl z-50">
        <div className="bg-white/90 backdrop-blur-md rounded-full px-4 py-2 border border-[#E8DFD5] shadow-md flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 font-serif font-bold text-[#1A1C18] tracking-wider uppercase text-[11px] truncate">
            <span className="w-2 h-2 rounded-full bg-[#851321]" />
            <span className="truncate tracking-wider font-semibold">
              {wedding.brideName.toUpperCase()} &amp; {wedding.groomName.toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Music ambient toggle */}
            <button
              type="button"
              onClick={toggleMusic}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${isPlayingMusic
                ? 'bg-[#851321]/10 text-[#851321] border-[#851321]/30 font-semibold'
                : 'bg-white text-[#6B5E59] border-[#E2D7CC] hover:bg-[#FAF7F2]'
                }`}
              title="Toggle celebratory music"
            >
              <svg
                className={`w-3.5 h-3.5 ${isPlayingMusic ? 'animate-pulse text-[#851321]' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12 0c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
              <span>{isPlayingMusic ? 'Playing' : 'Music'}</span>
            </button>

            {/* Direct RSVP scroll button */}
            <button
              type="button"
              onClick={scrollToRsvp}
              className="px-3.5 py-1 rounded-full text-[11px] font-semibold bg-[#851321] text-white hover:bg-[#6D0F1B] transition-colors shadow-xs cursor-pointer"
            >
              RSVP
            </button>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER (Centered luxury layout for mobile, tablet, and desktop) */}
      <main className="max-w-md sm:max-w-xl md:max-w-2xl mx-auto px-3 sm:px-4 pt-16 sm:pt-20 pb-16 space-y-6 sm:space-y-8">
        {/* 2. FULL-WIDTH PHOTOGRAPHIC HERO CARD */}
        <section className="relative rounded-[28px] sm:rounded-[36px] overflow-hidden shadow-2xl border border-[#E7DDD3] bg-[#2C1810]">
          {/* Hero Photograph with Dark-to-Light Vignette Overlays */}
          <div className="relative h-[480px] sm:h-[580px] w-full bg-[#2C1810] wedding-hero-bg">
            {!imageError && heroImageSrc ? (
              <img
                src={heroImageSrc}
                alt="Wedding Couple"
                onError={() => setImageError(true)}
                className="w-full h-full object-cover object-center filter brightness-[0.93] contrast-[1.04]"
                loading="eager"
              />
            ) : null}

            {/* Top gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/20 to-transparent pointer-events-none" />

            {/* Bottom gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

            {/* Top Overlay Badge & Header */}
            <div className="absolute top-6 inset-x-0 text-center space-y-2 pointer-events-none z-10 px-4">
              <div className="text-[11px] tracking-[0.25em] text-[#E5C378] font-serif font-semibold drop-shadow">
                ॥ श्री गणेशाय नमः ॥
              </div>

              {/* Monogram Crest M */}
              <div className="w-11 h-11 rounded-full bg-white/15 backdrop-blur-md border border-white/40 text-white flex items-center justify-center font-serif text-lg font-bold shadow-sm mx-auto">
                <BrandMark compact className="w-5 h-5 text-white" />
              </div>

              <div className="text-[10px] uppercase tracking-[0.25em] text-white/90 font-medium">
                Personal Guest Invitation
              </div>
            </div>

            {/* Bottom Overlay Wedding Details */}
            <div className="absolute bottom-12 inset-x-0 text-center space-y-2.5 z-10 px-4 sm:px-6">
              <div className="space-y-0.5">
                <p className="text-[10px] uppercase tracking-[0.22em] text-white/80 font-medium">
                  Together With Our Families
                </p>
                <p className="font-serif italic text-xs sm:text-sm text-white/90">
                  we invite you to celebrate our union
                </p>
              </div>

              {/* Couple's Names in Majestic Playfair Display */}
              <h1 className="font-serif text-3xl sm:text-5xl font-normal text-white tracking-tight drop-shadow-md">
                {wedding.brideName} &amp; {wedding.groomName}
              </h1>

              {/* Date & Location Pill */}
              <div className="pt-1">
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/45 backdrop-blur-md text-white/95 text-[11px] sm:text-xs border border-white/25 shadow-sm">
                  <svg className="w-3.5 h-3.5 text-[#E5C378] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span>
                    {formattedWeddingDate || 'Saturday, Dec 6, 2026'}
                    {weddingLocationString ? ` • ${weddingLocationString}` : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. FLOATING COUNTDOWN CARD (Overlaps bottom of hero) */}
        <section className="-mt-8 sm:-mt-10 relative z-20 px-3 sm:px-6">
          <div className="bg-white rounded-2xl shadow-xl border border-[#EBE4DC] p-4 sm:p-5 text-center space-y-2">
            <div className="grid grid-cols-3 divide-x divide-[#EFE7DE] items-center py-1">
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#851321] block">
                  {countdown.days}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#86736D] font-medium">
                  Days
                </span>
              </div>
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#851321] block">
                  {countdown.hours}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#86736D] font-medium">
                  Hours
                </span>
              </div>
              <div>
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#851321] block">
                  {countdown.minutes}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[#86736D] font-medium">
                  Mins
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#F2ECE4] flex items-center justify-center gap-1.5 text-xs text-[#86736D] font-serif italic">
              <svg className="w-3.5 h-3.5 text-[#851321]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>Until We Say I Do</span>
            </div>
          </div>
        </section>

        {/* 4. PERSONALIZED GUEST / FAMILY INVITATION CARD */}
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#EBE4DC] shadow-sm p-6 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
              Special Delivery
            </span>

            {/* Decorative Wax Seal / Envelope Icon */}
            <div className="w-7 h-7 rounded-full bg-[#FAF5EE] border border-[#E4D8CA] flex items-center justify-center text-[#851321]">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-semibold text-[#86736D] block">
              Warmly Invited
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1C18]">
              {guest.name}
            </h2>
          </div>

          {/* Warm Personalized Message */}
          <blockquote className="text-xs sm:text-sm text-[#695C56] italic font-serif leading-relaxed bg-[#FAF8F5] p-4 rounded-xl border border-[#EDE4D8]">
            &ldquo;Dear {guest.name}, your warmth, love, and presence have shaped our journey. Having you witness our union {wedding.city ? `in ${wedding.city}` : 'with us'} would mean the world to us.&rdquo;
          </blockquote>

          {/* Party Allowance & Table Reservation Badge */}
          <div className="bg-[#FAF8F5] rounded-xl p-3.5 border border-[#EDE4D8] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#E2D6C7] flex items-center justify-center text-[#851321]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#86736D] font-bold block">
                  Party Allowance
                </span>
                <span className="text-xs sm:text-sm font-bold text-[#1A1C18]">
                  Up to {maxCapacity} {maxCapacity === 1 ? 'Guest' : 'Guests'}
                </span>
              </div>
            </div>

            <span className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-white text-[#695C56] border border-[#E4D7CA] shadow-2xs">
              Table Reserved
            </span>
          </div>
        </section>

        {/* 5. CELEBRATIONS PROGRAM / WEDDING ITINERARY */}
        <section className="space-y-4">
          <div className="text-center space-y-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] font-semibold text-[#851321] block">
              Celebrations Program
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1C18]">
              The Wedding Itinerary
            </h2>
            <p className="text-xs sm:text-sm text-[#86736D] max-w-sm mx-auto">
              Please join us across {invitedEvents.length > 0 ? invitedEvents.length : 'the'} ceremonies of festivities, music, and love in {wedding.city || 'celebration'}.
            </p>
          </div>

          {/* Event Cards */}
          <div className="space-y-4 pt-1">
            {invitedEvents.map((event, idx) => {
              const isMainCeremony =
                idx === 1 ||
                /wedding|varmala|pheras|reception/i.test(event.name);

              const eventDateStr = event.startsAt
                ? new Date(event.startsAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
                : null;

              const eventTimeStr = event.startsAt
                ? new Date(event.startsAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })
                : null;

              const venueAddress = event.venueAddress || event.venueName || '';
              const mapUrl = venueAddress
                ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(venueAddress)}`
                : null;

              const eventCalendarUrl = event.startsAt
                ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
                  event.name,
                )}&details=${encodeURIComponent(
                  event.description || '',
                )}&location=${encodeURIComponent(venueAddress)}`
                : null;

              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-2xl sm:rounded-3xl border shadow-sm p-5 sm:p-6 space-y-4 relative overflow-hidden transition-all ${isMainCeremony ? 'border-[#851321]/40 ring-1 ring-[#851321]/20' : 'border-[#EBE4DC]'
                    }`}
                >
                  {/* Main Auspicious Ceremony Top Ribbon */}
                  {isMainCeremony && (
                    <div className="absolute top-0 right-0 bg-[#851321] text-white text-[10px] uppercase font-bold tracking-wider px-3.5 py-1 rounded-bl-xl shadow-xs">
                      Main Auspicious Ceremony
                    </div>
                  )}

                  {/* Header Row: Chip & Date/Time */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFF2EB] text-[#C05621] border border-[#FBD38D]">
                      Event 0{idx + 1}
                    </span>

                    {(eventDateStr || eventTimeStr) && (
                      <span className="text-xs text-[#86736D] font-medium flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-[#86736D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          {eventDateStr}
                          {eventDateStr && eventTimeStr ? ' • ' : ''}
                          {eventTimeStr}
                        </span>
                      </span>
                    )}
                  </div>

                  {/* Event Title & Description */}
                  <div className="space-y-1">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1C18]">
                      {event.name}
                    </h3>
                    {event.description && (
                      <p className="text-xs sm:text-sm text-[#695C56] leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </div>

                  {/* Two-Column Venue & Dress Code Block */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#F2ECE4] text-xs">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#86736D] font-bold block">
                        Venue
                      </span>
                      <span className="font-medium text-[#1A1C18] block truncate">
                        {event.venueName || wedding.location || 'To be announced'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#86736D] font-bold block">
                        Dress Code
                      </span>
                      <span className="font-medium text-[#1A1C18] block truncate">
                        {event.dressCode || 'Royal Festive'}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons: Add to Calendar & Map/Directions */}
                  <div className="grid grid-cols-2 gap-2.5 pt-1">
                    {eventCalendarUrl ? (
                      <a
                        href={eventCalendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${isMainCeremony
                          ? 'bg-[#851321] text-white hover:bg-[#6D0F1B] shadow-xs'
                          : 'bg-white text-[#1A1C18] border border-[#DED4C8] hover:bg-[#FAF7F2]'
                          }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span>Add to Calendar</span>
                      </a>
                    ) : (
                      <div />
                    )}

                    {mapUrl ? (
                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl text-xs font-semibold bg-white text-[#1A1C18] border border-[#DED4C8] hover:bg-[#FAF7F2] flex items-center justify-center gap-1.5 transition-all"
                      >
                        <svg className="w-3.5 h-3.5 text-[#851321]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                        </svg>
                        <span>{isMainCeremony ? 'Directions' : 'Map'}</span>
                      </a>
                    ) : (
                      <div />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. RSVP SECTION ("Will you be joining us?") */}
        <section
          id="rsvp-section"
          className="bg-white rounded-2xl sm:rounded-3xl border border-[#EBE4DC] shadow-sm p-6 sm:p-8 space-y-6 scroll-mt-20"
        >
          <div className="text-center space-y-1">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] font-semibold text-[#851321] block">
              Kindly Respond
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1A1C18]">
              Will you be joining us?
            </h2>
            <p className="text-xs sm:text-sm text-[#86736D]">
              Please confirm by {rsvpDeadlineFormatted}.
            </p>
          </div>

          {/* Submission Success Toast */}
          {isSubmittedSuccess && (
            <div className="p-5 bg-[#EDF7EE] border border-[#C8E6C9] rounded-2xl text-center space-y-2 animate-in fade-in">
              <div className="w-10 h-10 rounded-full bg-[#2E7D32] text-white flex items-center justify-center mx-auto text-base shadow-xs">
                ✓
              </div>
              <h3 className="font-serif text-lg font-bold text-[#1E5622]">
                Thank you! Your RSVP is saved.
              </h3>
              <p className="text-xs sm:text-sm text-[#2E7D32]/90 max-w-md mx-auto">
                {rsvpStatus === 'ATTENDING'
                  ? `We are delighted to confirm your party of ${attendingCount} for the celebrations!`
                  : 'We understand and will miss having you celebrate with us.'}
              </p>
            </div>
          )}

          {/* Already Responded Overview with Toggle */}
          {hasAlreadyResponded && !isSubmittedSuccess && !isEditingExistingRsvp && (
            <div className="p-5 bg-[#FAF8F5] border border-[#EDE4D8] rounded-2xl text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white border border-[#E0D4C7] text-[#851321]">
                <span className="w-2 h-2 rounded-full bg-[#851321]" />
                <span>Existing RSVP Recorded</span>
              </div>
              <div className="font-serif text-xl font-bold text-[#1A1C18]">
                {guest.rsvpStatus === 'ATTENDING'
                  ? `Attending with ${guest.attendingCount} ${guest.attendingCount === 1 ? 'Guest' : 'Guests'}`
                  : 'Regretfully Declined'}
              </div>
              <p className="text-xs text-[#86736D]">
                Need to adjust your attendance or headcount?
              </p>
              <button
                type="button"
                onClick={() => setIsEditingExistingRsvp(true)}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-white text-[#851321] border border-[#851321] hover:bg-[#851321] hover:text-white transition-all shadow-2xs cursor-pointer"
              >
                Change My Response
              </button>
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="p-3.5 bg-[#FEF0F0] border border-[#FADBD8] rounded-xl text-xs text-[#C0392B] text-center font-medium">
              {submitError}
            </div>
          )}

          {/* Interactive Response Form */}
          {(!hasAlreadyResponded || isSubmittedSuccess || isEditingExistingRsvp) && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Joyfully Accept vs Regretfully Decline Choice Cards */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setRsvpStatus('ATTENDING');
                    if (attendingCount === 0) setAttendingCount(1);
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border text-center transition-all cursor-pointer relative ${rsvpStatus === 'ATTENDING'
                    ? 'bg-[#FBF6EE] border-[#851321] ring-2 ring-[#851321]/20 font-bold shadow-xs'
                    : 'bg-[#FAF8F5] border-[#E0D7CC] text-[#786C66] hover:bg-white hover:border-[#C5A880]'
                    }`}
                >
                  <div className="w-7 h-7 rounded-full mx-auto mb-2 flex items-center justify-center border border-[#851321] text-[#851321] bg-white">
                    ✓
                  </div>
                  <div className="font-serif text-base sm:text-lg font-bold text-[#1A1C18]">
                    Joyfully Accept
                  </div>
                  <div className="text-[11px] font-normal text-[#6B5E59] mt-0.5">Attending</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRsvpStatus('NOT_ATTENDING')}
                  className={`p-4 sm:p-5 rounded-2xl border text-center transition-all cursor-pointer relative ${rsvpStatus === 'NOT_ATTENDING'
                    ? 'bg-[#FDF2F2] border-[#C0392B] ring-2 ring-[#C0392B]/20 font-bold shadow-xs'
                    : 'bg-[#FAF8F5] border-[#E0D7CC] text-[#786C66] hover:bg-white hover:border-[#C5A880]'
                    }`}
                >
                  <div className="w-7 h-7 rounded-full mx-auto mb-2 flex items-center justify-center border border-[#C0392B] text-[#C0392B] bg-white">
                    ✕
                  </div>
                  <div className="font-serif text-base sm:text-lg font-bold text-[#1A1C18]">
                    Regretfully Decline
                  </div>
                  <div className="text-[11px] font-normal text-[#6B5E59] mt-0.5">Sending Love</div>
                </button>
              </div>

              {/* Headcount Selection for Attending Guests */}
              {rsvpStatus === 'ATTENDING' && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] border border-[#EDE4D8] flex items-center justify-between">
                  <div>
                    <span className="text-xs sm:text-sm font-bold text-[#1A1C18] block">
                      Guests Attending
                    </span>
                    <span className="text-xs text-[#86736D]">
                      Party limit: {maxCapacity} {maxCapacity === 1 ? 'guest' : 'guests'}
                    </span>
                  </div>

                  {/* Stepper with Minimum 1 and Maximum maxCapacity */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={attendingCount <= 1}
                      onClick={() => setAttendingCount((prev) => Math.max(1, prev - 1))}
                      className="w-9 h-9 rounded-xl bg-white border border-[#D8CCC0] text-[#1A1C18] font-bold text-base hover:bg-[#F2ECE4] disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-serif text-xl sm:text-2xl font-bold text-[#851321]">
                      {attendingCount}
                    </span>
                    <button
                      type="button"
                      disabled={attendingCount >= maxCapacity}
                      onClick={() => setAttendingCount((prev) => Math.min(maxCapacity, prev + 1))}
                      className="w-9 h-9 rounded-xl bg-white border border-[#D8CCC0] text-[#1A1C18] font-bold text-base hover:bg-[#F2ECE4] disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Dietary Preferences or Wishes for the Couple */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#1A1C18] block">
                  Dietary Preferences or Wishes for the Couple
                </label>
                <textarea
                  rows={3}
                  value={wishesNotes}
                  onChange={(e) => setWishesNotes(e.target.value)}
                  placeholder="Vegetarian, Jain, Nut allergies, or special celebratory notes..."
                  className="w-full p-3.5 rounded-xl border border-[#DED4C8] text-xs sm:text-sm text-[#1A1C18] placeholder-[#9E9088] bg-white focus:outline-none focus:ring-2 focus:ring-[#851321]/20 focus:border-[#851321] transition-all"
                />
              </div>

              {/* Confirm RSVP Submit CTA */}
              <button
                type="submit"
                disabled={rsvpMutation.isPending}
                className="w-full py-4 px-6 rounded-2xl bg-[#851321] hover:bg-[#6D0F1B] active:scale-[0.99] disabled:opacity-50 text-white font-serif text-base sm:text-lg font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {rsvpMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Saving your RSVP...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm RSVP</span>
                    <span>▶</span>
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        {/* 7. TRAVEL & HOSPITALITY SECTION */}
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-[#EBE4DC] shadow-sm p-6 sm:p-7 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#851321]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1A1C18]">
                Travel &amp; Hospitality
              </h2>
            </div>
            <p className="text-xs text-[#86736D]">
              Special courtesies arranged for out-of-town guests arriving in {wedding.city || 'the city'}.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            {/* 1. Hotel Accommodations */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EDE4D8] space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-sm sm:text-base font-bold text-[#1A1C18]">
                  {wedding.location || 'The Grand Palace Heritage Wing'}
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#EBF5EE] text-[#1E6B37] border border-[#C6E6D0]">
                  Special Rate
                </span>
              </div>
              <p className="text-xs text-[#695C56]">
                Block code: <span className="font-mono font-semibold text-[#851321]">{wedding.brideName.toUpperCase().slice(0, 4)}-{wedding.groomName.toUpperCase().slice(0, 4)}-26</span> for reserved nuptial tariffs.
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-xs text-[#851321] font-semibold">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span>Call Hotel Concierge</span>
              </div>
            </div>

            {/* 2. Airport & Station Shuttles */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EDE4D8] space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-sm sm:text-base font-bold text-[#1A1C18]">
                  Airport &amp; Station Shuttles
                </h3>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white text-[#695C56] border border-[#E0D4C7]">
                  Every 2 hrs
                </span>
              </div>
              <p className="text-xs text-[#695C56] leading-relaxed">
                Dedicated private shuttles will run from the main airport and railway terminus directly to venue gates.
              </p>
            </div>

            {/* 3. Weather Advisory */}
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EDE4D8] flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#E0D4C7] text-[#C05621] flex items-center justify-center shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1A1C18]">
                  {formattedMonth} {wedding.city || 'Celebration'} Weather
                </h4>
                <p className="text-xs text-[#695C56]">
                  Pleasant festive climate with breezy evenings (light celebratory shawl advised).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 8. WEDDING STORY / LIVE CHRONICLE CARD */}
        <section
          onClick={() => setIsStoryModalOpen(true)}
          className="bg-white rounded-2xl sm:rounded-3xl border border-[#EBE4DC] shadow-sm p-5 sm:p-6 flex items-center justify-between hover:border-[#851321]/40 transition-all cursor-pointer group"
        >
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#86736D] block">
              Our Story &amp; Registry
            </span>
            <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1A1C18] group-hover:text-[#851321] transition-colors">
              View The Love Chronicle
            </h3>
          </div>

          <div className="w-9 h-9 rounded-full bg-[#FAF5EE] text-[#851321] group-hover:bg-[#851321] group-hover:text-white transition-all flex items-center justify-center shadow-2xs">
            →
          </div>
        </section>

        {/* 9. PREMIUM FOOTER */}
        <footer className="text-center space-y-4 pt-4 border-t border-[#EAE2D7]">
          {/* Monogram Crest M */}
          <div className="w-10 h-10 rounded-full bg-[#FAF4EB] border border-[#E5D7C7] text-[#851321] flex items-center justify-center mx-auto shadow-2xs">
            <BrandMark compact className="w-5 h-5 text-[#851321]" />
          </div>

          <div className="space-y-1">
            <h4 className="font-serif text-base font-bold text-[#1A1C18]">
              Make My Marriage
            </h4>
            <p className="text-xs text-[#86736D]">
              Warm editorial minimalism for elevated celebrations.
            </p>
            <p className="text-[10px] uppercase tracking-wider text-[#A09088]">
              © 2026 MAKE MY MARRIAGE • INVITATION CONCIERGE
            </p>
          </div>

          {/* Action Links: Share Card & Host Concierge */}
          <div className="flex items-center justify-center gap-4 text-xs font-semibold text-[#851321]">
            <button
              type="button"
              onClick={handleShare}
              className="hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span>{copiedShare ? 'Link Copied!' : 'Share Card'}</span>
            </button>
            <span>•</span>
            <a
              href={`mailto:concierge@makemymarriage.com?subject=Assistance%20for%20${encodeURIComponent(
                wedding.title,
              )}`}
              className="hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <span>Host Concierge</span>
            </a>
          </div>

          <div className="pt-2 text-[11px] text-[#A09088] flex items-center justify-center gap-1">
            <svg className="w-3 h-3 text-[#A09088]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            <span>Private confidential invitation for {guest.name}</span>
          </div>
        </footer>
      </main>

      {/* LOVE CHRONICLE MODAL */}
      {isStoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#EBE4DC] shadow-2xl space-y-5 text-center relative">
            <button
              type="button"
              onClick={() => setIsStoryModalOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF5EE] text-[#86736D] hover:text-[#1A1C18] flex items-center justify-center font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="w-12 h-12 rounded-full bg-[#FAF5EE] text-[#851321] flex items-center justify-center mx-auto border border-[#E5D7C7]">
              <BrandMark compact className="w-6 h-6 text-[#851321]" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#851321] block">
                The Love Chronicle
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#1A1C18]">
                {wedding.brideName} &amp; {wedding.groomName}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-[#695C56] leading-relaxed italic font-serif">
              {wedding.description ||
                `From mutual friends to endless conversations, shared journeys, and thousands of little moments that brought us here today. We cannot wait to celebrate this new chapter surrounded by the family and friends we cherish most.`}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsStoryModalOpen(false)}
                className="w-full py-3 rounded-xl bg-[#851321] text-white font-semibold text-xs hover:bg-[#6D0F1B] transition-colors cursor-pointer"
              >
                Close Chronicle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
