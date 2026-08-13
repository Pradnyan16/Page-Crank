import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="mt-11 border-t-4 border-double border-ink pt-4 font-mono text-[17px] text-inkSoft w-full">
      <div className="max-w-[2160px] mx-auto px-6">
        <div className="flex justify-between flex-wrap gap-4">
          <div className="leading-loose">
            <Link href="/rankings" className="block text-inkSoft hover:text-rust transition-colors hover:underline">Full ranking</Link>
            <Link href="/methodology" className="block text-inkSoft hover:text-rust transition-colors hover:underline">Methodology</Link>
            <Link href="/reports" className="block text-inkSoft hover:text-rust transition-colors hover:underline">Reports & archive</Link>
          </div>
          <div className="leading-loose">
            <Link href="/corrections" className="block text-inkSoft hover:text-rust transition-colors hover:underline">Report a correction</Link>
            <a href="#" className="block text-inkSoft hover:text-rust transition-colors hover:underline">Download dataset</a>
            <a href="#" className="block text-inkSoft hover:text-rust transition-colors hover:underline">About Page Crank</a>
          </div>
        </div>
        <div className="text-center mt-5 mb-10 tracking-widest">
          We do not judge business models. We measure what readers experience.
        </div>
      </div>
    </footer>
  );
}
