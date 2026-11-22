import { useState } from 'react';
import type { WebsiteContent, WebsiteSection, WebsiteDetails } from './websiteApi';
import { HeroSectionEditor } from './sections/HeroSectionEditor';
import { CoupleSectionEditor } from './sections/CoupleSectionEditor';
import { StorySectionEditor } from './sections/StorySectionEditor';
import { EventsSectionEditor } from './sections/EventsSectionEditor';
import { VenueSectionEditor } from './sections/VenueSectionEditor';
import { GallerySectionEditor } from './sections/GallerySectionEditor';
import { FamilySectionEditor } from './sections/FamilySectionEditor';
import { TravelSectionEditor } from './sections/TravelSectionEditor';
import { RsvpSectionEditor } from './sections/RsvpSectionEditor';
import { ContactSectionEditor, FooterSectionEditor } from './sections/ContactAndFooterEditor';
import { ThemeStylerPanel } from './ThemeStylerPanel';
import { WebsiteLivePreview } from './WebsiteLivePreview';

interface WebsiteEditorViewProps {
  website: WebsiteDetails;
  onSaveContent: (updatedContent: WebsiteContent) => Promise<void>;
  onOpenSettings: () => void;
  onOpenPublishModal: () => void;
  onTogglePublish?: (publish: boolean) => Promise<void>;
  onNavigateTab?: (tab: 'dashboard' | 'editor' | 'templates') => void;
}

export function WebsiteEditorView({
  website,
  onSaveContent,
  onOpenSettings,
  onOpenPublishModal,
  onTogglePublish,
  onNavigateTab,
}: WebsiteEditorViewProps) {
  const [content, setContent] = useState<WebsiteContent>(
    website.content || {
      templateId: 'royal-heritage',
      sections: [],
      theme: {
        palette: {
          primary: '#883A32',
          secondary: '#4C654D',
          background: '#FAF7F2',
          card: '#FFFFFF',
          text: '#1E1B18',
        },
        typography: {
          headingFont: 'Playfair Display, serif',
          bodyFont: 'Plus Jakarta Sans, sans-serif',
        },
      },
    },
  );
  const sections = content.sections || [];
  const [activeSectionId, setActiveSectionId] = useState<string>(
    sections[0]?.id || 'sec-hero',
  );
  const [isSectionsCollapsed, setIsSectionsCollapsed] = useState(false);
  const [editorTab, setEditorTab] = useState<'content' | 'theme'>('content');
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active section
  const activeSection =
    sections.find((s) => s.id === activeSectionId) || sections[0];

  const updateSectionData = (updatedData: Record<string, any>) => {
    if (!activeSection) return;
    const updatedSections = sections.map((s) =>
      s.id === activeSection.id ? { ...s, data: updatedData } : s,
    );
    setContent({ ...content, sections: updatedSections });
    setHasUnsavedChanges(true);
  };

  const toggleSectionEnabled = (sectionId: string) => {
    const updatedSections = sections.map((s) =>
      s.id === sectionId ? { ...s, isEnabled: !s.isEnabled } : s,
    );
    setContent({ ...content, sections: updatedSections });
    setHasUnsavedChanges(true);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;

    // re-index orders
    const reordered = updated.map((s, idx) => ({ ...s, order: idx }));
    setContent({ ...content, sections: reordered });
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveContent(content);
      setHasUnsavedChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#FAF8F5] overflow-hidden">
      {/* Editor Sub-Header Toolbar */}
      <div className="h-14 bg-white border-b border-[#EAE6E1] px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs z-10">
        <div className="flex items-center gap-3">
          {/* Segmented view tabs */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setEditorTab('content')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${editorTab === 'content'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
                }`}
            >
              Sections & Content
            </button>
            <button
              type="button"
              onClick={() => setEditorTab('theme')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${editorTab === 'theme'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
                }`}
            >
              Theme & Styler
            </button>
          </div>

          <div className="h-4 w-px bg-stone-200 hidden sm:block" />

          {/* Active Template tag */}
          <span className="hidden md:inline-flex items-center gap-1.5 text-xs text-stone-500 font-medium">
            <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Template:</span>
            <span className="font-serif font-semibold text-stone-800 capitalize">
              {content.templateId ? content.templateId.replace('-', ' ') : 'Royal Heritage'}
            </span>
          </span>

          {/* Save status badge */}
          {hasUnsavedChanges && (
            <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
              Unsaved Changes
            </span>
          )}

          {saveSuccess && (
            <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
              Draft saved
            </span>
          )}
        </div>

        {/* Device framing toggles */}
        <div className="hidden lg:flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setDevice('desktop')}
            title="Desktop View (Full Width)"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${device === 'desktop' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('tablet')}
            title="Tablet View (768px)"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${device === 'tablet' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Tablet</span>
          </button>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            title="Mobile View (375px)"
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${device === 'mobile' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-800'
              }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>Mobile</span>
          </button>
        </div>

        {/* Save & Actions */}
        <div className="flex items-center gap-2">
          {website.isPublished && website.publicUrl && (
            <a
              href={website.publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open public website in new tab"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-stone-700 hover:text-stone-900 hover:bg-stone-100 border border-stone-200 transition-colors"
            >
              <svg className="w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>Live Site</span>
            </a>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            title="Website & Domain Settings"
            className="p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !hasUnsavedChanges}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-stone-900 text-white hover:bg-stone-800 disabled:opacity-40 transition-colors shadow-xs"
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            type="button"
            onClick={async () => {
              setIsPublishing(true);
              try {
                if (hasUnsavedChanges) {
                  await onSaveContent(content);
                  setHasUnsavedChanges(false);
                }
                if (onTogglePublish) {
                  await onTogglePublish(true);
                } else {
                  onOpenPublishModal();
                }
              } finally {
                setIsPublishing(false);
              }
            }}
            disabled={isPublishing}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#8A4B35] text-white hover:bg-[#723B29] transition-colors shadow-xs disabled:opacity-50 flex items-center gap-1.5"
          >
            {isPublishing ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Publishing...</span>
              </>
            ) : website.isPublished ? (
              'Republish Live'
            ) : (
              'Publish Live'
            )}
          </button>
        </div>
      </div>

      {/* Main 3-Panel Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Panel 1: Left Sections List (Collapsible) */}
        <div
          className={`${isSectionsCollapsed ? 'w-12' : 'w-64'
            } bg-white border-r border-[#EAE6E1] flex flex-col shrink-0 h-full min-h-0 transition-[width] duration-300 ease-in-out relative select-none`}
        >
          {isSectionsCollapsed ? (
            <div className="flex flex-col items-center py-3 justify-between h-full min-h-0">
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsSectionsCollapsed(false)}
                  title="Expand Page Sections"
                  aria-label="Expand Page Sections"
                  className="p-2 rounded-xl text-stone-500 hover:text-[#8A4B35] hover:bg-[#FBF4F0] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="w-6 h-px bg-stone-200" />

                {/* Vertical text label */}
                <button
                  type="button"
                  onClick={() => setIsSectionsCollapsed(false)}
                  className="py-2 text-[11px] font-bold uppercase tracking-widest text-stone-500 hover:text-[#8A4B35] transition-colors [writing-mode:vertical-rl] rotate-180 flex items-center gap-2"
                  title="Click to expand sections list"
                >
                  <span>Page Sections</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8A4B35]" />
                  <span className="text-[10px] font-mono text-stone-400">({sections.length})</span>
                </button>
              </div>

              {/* Bottom Expand Shortcut */}
              <button
                type="button"
                onClick={() => setIsSectionsCollapsed(false)}
                title="Expand sections list"
                className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="p-3.5 border-b border-[#EAE6E1] flex items-center justify-between shrink-0 bg-stone-50/50">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Page Sections ({sections.length})
                  </span>
                  <p className="text-[10px] text-stone-400">Click to customize content</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSectionsCollapsed(true)}
                  title="Collapse Page Sections panel"
                  aria-label="Collapse Page Sections panel"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
                {sections.map((sec, idx) => {
                  const isActive = sec.id === activeSectionId;
                  return (
                    <div
                      key={sec.id}
                      className={`group flex items-center justify-between p-2 rounded-xl text-xs transition-all border ${isActive
                          ? 'bg-[#FBF4F0] text-[#8A4B35] font-semibold border-[#8A4B35]/30 shadow-xs'
                          : 'hover:bg-stone-50 text-stone-700 border-transparent'
                        }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSectionId(sec.id);
                          setEditorTab('content');
                        }}
                        className="flex-1 text-left truncate flex items-center gap-2.5 min-w-0"
                      >
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 transition-colors ${sec.isEnabled ? 'bg-emerald-500 ring-2 ring-emerald-100' : 'bg-stone-300'
                            }`}
                        />
                        <span className="truncate">{sec.title}</span>
                      </button>

                      <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                        {/* Up arrow */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveSection(idx, 'up')}
                          className="p-1 hover:text-stone-700 disabled:opacity-20 rounded hover:bg-stone-100 transition-colors"
                          title="Move up"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        {/* Down arrow */}
                        <button
                          type="button"
                          disabled={idx === sections.length - 1}
                          onClick={() => moveSection(idx, 'down')}
                          className="p-1 hover:text-stone-700 disabled:opacity-20 rounded hover:bg-stone-100 transition-colors"
                          title="Move down"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {/* Visibility Eye */}
                        <button
                          type="button"
                          onClick={() => toggleSectionEnabled(sec.id)}
                          className={`p-1 rounded hover:bg-stone-100 transition-colors ${sec.isEnabled ? 'text-stone-600 hover:text-stone-900' : 'text-stone-300 hover:text-stone-500'
                            }`}
                          title={sec.isEnabled ? 'Hide section from guests' : 'Show section'}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            {sec.isEnabled ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            ) : (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            )}
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-3 border-t border-[#EAE6E1] bg-stone-50/70 text-[11px] text-stone-500 shrink-0">
                <p className="flex items-center gap-1.5 font-medium text-stone-700 mb-0.5">
                  <svg className="w-3.5 h-3.5 text-[#8A4B35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Section Controls
                </p>
                <p className="text-[10px] text-stone-500 leading-normal">
                  Use arrows to rearrange order. Toggling the eye hides a section from your published link.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Panel 2: Center Editor Form */}
        <div className="w-96 lg:w-[420px] bg-white border-r border-[#EAE6E1] flex flex-col shrink-0 h-full min-h-0">
          <div className="h-13 px-4 sm:px-5 border-b border-[#EAE6E1] flex items-center justify-between shrink-0 bg-stone-50/60">
            <div className="flex items-center gap-2 min-w-0">
              {isSectionsCollapsed && (
                <button
                  type="button"
                  onClick={() => setIsSectionsCollapsed(false)}
                  title="Expand Page Sections"
                  className="p-1 rounded-md text-stone-400 hover:text-[#8A4B35] hover:bg-stone-100 transition-colors shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              <h3 className="text-sm font-serif font-bold text-stone-900 truncate">
                {editorTab === 'content' ? activeSection?.title || 'Section Editor' : 'Theme & Styler'}
              </h3>
            </div>
            {editorTab === 'content' && activeSection && (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#FAF8F5] text-[#8A4B35] border border-[#EAE6E1] shrink-0">
                {activeSection.type}
              </span>
            )}
          </div>

          <div className="p-4 sm:p-5 flex-1 overflow-y-auto">
            {editorTab === 'theme' ? (
              <ThemeStylerPanel
                theme={content.theme}
                onChange={(updatedTheme) => {
                  setContent({ ...content, theme: updatedTheme });
                  setHasUnsavedChanges(true);
                }}
              />
            ) : (
              <div>
                {activeSection?.type === 'HERO' && (
                  <HeroSectionEditor section={activeSection} onChange={updateSectionData} />
                )}
                {activeSection?.type === 'COUPLE' && (
                  <CoupleSectionEditor section={activeSection} onChange={updateSectionData} />
                )}
                {activeSection?.type === 'STORY' && (
                  <StorySectionEditor section={activeSection} onChange={updateSectionData} />
                )}
                {activeSection?.type === 'EVENTS' && (
                  <EventsSectionEditor section={activeSection} onChange={updateSectionData} />
                )}
                {activeSection?.type === 'VENUE' && (
                  <VenueSectionEditor section={activeSection} onChange={updateSectionData} />
                )}
                {activeSection?.type === 'GALLERY' && (
                  <GallerySectionEditor section={activeSection} onChange={updateSectionData} />
                )}
                {activeSection?.type === 'FAMILY' && (
                  <FamilySectionEditor section={activeSection} onChange={updateSectionData} />
                )}
                {activeSection?.type === 'TRAVEL' && (
                  <TravelSectionEditor section={activeSection} onChange={updateSectionData} />
                )}
                {activeSection?.type === 'RSVP' && (
                  <RsvpSectionEditor section={activeSection} onChange={updateSectionData} />
                )}
                {activeSection?.type === 'CONTACT' && (
                  <ContactSectionEditor section={activeSection} onChange={updateSectionData} />
                )}
                {activeSection?.type === 'FOOTER' && (
                  <FooterSectionEditor section={activeSection} onChange={updateSectionData} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Panel 3: Right Live Preview Canvas */}
        <div className="flex-1 bg-[#F4EFEA]/80 flex flex-col h-full min-h-0 overflow-hidden relative">
          {/* Canvas Bar with status & resolution info */}
          <div className="h-8 bg-stone-100/90 border-b border-[#EAE6E1] px-4 flex items-center justify-between shrink-0 text-[11px] text-stone-500 font-medium">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Interactive Live Studio Canvas</span>
            </div>
            <div className="flex items-center gap-3">
              <span>
                {device === 'desktop' ? 'Desktop View (100%)' : device === 'tablet' ? 'Tablet View (768px)' : 'Mobile View (375px)'}
              </span>
            </div>
          </div>

          {/* Scrollable Viewport centering the framed website */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex justify-center items-start">
            {device === 'desktop' ? (
              <div className="w-full max-w-[1020px] rounded-xl shadow-2xl overflow-hidden border border-stone-300 bg-white transition-all duration-300">
                {/* Browser Chrome Header */}
                <div className="h-9 bg-[#FAF9F7] border-b border-stone-200 px-4 flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]" />
                    <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]" />
                  </div>
                  <div className="flex-1 max-w-sm mx-auto h-6 bg-white border border-stone-200 rounded-md px-3 flex items-center justify-center gap-1.5 text-[11px] text-stone-600 font-mono">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>make-my-marriage.shop/w/{website.slug || 'wedding'}</span>
                  </div>
                </div>
                <WebsiteLivePreview
                  content={content}
                  device="desktop"
                  interactiveRsvp={false}
                />
              </div>
            ) : device === 'tablet' ? (
              <div className="w-[768px] rounded-[32px] border-[12px] border-stone-900 shadow-2xl overflow-hidden bg-stone-900 transition-all duration-300 ring-1 ring-stone-900/20">
                {/* Tablet Top Notch */}
                <div className="h-5 bg-stone-900 flex items-center justify-center">
                  <div className="w-3 h-3 rounded-full bg-stone-800 ring-1 ring-stone-700" />
                </div>
                <div className="overflow-y-auto max-h-[780px] bg-white rounded-[20px]">
                  <WebsiteLivePreview
                    content={content}
                    device="tablet"
                    interactiveRsvp={false}
                  />
                </div>
              </div>
            ) : (
              <div className="w-[375px] rounded-[44px] border-[10px] border-stone-900 shadow-2xl overflow-hidden bg-stone-900 transition-all duration-300 ring-1 ring-stone-900/20">
                {/* Phone Dynamic Island / Notch */}
                <div className="h-7 bg-stone-900 flex items-center justify-center">
                  <div className="w-20 h-4 bg-black rounded-full flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-800 ml-auto mr-2" />
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[720px] bg-white rounded-[32px]">
                  <WebsiteLivePreview
                    content={content}
                    device="mobile"
                    interactiveRsvp={false}
                  />
                </div>
                {/* Bottom Home Indicator Bar */}
                <div className="h-5 bg-stone-900 flex items-center justify-center">
                  <div className="w-32 h-1 bg-stone-700 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
