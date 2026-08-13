import Link from 'next/link';
import Image from 'next/image';
import type { Edition } from '@/lib/types';

interface NavProps {
  edition?: Edition;
}

export default function Nav({ edition }: NavProps) {
  return (
    <nav className="flex justify-between items-center px-6 py-4 border-b border-ink font-mono text-xs tracking-widest uppercase w-full">
      <Link href="/" className="transition-opacity hover:opacity-80">
        <Image
          src="/pagecrank-logo.png"
          alt="PAGE CRANK"
          width={200}
          height={32}
          className="mix-blend-multiply h-6 sm:h-8 w-auto object-contain"
          priority
        />
      </Link>

      <div className="flex gap-6 text-inkSoft">
        <Link href="/rankings" className="hover:text-rust transition-colors">
          RANKING
        </Link>
        <Link href="/methodology" className="hover:text-rust transition-colors">
          METHODOLOGY
        </Link>
        <Link href="/reports" className="hover:text-rust transition-colors">
          REPORTS
        </Link>
      </div>
    </nav>
  );
}
