export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-[rgba(255,255,255,0.08)] bg-[rgba(10,10,10,0.86)]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="max-w-xl rounded-[1.25rem] border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--accent)]">ХОЛБОО БАРИХ</h2>
          <div className="mt-5 space-y-3 text-sm leading-7 text-[var(--muted)]">
            <p>
              <span className="font-semibold text-[#f5f5f3]">Утас:</span>{" "}
              <a href="tel:69696969">69-696-969</a>
            </p>
            <p>
              <span className="font-semibold text-[#f5f5f3]">Имэйл:</span>{" "}
              <a href="mailto:badral.munh@gmail.com">badral.munh@gmail.com</a>
            </p>
            <div>
              <p className="font-semibold text-[#f5f5f3]">Дуудлага хүлээн авах цаг:</p>
              <p className="mt-2">Даваа-Баасан: 10:00-19:00</p>
              <p>Бямба: 11:00-16:00</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
