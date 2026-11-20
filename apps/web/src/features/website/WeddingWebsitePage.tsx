import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWebsiteSettings,
  updateWebsiteSettings,
  applyWebsiteTemplate,
  publishWebsite,
  unpublishWebsite,
  type WebsiteContent,
  type WebsiteDetails,
} from './websiteApi';
import { WebsiteDashboardView } from './WebsiteDashboardView';
import { WebsiteEditorView } from './WebsiteEditorView';
import { TemplateGalleryView } from './TemplateGalleryView';
import { WebsiteSettingsModal } from './WebsiteSettingsModal';
import { PublishSuccessModal } from './PublishSuccessModal';

export function WeddingWebsitePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'editor' | 'templates'>('dashboard');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);

  const {
    data: website,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['wedding-website'],
    queryFn: getWebsiteSettings,
  });

  const saveContentMutation = useMutation({
    mutationFn: (updatedContent: WebsiteContent) =>
      updateWebsiteSettings({ content: updatedContent }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['wedding-website'], updated);
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: (payload: { slug: string; settings: any }) =>
      updateWebsiteSettings({
        slug: payload.slug,
        content: { ...website?.content, settings: payload.settings },
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(['wedding-website'], updated);
    },
  });

  const applyTemplateMutation = useMutation({
    mutationFn: (templateId: string) => applyWebsiteTemplate(templateId),
    onSuccess: (updated) => {
      queryClient.setQueryData(['wedding-website'], updated);
    },
  });

  const togglePublishMutation = useMutation({
    mutationFn: (publish: boolean) => (publish ? publishWebsite(true) : unpublishWebsite()),
    onSuccess: (data) => {
      queryClient.setQueryData<WebsiteDetails | undefined>(['wedding-website'], (old) => {
        if (!old) return old;
        return {
          ...old,
          isPublished: data.isPublished,
          publishedAt: data.publishedAt,
          publicUrl: data.publicUrl,
        };
      });
      refetch();
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="h-8 bg-stone-200 rounded w-1/4 animate-pulse" />
        <div className="h-32 bg-stone-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-stone-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !website) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-700 flex items-center justify-center">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-serif font-bold text-stone-900">Failed to Load Wedding Website</h2>
        <p className="text-xs text-stone-500">{(error as any)?.message || 'An error occurred while fetching your website data.'}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-amber-800 text-white hover:bg-amber-900"
        >
          Try Again
        </button>
      </div>
    );
  }

  const handleTogglePublish = async (publish: boolean) => {
    await togglePublishMutation.mutateAsync(publish);
    if (publish) {
      setIsPublishModalOpen(true);
    }
  };

  return (
    <>
      {activeTab === 'editor' ? (
        <div className="h-[calc(100vh-60px)] flex flex-col w-full overflow-hidden bg-[#FAF8F5]">
          {/* Top Header & Navigation Tabs in compact studio bar */}
          <div className="h-14 bg-white border-b border-[#EAE6E1] px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Return to Website Dashboard"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </button>
              <div className="h-4 w-px bg-stone-200" />
              <h1 className="text-base sm:text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
                Wedding Website Builder
                <span
                  className={`text-[10px] font-sans uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${website.isPublished
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-stone-100 text-stone-600 border-stone-200'
                    }`}
                >
                  {website.isPublished ? 'Live' : 'Draft'}
                </span>
              </h1>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-stone-500 hover:text-stone-800 transition-all"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-white text-stone-900 shadow-xs transition-all"
              >
                Visual Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-stone-500 hover:text-stone-800 transition-all"
              >
                Templates Gallery
              </button>
            </div>
          </div>

          {/* Studio 3-Panel Visual Editor View */}
          <div className="flex-1 min-h-0 w-full overflow-hidden">
            <WebsiteEditorView
              website={website}
              onSaveContent={async (updatedContent) => {
                await saveContentMutation.mutateAsync(updatedContent);
              }}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenPublishModal={() => setIsPublishModalOpen(true)}
              onTogglePublish={handleTogglePublish}
              onNavigateTab={setActiveTab}
            />
          </div>
        </div>
      ) : (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          {/* Top Header & Navigation Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
            <div>
              <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
                <span>Make My Marriage</span>
                <span>/</span>
                <span className="text-stone-800 font-medium">Digital Concierge</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 flex items-center gap-3">
                Wedding Website Builder
                <span
                  className={`text-[11px] font-sans uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${website.isPublished
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-stone-100 text-stone-600 border-stone-200'
                    }`}
                >
                  {website.isPublished ? 'Live' : 'Draft'}
                </span>
              </h1>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'dashboard'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
                  }`}
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('editor')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all text-stone-500 hover:text-stone-800"
              >
                Visual Editor
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('templates')}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'templates'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
                  }`}
              >
                Templates Gallery
              </button>
            </div>
          </div>

          {/* Main Tab Views */}
          {activeTab === 'dashboard' && (
            <WebsiteDashboardView
              website={website}
              onNavigateTab={setActiveTab}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenPublishModal={() => setIsPublishModalOpen(true)}
              onTogglePublish={handleTogglePublish}
            />
          )}

          {activeTab === 'templates' && (
            <TemplateGalleryView
              currentTemplateId={website.content?.templateId || 'royal-heritage'}
              onApplyTemplate={async (templateId) => {
                await applyTemplateMutation.mutateAsync(templateId);
              }}
              onLaunchEditor={() => setActiveTab('editor')}
            />
          )}
        </div>
      )}

      {/* Common Modals */}
      <WebsiteSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        slug={website.slug}
        settings={website.content?.settings}
        onSave={async (payload) => {
          await saveSettingsMutation.mutateAsync(payload);
        }}
      />

      {/* Publish Success & QR Modal */}
      <PublishSuccessModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        publicUrl={website.publicUrl}
        coupleNames={website.content?.settings?.coupleNamesOverride || 'Prathap & Akshitha'}
      />
    </>
  );
}
