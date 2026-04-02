import type { ReactNode } from "react";

export function SectionShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow">{eyebrow}</div>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#f5f5f3] md:text-[2.15rem]">{title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
