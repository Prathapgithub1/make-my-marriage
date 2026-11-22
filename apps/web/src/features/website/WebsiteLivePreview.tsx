import { useState, useEffect, type FormEvent } from 'react';
import type {
  WebsiteContent,
  WebsiteSection,
  PublicWebsiteDTO,
  SubmitPublicRsvpPayload,
} from './websiteApi';

interface WebsiteLivePreviewProps {
  content: WebsiteContent;
  weddingTitle?: string;
  weddingDate?: string;
  weddingLocation?: string;
  events?: PublicWebsiteDTO['events'];
  device?: 'desktop' | 'tablet' | 'mobile';
  interactiveRsvp?: boolean;
  onSubmitRsvp?: (payload: SubmitPublicRsvpPayload) => Promise<{ success: boolean; message: string }>;
}

export function WebsiteLivePreview({
  content,
  weddingTitle = 'Prathap & Akshitha',
  weddingDate = 'November 24, 2025',
  weddingLocation = 'Bangalore Palace, Bengaluru',
  events = [],
  device = 'desktop',
  interactiveRsvp = false,
  onSubmitRsvp,
}: WebsiteLivePreviewProps) {
  const { theme, sections = [], settings } = content || {};
  const palette = theme?.palette || {
    primary: '#883A32',
    secondary: '#4C654D',
    background: '#FAF7F2',
    card: '#FFFFFF',
    text: '#1E1B18',
    accent: '#C29B38',
  };
  const typography = theme?.typography || {
    headingFont: 'Playfair Display, serif',
    bodyFont: 'Plus Jakarta Sans, sans-serif',
  };
  const buttonShape = theme?.buttonStyle?.shape || 'pill';

  // Calculate live countdown
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number }>({
    days: 0,
    hours: 0,
    minutes: 0,
  });

  useEffect(() => {
    const targetDate = new Date(settings?.weddingDateOverride || weddingDate || '2025-11-24').getTime();
    if (isNaN(targetDate)) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const diff = targetDate - now;
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [weddingDate, settings?.weddingDateOverride]);

  // Interactive RSVP modal state
  const [isRsvpModalOpen, setIsRsvpModalOpen] = useState(false);
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpEmail, setRsvpEmail] = useState('');
  const [rsvpPhone, setRsvpPhone] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<'ATTENDING' | 'NOT_ATTENDING'>('ATTENDING');
  const [rsvpCount, setRsvpCount] = useState(1);
  const [rsvpDietary, setRsvpDietary] = useState('');
  const [rsvpNotes, setRsvpNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rsvpSuccessMessage, setRsvpSuccessMessage] = useState<string | null>(null);
  const [rsvpErrorMessage, setRsvpErrorMessage] = useState<string | null>(null);

  const handleRsvpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!onSubmitRsvp) return;
    setIsSubmitting(true);
    setRsvpErrorMessage(null);
    try {
      const res = await onSubmitRsvp({
        name: rsvpName,
        email: rsvpEmail.trim() || undefined,
        phone: rsvpPhone.trim() || undefined,
        rsvpStatus,
        attendingCount: rsvpStatus === 'ATTENDING' ? rsvpCount : 0,
        dietaryPreferences: rsvpDietary.trim() || undefined,
        notes: rsvpNotes.trim() || undefined,
      });
      setRsvpSuccessMessage(res.message || 'Thank you! Your RSVP has been confirmed.');
    } catch (err: any) {
      setRsvpErrorMessage(err?.message || 'Failed to submit RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonClass = () => {
    const shape =
      buttonShape === 'pill' ? 'rounded-full' : buttonShape === 'soft' ? 'rounded-lg' : 'rounded-none';
    return `px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200 shadow-sm ${shape}`;
  };

  const enabledSections = [...(sections || [])]
    .filter((s) => s.isEnabled)
    .sort((a, b) => a.order - b.order);

  const coupleDisplayName = settings?.coupleNamesOverride || weddingTitle || 'Prathap & Akshitha';
  const celebrationLocation = settings?.locationOverride || weddingLocation || 'Bangalore Palace, Bengaluru';
  const celebrationDate = settings?.weddingDateOverride || weddingDate || 'November 24, 2025';

  const containerWidthClass =
    device === 'mobile'
      ? 'max-w-[375px]'
      : device === 'tablet'
        ? 'max-w-[768px]'
        : 'w-full';

  return (
    <div
      className={`mx-auto transition-all duration-300 ${interactiveRsvp
          ? `shadow-2xl overflow-hidden border border-stone-200/50 ${containerWidthClass}`
          : 'w-full'
        }`}
      style={{
        backgroundColor: palette.background,
        color: palette.text,
        fontFamily: typography.bodyFont,
      }}
    >
      {/* Background watermark/pattern */}
      <div className="relative">
        {enabledSections.map((section) => {
          switch (section.type) {
            case 'HERO': {
              const hero = section.data || {};
              const coverImg =
                hero.coverImageUrl ||
                'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80';
              return (
                <section
                  key={section.id}
                  className="relative min-h-[580px] flex items-center justify-center text-center px-6 py-20 overflow-hidden"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(20, 15, 10, 0.45), rgba(20, 15, 10, 0.70)), url("${coverImg}")`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="relative z-10 max-w-2xl mx-auto text-white space-y-6">
                    <div
                      className="text-xs uppercase tracking-[0.3em] font-semibold text-amber-200/90"
                      style={{ letterSpacing: '0.25em' }}
                    >
                      {hero.headline || 'We are getting married'}
                    </div>

                    <h1
                      className="text-4xl sm:text-6xl font-serif font-normal tracking-wide text-white drop-shadow-md"
                      style={{ fontFamily: typography.headingFont }}
                    >
                      {coupleDisplayName}
                    </h1>

                    <p className="text-sm sm:text-base font-light text-stone-200 max-w-lg mx-auto leading-relaxed">
                      {hero.subtitle ||
                        'Two souls, one heart, together forever in love and celebration.'}
                    </p>

                    {/* Celebration Date & Location */}
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-4 text-xs tracking-wider uppercase text-amber-100 font-medium">
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {celebrationDate}
                      </span>
                      <span className="text-stone-400">•</span>
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {celebrationLocation}
                      </span>
                    </div>

                    {/* Countdown */}
                    {(hero.showCountdown ?? true) && (
                      <div className="pt-4 flex items-center justify-center gap-3">
                        <div className="bg-black/35 backdrop-blur-md px-3.5 py-2.5 rounded-lg border border-white/10 min-w-[64px]">
                          <div className="text-2xl font-serif font-bold text-amber-200">{timeLeft.days}</div>
                          <div className="text-[10px] uppercase tracking-wider text-stone-300">Days</div>
                        </div>
                        <div className="bg-black/35 backdrop-blur-md px-3.5 py-2.5 rounded-lg border border-white/10 min-w-[64px]">
                          <div className="text-2xl font-serif font-bold text-amber-200">{timeLeft.hours}</div>
                          <div className="text-[10px] uppercase tracking-wider text-stone-300">Hours</div>
                        </div>
                        <div className="bg-black/35 backdrop-blur-md px-3.5 py-2.5 rounded-lg border border-white/10 min-w-[64px]">
                          <div className="text-2xl font-serif font-bold text-amber-200">{timeLeft.minutes}</div>
                          <div className="text-[10px] uppercase tracking-wider text-stone-300">Mins</div>
                        </div>
                      </div>
                    )}

                    {/* Buttons */}
                    <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={() => setIsRsvpModalOpen(true)}
                        className={getButtonClass()}
                        style={{
                          backgroundColor: palette.primary,
                          color: '#FFFFFF',
                        }}
                      >
                        {hero.primaryButtonText || 'RSVP Now'}
                      </button>
                      <a
                        href="#events-schedule"
                        className={`${getButtonClass()} border border-white/60 text-white hover:bg-white/15`}
                      >
                        {hero.secondaryButtonText || 'View Schedule'}
                      </a>
                    </div>
                  </div>
                </section>
              );
            }

            case 'COUPLE': {
              const couple = section.data || {};
              const groom = couple.groom || {};
              const bride = couple.bride || {};
              return (
                <section key={section.id} className="py-16 px-6 max-w-4xl mx-auto text-center">
                  <div className="text-xs uppercase tracking-widest font-semibold text-amber-800/80 mb-2">
                    {couple.subheading || 'The Couple'}
                  </div>
                  <h2
                    className="text-3xl font-serif mb-12"
                    style={{ fontFamily: typography.headingFont, color: palette.primary }}
                  >
                    {section.title || 'Meet the Bride & Groom'}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {/* Groom Card */}
                    <div
                      className="p-6 rounded-2xl border text-center space-y-4"
                      style={{
                        backgroundColor: palette.card,
                        borderColor: 'rgba(0,0,0,0.06)',
                      }}
                    >
                      <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 p-1" style={{ borderColor: palette.primary }}>
                        <img
                          src={
                            groom.photoUrl ||
                            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={groom.name || 'Groom'}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-serif font-bold" style={{ fontFamily: typography.headingFont }}>
                          {groom.name || 'Prathap Reddy'}
                        </h3>
                        <p className="text-xs text-amber-900/70 font-medium tracking-wide uppercase mt-1">
                          {groom.title || 'The Groom'}
                        </p>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed font-light">
                        {groom.bio || 'Passionate about architecture, thoughtful moments, and bringing family together.'}
                      </p>
                    </div>

                    {/* Bride Card */}
                    <div
                      className="p-6 rounded-2xl border text-center space-y-4"
                      style={{
                        backgroundColor: palette.card,
                        borderColor: 'rgba(0,0,0,0.06)',
                      }}
                    >
                      <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-2 p-1" style={{ borderColor: palette.primary }}>
                        <img
                          src={
                            bride.photoUrl ||
                            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
                          }
                          alt={bride.name || 'Bride'}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-serif font-bold" style={{ fontFamily: typography.headingFont }}>
                          {bride.name || 'Akshitha Rao'}
                        </h3>
                        <p className="text-xs text-rose-900/70 font-medium tracking-wide uppercase mt-1">
                          {bride.title || 'The Bride'}
                        </p>
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed font-light">
                        {bride.bio || 'Lover of classical dance, artistic stories, and joyful laughter with loved ones.'}
                      </p>
                    </div>
                  </div>
                </section>
              );
            }

            case 'STORY': {
              const story = section.data || {};
              const milestones: any[] = story.milestones || [];
              return (
                <section key={section.id} className="py-16 px-6 max-w-3xl mx-auto">
                  <div className="text-center mb-12">
                    <div className="text-xs uppercase tracking-widest font-semibold text-amber-800/80 mb-2">
                      Our Journey
                    </div>
                    <h2
                      className="text-3xl font-serif"
                      style={{ fontFamily: typography.headingFont, color: palette.primary }}
                    >
                      {story.title || 'How Our Story Began'}
                    </h2>
                    <p className="text-xs text-stone-600 max-w-lg mx-auto mt-2 font-light">
                      {story.intro || 'From memorable meetings to a lifetime commitment.'}
                    </p>
                  </div>

                  <div className="relative border-l-2 border-stone-200 ml-4 md:ml-32 space-y-8 pl-6">
                    {milestones.map((m, idx) => (
                      <div key={idx} className="relative">
                        <div
                          className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white shadow"
                          style={{ backgroundColor: palette.primary }}
                        />
                        <div className="text-xs font-bold text-amber-800 tracking-wider mb-1">
                          {m.year}
                        </div>
                        <h3 className="text-lg font-serif font-bold text-stone-900" style={{ fontFamily: typography.headingFont }}>
                          {m.title}
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed font-light mt-1">
                          {m.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            case 'EVENTS': {
              const evData = section.data || {};
              return (
                <section id="events-schedule" key={section.id} className="py-16 px-6 max-w-4xl mx-auto">
                  <div className="text-center mb-12">
                    <div className="text-xs uppercase tracking-widest font-semibold text-amber-800/80 mb-2">
                      Schedule & Itinerary
                    </div>
                    <h2
                      className="text-3xl font-serif"
                      style={{ fontFamily: typography.headingFont, color: palette.primary }}
                    >
                      {evData.headline || 'Ceremonies & Celebrations'}
                    </h2>
                    <p className="text-xs text-stone-600 max-w-lg mx-auto mt-2 font-light">
                      {evData.subtitle || 'Join us across three days of sacred rituals, music, and joy.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(events && events.length > 0
                      ? events
                      : [
                        {
                          id: 'ev-1',
                          name: 'Sangeet & Cocktail Gala',
                          type: 'SANGEET',
                          startTime: '2025-11-23T18:00:00Z',
                          endTime: '2025-11-23T23:00:00Z',
                          venueName: 'The Grand Ballroom, Palace Grounds',
                          venueAddress: 'Palace Grounds, Jayamahal, Bengaluru',
                          dressCode: 'Indo-Western Glitz / Evening Glamour',
                          description: 'An evening of Bollywood performances, lively dance, and signature mocktails.',
                        },
                        {
                          id: 'ev-2',
                          name: 'Traditional Muhurtham & Wedding',
                          type: 'WEDDING',
                          startTime: '2025-11-24T09:30:00Z',
                          endTime: '2025-11-24T13:30:00Z',
                          venueName: 'Main Mandapam, Bangalore Palace',
                          venueAddress: 'Bangalore Palace, Vasanth Nagar, Bengaluru',
                          dressCode: 'Traditional South Indian Silks / Kanjeevaram',
                          description: 'Sacred wedding ceremony followed by a grand traditional banana leaf feast.',
                        },
                      ]
                    ).map((ev) => (
                      <div
                        key={ev.id}
                        className="p-6 rounded-2xl border transition-all hover:shadow-md space-y-3"
                        style={{
                          backgroundColor: palette.card,
                          borderColor: 'rgba(0,0,0,0.06)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: `${palette.primary}15`, color: palette.primary }}>
                            {ev.type}
                          </span>
                        </div>
                        <h3 className="text-lg font-serif font-bold" style={{ fontFamily: typography.headingFont }}>
                          {ev.name}
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed font-light">
                          {ev.description}
                        </p>
                        <div className="pt-2 border-t border-stone-100 space-y-1.5 text-xs text-stone-600">
                          <div className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {ev.startTime || ev.startsAt
                                ? `${new Date(ev.startTime || ev.startsAt || '').toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })} onwards`
                                : 'Ceremony Schedule'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            <span className="truncate">{ev.venueName}</span>
                          </div>
                          {ev.dressCode && (
                            <div className="flex items-center gap-2 text-amber-800 font-medium">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Dress code: {ev.dressCode}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            case 'VENUE': {
              const venue = section.data || {};
              return (
                <section key={section.id} className="py-16 px-6 max-w-4xl mx-auto">
                  <div
                    className="rounded-3xl border overflow-hidden grid grid-cols-1 md:grid-cols-2"
                    style={{
                      backgroundColor: palette.card,
                      borderColor: 'rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="h-64 md:h-auto bg-stone-200">
                      <img
                        src={
                          venue.photoUrl ||
                          'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=800&q=80'
                        }
                        alt={venue.venueName || 'Venue'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-8 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="text-xs uppercase tracking-widest font-semibold text-amber-800/80 mb-2">
                          The Destination
                        </div>
                        <h3 className="text-2xl font-serif font-bold" style={{ fontFamily: typography.headingFont, color: palette.primary }}>
                          {venue.venueName || 'The Leela Palace & Gardens'}
                        </h3>
                        <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                          {venue.address || '23 Old Airport Road, HAL 2nd Stage, Kodihalli, Bengaluru, Karnataka 560008'}
                        </p>
                      </div>

                      <div className="space-y-2 text-xs text-stone-600 pt-3 border-t border-stone-100">
                        {venue.parkingInfo && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-700">Valet:</span> {venue.parkingInfo}
                          </div>
                        )}
                        {venue.airportDistance && (
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-stone-700">Airport:</span> {venue.airportDistance}
                          </div>
                        )}
                      </div>

                      <div className="pt-2">
                        <a
                          href={venue.mapUrl || 'https://maps.google.com'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${getButtonClass()} inline-flex items-center gap-2 text-xs`}
                          style={{ backgroundColor: palette.primary, color: '#FFFFFF' }}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          Get Driving Directions
                        </a>
                      </div>
                    </div>
                  </div>
                </section>
              );
            }

            case 'GALLERY': {
              const gal = section.data || {};
              const images: any[] = gal.images || [
                { url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80', caption: 'Jaipur' },
                { url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=600&q=80', caption: 'Golden Hour' },
                { url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=600&q=80', caption: 'Moments' },
              ];
              return (
                <section key={section.id} className="py-16 px-6 max-w-4xl mx-auto">
                  <div className="text-center mb-10">
                    <div className="text-xs uppercase tracking-widest font-semibold text-amber-800/80 mb-2">
                      Photographs
                    </div>
                    <h2 className="text-3xl font-serif" style={{ fontFamily: typography.headingFont, color: palette.primary }}>
                      {gal.title || 'Memories & Celebrations'}
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {images.map((img, idx) => (
                      <div key={idx} className="rounded-xl overflow-hidden aspect-square bg-stone-100 shadow-sm group relative">
                        <img src={img.url} alt={img.caption || 'Wedding'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        {img.caption && (
                          <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-white text-[11px] text-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            {img.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            case 'FAMILY': {
              const fam = section.data || {};
              const members: any[] = fam.members || [];
              return (
                <section key={section.id} className="py-16 px-6 max-w-4xl mx-auto text-center">
                  <div className="text-xs uppercase tracking-widest font-semibold text-amber-800/80 mb-2">
                    Honored Guests
                  </div>
                  <h2 className="text-3xl font-serif mb-8" style={{ fontFamily: typography.headingFont, color: palette.primary }}>
                    {fam.title || 'Our Families & Entourage'}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {members.map((m, idx) => (
                      <div key={idx} className="p-4 rounded-xl border text-center" style={{ backgroundColor: palette.card, borderColor: 'rgba(0,0,0,0.06)' }}>
                        <div className="w-16 h-16 mx-auto rounded-full bg-stone-100 flex items-center justify-center font-serif text-lg font-bold text-amber-800 mb-2">
                          {m.name ? m.name.charAt(0) : 'F'}
                        </div>
                        <h4 className="text-sm font-semibold text-stone-900">{m.name}</h4>
                        <p className="text-xs text-stone-500 mt-0.5">{m.relation}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            case 'TRAVEL': {
              const trav = section.data || {};
              const hotels: any[] = trav.hotels || [];
              return (
                <section key={section.id} className="py-16 px-6 max-w-4xl mx-auto">
                  <div className="text-center mb-10">
                    <div className="text-xs uppercase tracking-widest font-semibold text-amber-800/80 mb-2">
                      Guest Logistics
                    </div>
                    <h2 className="text-3xl font-serif" style={{ fontFamily: typography.headingFont, color: palette.primary }}>
                      {trav.title || 'Travel & Accommodations'}
                    </h2>
                    <p className="text-xs text-stone-600 max-w-lg mx-auto mt-2 font-light">
                      {trav.shuttleNote || 'Special room blocks and concierge support arranged for your comfort.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {hotels.map((h, idx) => (
                      <div key={idx} className="p-5 rounded-2xl border space-y-2" style={{ backgroundColor: palette.card, borderColor: 'rgba(0,0,0,0.06)' }}>
                        <h4 className="text-base font-serif font-bold text-stone-900">{h.name}</h4>
                        <div className="text-xs text-amber-800 font-medium">{h.distance}</div>
                        {h.bookingCode && (
                          <div className="text-xs bg-amber-50 text-amber-900 px-2 py-1 rounded inline-block">
                            Booking Code: <span className="font-mono font-bold">{h.bookingCode}</span>
                          </div>
                        )}
                        {h.notes && <p className="text-xs text-stone-500 leading-relaxed">{h.notes}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            case 'RSVP': {
              const rsvp = section.data || {};
              return (
                <section key={section.id} className="py-16 px-6 max-w-2xl mx-auto text-center">
                  <div
                    className="p-8 sm:p-12 rounded-3xl border shadow-sm space-y-6"
                    style={{
                      backgroundColor: palette.card,
                      borderColor: 'rgba(0,0,0,0.08)',
                    }}
                  >
                    <div className="text-xs uppercase tracking-widest font-semibold text-amber-800/80">
                      Kindly Respond
                    </div>
                    <h2 className="text-3xl font-serif" style={{ fontFamily: typography.headingFont, color: palette.primary }}>
                      {rsvp.headline || 'Are You Attending?'}
                    </h2>
                    <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed font-light">
                      {rsvp.message ||
                        'Please let us know your attendance and any dietary requests so we can welcome you warmly.'}
                    </p>

                    <button
                      type="button"
                      onClick={() => setIsRsvpModalOpen(true)}
                      className={getButtonClass()}
                      style={{ backgroundColor: palette.primary, color: '#FFFFFF' }}
                    >
                      Open Guest RSVP Form
                    </button>
                  </div>
                </section>
              );
            }

            case 'CONTACT': {
              const contact = section.data || {};
              return (
                <section key={section.id} className="py-12 px-6 max-w-xl mx-auto text-center">
                  <div className="text-xs uppercase tracking-widest font-semibold text-amber-800/80 mb-2">
                    Assistance
                  </div>
                  <h3 className="text-xl font-serif font-bold" style={{ fontFamily: typography.headingFont }}>
                    {contact.headline || 'Wedding Concierge & Support'}
                  </h3>
                  <p className="text-xs text-stone-600 mt-2 font-light">{contact.message}</p>
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-6 text-xs text-stone-800">
                    {contact.phone && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <svg className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {contact.phone}
                      </span>
                    )}
                    {contact.email && (
                      <span className="flex items-center gap-1.5 font-medium">
                        <svg className="w-3.5 h-3.5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {contact.email}
                      </span>
                    )}
                  </div>
                </section>
              );
            }

            case 'FOOTER': {
              const footer = section.data || {};
              return (
                <footer key={section.id} className="py-12 px-6 border-t border-stone-200/60 text-center space-y-3">
                  <p className="text-xs text-stone-600 font-light max-w-md mx-auto">
                    {footer.closingText || 'With love and anticipation, we cannot wait to celebrate with you.'}
                  </p>
                  {footer.hashtag && (
                    <div className="text-sm font-serif font-bold text-amber-900 tracking-wider">
                      {footer.hashtag}
                    </div>
                  )}
                  {(footer.showBranding ?? true) && (
                    <div className="pt-4 text-[10px] uppercase tracking-wider text-stone-400">
                      Crafted with Make My Marriage
                    </div>
                  )}
                </footer>
              );
            }

            default:
              return null;
          }
        })}
      </div>

      {/* Interactive RSVP Modal Dialog */}
      {isRsvpModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-stone-900 shadow-2xl space-y-5 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                setIsRsvpModalOpen(false);
                setRsvpSuccessMessage(null);
                setRsvpErrorMessage(null);
              }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center space-y-1">
              <span className="text-[11px] uppercase tracking-widest font-semibold text-amber-800">
                Wedding Attendance
              </span>
              <h3 className="text-2xl font-serif font-bold text-stone-900" style={{ fontFamily: typography.headingFont }}>
                RSVP for {coupleDisplayName}
              </h3>
            </div>

            {rsvpSuccessMessage ? (
              <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h4 className="text-base font-bold text-emerald-900">Response Recorded</h4>
                <p className="text-xs text-emerald-800">{rsvpSuccessMessage}</p>
                <button
                  type="button"
                  onClick={() => setIsRsvpModalOpen(false)}
                  className="px-5 py-2 text-xs font-semibold bg-emerald-800 text-white rounded-full hover:bg-emerald-900"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit} className="space-y-4">
                {rsvpErrorMessage && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                    {rsvpErrorMessage}
                  </div>
                )}

                <div>
                  <label htmlFor="rsvp-full-name" className="block text-xs font-semibold text-stone-700 mb-1">
                    Your Full Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="rsvp-full-name"
                    type="text"
                    required
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    placeholder="e.g. Rohith Sharma"
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="rsvp-email" className="block text-xs font-semibold text-stone-700 mb-1">Email Address</label>
                    <input
                      id="rsvp-email"
                      type="email"
                      value={rsvpEmail}
                      onChange={(e) => setRsvpEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                  <div>
                    <label htmlFor="rsvp-phone" className="block text-xs font-semibold text-stone-700 mb-1">Mobile Phone</label>
                    <input
                      id="rsvp-phone"
                      type="tel"
                      value={rsvpPhone}
                      onChange={(e) => setRsvpPhone(e.target.value)}
                      placeholder="+91..."
                      className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">Will you attend?</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRsvpStatus('ATTENDING')}
                      className={`p-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${rsvpStatus === 'ATTENDING'
                          ? 'border-emerald-700 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-600/20'
                          : 'border-stone-200 bg-white text-stone-600'
                        }`}
                    >
                      Joyfully Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => setRsvpStatus('NOT_ATTENDING')}
                      className={`p-2.5 text-xs font-semibold rounded-lg border text-center transition-all ${rsvpStatus === 'NOT_ATTENDING'
                          ? 'border-rose-700 bg-rose-50 text-rose-900 ring-2 ring-rose-600/20'
                          : 'border-stone-200 bg-white text-stone-600'
                        }`}
                    >
                      Regretfully Decline
                    </button>
                  </div>
                </div>

                {rsvpStatus === 'ATTENDING' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Total Attending in Party
                    </label>
                    <select
                      value={rsvpCount}
                      onChange={(e) => setRsvpCount(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                    >
                      {[1, 2, 3, 4, 5, 6].map((num) => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'Guest' : 'Guests'}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Dietary Requirements or Allergies
                  </label>
                  <input
                    type="text"
                    value={rsvpDietary}
                    onChange={(e) => setRsvpDietary(e.target.value)}
                    placeholder="e.g. Vegetarian, Jain food, Gluten-free..."
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Warm Note / Wishes for the Couple
                  </label>
                  <textarea
                    rows={2}
                    value={rsvpNotes}
                    onChange={(e) => setRsvpNotes(e.target.value)}
                    placeholder="Leave a congratulatory message or song request..."
                    className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !rsvpName.trim()}
                  className="w-full py-3 text-sm font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 shadow transition-colors"
                >
                  {isSubmitting ? 'Confirming RSVP...' : 'Submit RSVP Response'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
