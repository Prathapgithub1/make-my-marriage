function CalendarIcon() {
  return (
    <svg aria-hidden="true" className="size-6" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 3v3m10-3v3M4.5 9h15M5 5.5h14a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 19 20.5H5A1.5 1.5 0 0 1 3.5 19V7A1.5 1.5 0 0 1 5 5.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

export function SignupPreviewCard() {
  return (
    <article className="mt-6 rounded-2xl border border-line bg-surface p-4 text-[12px] shadow-[0_4px_16px_rgba(37,39,35,0.04)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-primary">
              Active celebration
            </p>
            <span className="rounded-full bg-[#e5eddf] px-2.5 py-1 text-[9px] font-medium text-sage">
              Sample data
            </span>
          </div>
          <h2 className="mt-2 font-serif text-lg font-semibold leading-tight tracking-[-0.03em] text-ink sm:text-[21px]">
            Prathap &amp; Akshitha’s Wedding
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted sm:text-xs">
            <span aria-hidden="true" className="text-primary">
              ⌖
            </span>
            The Oberoi Udaivilas, Udaipur
          </p>
        </div>
        <span className="hidden size-12 shrink-0 items-center justify-center rounded-full bg-surface-low text-sage sm:flex">
          <CalendarIcon />
        </span>
      </div>

      <div className="my-4 h-px bg-line" />

      <div className="grid gap-3 sm:grid-cols-2">
        <section className="rounded-xl border border-line bg-canvas p-3" aria-label="Sample event">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">Ceremony flow</h3>
            <span className="text-[9px] text-muted">Day 1 &amp; 2</span>
          </div>
          <p className="mt-2 rounded-lg bg-white px-2.5 py-2 text-[11px] font-medium text-ink">
            <span className="mr-2 text-primary" aria-hidden="true">
              ●
            </span>
            Sangeet &amp; Musical Soiree
            <span className="mt-1 block pl-5 text-[9px] font-normal text-muted">
              7:30 PM · Courtyard Lawn
            </span>
          </p>
          <p className="mt-2 rounded-lg bg-white px-2.5 py-2 text-[11px] font-medium text-ink">
            <span className="mr-2 text-sage" aria-hidden="true">
              ●
            </span>
            Varmala &amp; Reception
            <span className="mt-1 block pl-5 text-[9px] font-normal text-muted">
              11:00 AM · Lake Pavilion
            </span>
          </p>
        </section>

        <section
          className="rounded-xl border border-line bg-canvas p-3"
          aria-label="Sample planning progress"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-ink">Planning progress</h3>
            <span className="text-[9px] text-muted">24 / 28 done</span>
          </div>
          <div
            aria-label="Sample planning progress: 86 percent"
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"
            role="img"
          >
            <span className="block h-full w-[86%] rounded-full bg-sage" />
          </div>
          <ul className="mt-3 space-y-2 text-[11px]">
            <li className="flex items-center gap-2 text-muted line-through">
              <span className="text-sage" aria-hidden="true">
                ✓
              </span>
              Finalize floral palettes
            </li>
            <li className="flex items-center gap-2 text-muted line-through">
              <span className="text-sage" aria-hidden="true">
                ✓
              </span>
              Confirm guest dietary requirements
            </li>
            <li className="flex items-center gap-2 text-ink">
              <span className="text-primary" aria-hidden="true">
                ○
              </span>
              Review bespoke menu proof
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[9px] text-muted">
        <span>Crafted for serene, timeless celebrations.</span>
        <span aria-hidden="true" className="flex -space-x-2">
          <span className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#eadbd2] text-xs text-primary">
            P
          </span>
          <span className="flex size-8 items-center justify-center rounded-full border-2 border-white bg-[#d9e2d3] text-xs text-sage">
            A
          </span>
        </span>
      </div>
    </article>
  );
}
