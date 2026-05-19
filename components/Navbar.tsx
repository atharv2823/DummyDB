import Link from 'next/link';
import { Database, FileText } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <Database className="w-6 h-6 text-primary" />
              <span className="font-bold text-xl tracking-tight">DummyDB</span>
            </Link>
            
            <div className="hidden sm:flex items-center gap-4">
              <Link href="/" className="px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-primary dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-primary transition-colors flex items-center gap-2">
                <Database className="w-4 h-4" />
                Schema Builder
              </Link>
              <Link href="/table-definition" className="px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-primary dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-primary transition-colors flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Table Definition
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
