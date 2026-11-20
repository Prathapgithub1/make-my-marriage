import type { WebsiteSection } from '../websiteApi';

interface SectionEditorProps {
  section: WebsiteSection;
  onChange: (updatedData: Record<string, any>) => void;
}

interface FamilyMember {
  name: string;
  relation: string;
  side: 'GROOM' | 'BRIDE';
  photoUrl?: string;
}

export function FamilySectionEditor({ section, onChange }: SectionEditorProps) {
  const data = section.data || {};
  const members: FamilyMember[] = Array.isArray(data.members)
    ? data.members
    : [
        { name: 'Dr. R. K. Reddy & Mrs. Lakshmi Reddy', relation: 'Parents of the Groom', side: 'GROOM' },
        { name: 'Mr. V. S. Rao & Mrs. Sunita Rao', relation: 'Parents of the Bride', side: 'BRIDE' },
        { name: 'Vikram Reddy', relation: 'Best Man / Brother', side: 'GROOM' },
        { name: 'Divya Rao', relation: 'Maid of Honor / Sister', side: 'BRIDE' },
      ];

  const updateMember = (index: number, field: keyof FamilyMember, value: string) => {
    const updated = [...members];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, members: updated });
  };

  const addMember = () => {
    const updated = [
      ...members,
      {
        name: 'Family Member Name',
        relation: 'Uncle / Aunt / Sibling',
        side: 'GROOM' as const,
      },
    ];
    onChange({ ...data, members: updated });
  };

  const removeMember = (index: number) => {
    const updated = members.filter((_, i) => i !== index);
    onChange({ ...data, members: updated });
  };

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Family Section Title
        </label>
        <input
          type="text"
          value={data.title ?? 'Our Beloved Families & Entourage'}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
          Introductory Note
        </label>
        <textarea
          rows={2}
          value={data.subtitle ?? 'With the blessings of our parents, elders, and closest companions.'}
          onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
          className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:bg-white text-stone-900"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500">
            Family Members ({members.length})
          </label>
          <button
            type="button"
            onClick={addMember}
            className="text-xs font-medium text-amber-800 hover:text-amber-900"
          >
            + Add Member
          </button>
        </div>

        {members.map((m, idx) => (
          <div key={idx} className="p-3 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-600">Member #{idx + 1}</span>
              {members.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMember(idx)}
                  className="text-stone-400 hover:text-rose-600 text-xs"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={m.name}
                  onChange={(e) => updateMember(idx, 'name', e.target.value)}
                  placeholder="Full Name"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600 font-medium"
                />
              </div>
              <div>
                <select
                  value={m.side}
                  onChange={(e) => updateMember(idx, 'side', e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600"
                >
                  <option value="GROOM">Groom Side</option>
                  <option value="BRIDE">Bride Side</option>
                </select>
              </div>
            </div>
            <input
              type="text"
              value={m.relation}
              onChange={(e) => updateMember(idx, 'relation', e.target.value)}
              placeholder="Relationship (e.g. Parents of the Bride)"
              className="w-full px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-600 text-stone-600"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
