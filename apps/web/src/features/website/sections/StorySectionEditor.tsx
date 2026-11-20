import type { WebsiteSection } from '../websiteApi';

interface SectionEditorProps {
  section: WebsiteSection;
  onChange: (updatedData: Record<string, any>) => void;
}

interface Milestone {
  year: string;
  title: string;
  description: string;
  photoUrl?: string;
}

export function StorySectionEditor({ section, onChange }: SectionEditorProps) {
  const data = section.data || {};
  const milestones: Milestone[] = Array.isArray(data.milestones)
    ? data.milestones
    : [
        {
          year: '2021',
          title: 'The First Encounter',
          description: 'A serendipitous rainy evening coffee at Bangalore where conversations flowed like old friends.',
        },
        {
          year: '2023',
          title: 'The Yes in Udaipur',
          description: 'Under the candlelit pavilions of Lake Pichola, overlooking palaces, the question was asked.',
        },
        {
          year: '2025',
          title: 'Forever Begins',
          description: 'Surrounded by our loved ones, families, and friends, we step forward together into the next chapter.',
        },
      ];

  const updateMilestone = (index: number, field: keyof Milestone, value: string) => {
    const updated = [...milestones];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, milestones: updated });
  };

  const addMilestone = () => {
    const updated = [
      ...milestones,
      {
        year: '2025',
        title: 'New Chapter',
        description: 'Our wedding celebration and the joy of coming together.',
      },
    ];
    onChange({ ...data, milestones: updated });
  };

  const removeMilestone = (index: number) => {
    const updated = milestones.filter((_, i) => i !== index);
    onChange({ ...data, milestones: updated });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Story Section Title
        </label>
        <input
          type="text"
          value={data.title ?? 'How Our Story Unfolded'}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Introduction Paragraph
        </label>
        <textarea
          rows={2}
          value={data.intro ?? 'From mutual friends to soulmates, every chapter brought us closer to this beautiful milestone.'}
          onChange={(e) => onChange({ ...data, intro: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
            Timeline Milestones ({milestones.length})
          </label>
          <button
            type="button"
            onClick={addMilestone}
            className="text-xs font-medium text-amber-800 hover:text-amber-900 flex items-center gap-1"
          >
            + Add Milestone
          </button>
        </div>

        {milestones.map((m, idx) => (
          <div key={idx} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3 relative group">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-600">Milestone #{idx + 1}</span>
              {milestones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMilestone(idx)}
                  className="text-stone-400 hover:text-rose-600 text-xs"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <input
                  type="text"
                  value={m.year}
                  onChange={(e) => updateMilestone(idx, 'year', e.target.value)}
                  placeholder="e.g. 2021"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
                />
              </div>
              <div className="col-span-2">
                <input
                  type="text"
                  value={m.title}
                  onChange={(e) => updateMilestone(idx, 'title', e.target.value)}
                  placeholder="Milestone title"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600 font-medium"
                />
              </div>
            </div>
            <div>
              <textarea
                rows={2}
                value={m.description}
                onChange={(e) => updateMilestone(idx, 'description', e.target.value)}
                placeholder="Brief story of this moment..."
                className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
