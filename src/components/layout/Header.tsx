import { motion } from 'framer-motion';
import { Search, Bell, RefreshCw } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  actions?: React.ReactNode;
}

export default function Header({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  onRefresh,
  loading,
  actions,
}: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-16 bg-[#080d1a]/80 backdrop-blur-sm border-b border-[#1a2744]/60 flex items-center px-6 gap-4 sticky top-0 z-30"
    >
      <div className="flex-1">
        <h1 className="text-base font-semibold text-white leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      {onSearchChange && (
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Pesquisar..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-[#0f1729] border border-[#1e2d4d] rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 transition-colors w-56 placeholder:text-slate-600"
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        {actions}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="w-8 h-8 rounded-lg bg-[#0f1729] border border-[#1e2d4d] flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-blue-500/40 transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        )}
        <button className="w-8 h-8 rounded-lg bg-[#0f1729] border border-[#1e2d4d] flex items-center justify-center text-slate-400 hover:text-slate-200 transition-all relative">
          <Bell size={14} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
        </button>
      </div>
    </motion.header>
  );
}
