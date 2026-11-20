import { useState, useEffect, type FormEvent } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  getPublicWebsite,
  lookupPublicRsvp,
  submitPublicRsvp,
  type PublicWebsiteDTO,
  type SubmitPublicRsvpPayload,
  type WebsiteContent,
} from './websiteApi';
import { WebsiteLivePreview } from './WebsiteLivePreview';

export function PublicWeddingWebsitePage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || undefined;

  const [enteredPassword, setEnteredPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

  const {
    data: website,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['public-wedding-website', slug],
    queryFn: () => getPublicWebsite(slug || ''),
    enabled: Boolean(slug),
  });

  // Check if locked
  const settings = website?.settings || website?.content?.settings;
  const requiresPassword =
    settings?.visibility === 'PASSWORD_PROTECTED' &&
    Boolean(settings?.password);

  useEffect(() => {
    if (website && !requiresPassword) {
      setIsUnlocked(true);
    }
  }, [website, requiresPassword]);

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    const correctPassword = settings?.password?.trim();
    if (correctPassword && enteredPassword.trim() === correctPassword) {
      setIsUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full border-2 border-amber-800 border-t-transparent animate-spin" />
          <p className="text-xs uppercase tracking-widest text-stone-500 font-serif">
            Opening Wedding Invitation...
          </p>
        </div>
      </div>
    );
  }

  if (isError || !website) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 bg-white rounded-3xl border border-stone-200 shadow-sm space-y-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-stone-100 flex items-center justify-center text-stone-500">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">Website Not Found</h2>
          <p className="text-xs text-stone-500 leading-relaxed">
            This celebration website may not be published yet or the link is incorrect. Please check the URL and try again.
          </p>
          <a
            href="/"
            className="inline-block px-5 py-2 text-xs font-semibold rounded-full bg-stone-900 text-white hover:bg-stone-800 transition-colors"
          >
            Return to Make My Marriage
          </a>
        </div>
      </div>
    );
  }

  // Password Lock Screen
  if (requiresPassword && !isUnlocked) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
        <div className="max-w-sm w-full p-8 bg-white rounded-3xl border border-stone-200 shadow-xl text-center space-y-5">
          <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 border border-amber-200 text-amber-800 flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800">
              Private Celebration
            </span>
            <h3 className="text-2xl font-serif font-bold text-stone-900 mt-1">
              Guest Access Passcode
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Please enter the passcode provided in your wedding invitation.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {passwordError && (
              <div className="p-2 text-xs text-rose-700 bg-rose-50 rounded-lg">
                Incorrect passcode. Please verify your invitation card.
              </div>
            )}

            <input
              type="password"
              required
              value={enteredPassword}
              onChange={(e) => setEnteredPassword(e.target.value)}
              placeholder="Enter passcode"
              className="w-full px-4 py-2.5 text-center text-sm tracking-wider font-mono border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-600"
            />

            <button
              type="submit"
              className="w-full py-2.5 text-xs font-semibold rounded-xl bg-amber-800 text-white hover:bg-amber-900 transition-colors shadow-sm"
            >
              Enter Celebration Site &rarr;
            </button>
          </form>
        </div>
      </div>
    );
  }

  const previewContent: WebsiteContent = {
    templateId: (website.content?.templateId ||
      website.templateId ||
      'royal-heritage') as WebsiteContent['templateId'],
    theme: website.content?.theme ||
      website.theme || {
        palette: {
          primary: '#8A4B35',
          secondary: '#C28238',
          background: '#FAF7F2',
          card: '#FFFFFF',
          text: '#1A1C18',
        },
        typography: {
          headingFont: 'Playfair Display',
          bodyFont: 'Inter',
        },
      },
    sections: website.content?.sections || website.sections || [],
    settings: settings || {
      title: website.wedding?.title || website.title || 'Our Wedding Celebration',
      visibility: 'PUBLIC',
      allowOpenRsvp: true,
      showCountdown: true,
    },
  };

  const weddingTitle = website.wedding?.title || website.title || 'Wedding Celebration';
  const weddingDate = website.wedding?.date || website.weddingDate || '';
  const weddingLocation = website.wedding?.location || website.location || '';
  const rawEvents = website.events || [];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-between">
      <WebsiteLivePreview
        content={previewContent}
        weddingTitle={weddingTitle}
        weddingDate={weddingDate}
        weddingLocation={weddingLocation}
        events={rawEvents.map((e) => ({
          id: e.id,
          name: e.name,
          type: e.type || e.name,
          startTime: e.startTime || e.startsAt || '',
          endTime: e.endTime || e.endsAt || '',
          venueName: e.venueName || '',
          venueAddress: e.venueAddress || '',
          dressCode: e.dressCode || '',
          description: e.description || '',
        }))}
        device="desktop"
        interactiveRsvp={true}
        onSubmitRsvp={async (payload: SubmitPublicRsvpPayload) => {
          const res = await submitPublicRsvp(slug || '', {
            ...payload,
            token,
          });
          return res;
        }}
      />
    </div>
  );
}
