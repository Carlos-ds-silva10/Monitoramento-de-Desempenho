import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  BarChart3,
  Activity,
  ChevronRight, LogOut,
} from 'lucide-react';
import { Trophy } from 'lucide-react';
import logo from '../../assets/logotopo.png';
import { supabase } from '../../lib/supabase';
import { Menu } from 'lucide-react';

type Page = 'dashboard' | 'services' | 'visits' | 'teams' | 'reports' | 'monthly-production';;

interface SidebarProps {
   currentPage: Page; onNavigate: (page: Page) => void; collapsed: boolean; onToggle: () => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'services' as Page, label: 'Serviços', icon: Briefcase },
  { id: 'visits' as Page, label: 'Visitas', icon: Activity },
  { id: 'teams' as Page, label: 'Equipes', icon: Users },
  { id: 'reports' as Page, label: 'Relatórios', icon: BarChart3 },
  { id: 'monthly-production' as Page, label: 'Produção Mensal', icon: BarChart3 },
];
const logout = async () => {
  await supabase.auth.signOut();
};

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle,}: SidebarProps) {

  return (
  <motion.aside
  initial={{ x: -280 }}
  animate={{ x: 0 }}
  transition={{ type: 'spring', stiffness: 260, damping: 30 }}
  className={`
    fixed left-0 top-0 h-screen
    ${collapsed ? 'w-20' : 'w-64'}
    bg-[#0d1528]
    border-r border-blue-500/15
    shadow-[0_0_30px_rgba(59,130,246,0.08)]
    z-40 flex flex-col
    transition-all duration-300
  `}
>
      
      {/* Logo/Sanduiche*/}
      <div className="p-4 border-b border-[#1a2744]/60">
    <div className={`flex items-center ${ collapsed ? "justify-center flex-col gap-3" : "gap-3" }`}>
    <button
      onClick={onToggle}
      className="p-2 rounded-lg hover:bg-[#111827] text-slate-400 hover:text-white transition" >
      <Menu size={20} />
    </button>
    <img
      src={logo}
      alt="Protec"
      className="w-10 h-10 object-contain"/>

    {!collapsed && (
      <div>
        <p className="font-bold text-white text-sm">
          Protec
        </p>
        <p className="text-xs text-slate-500">
          Analytics Pro
        </p>
      </div>
    )}
  </div>
</div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <motion.button
              key={item.id}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#0f1729]'
              }`}
            >
    <Icon className={`w-4.5 h-4.5 shrink-0 ${ isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300' }`} size={18} />
            {!collapsed && ( <> <span className="flex-1 text-left"> {item.label} </span>
  {isActive && ( <motion.div layoutId="activeIndicator">
     <ChevronRight size={14} className="text-blue-400" />
      </motion.div>
                 )}
               </>
              )}
            </motion.button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex items-center gap-3 px-3 py-2">
  <div className="w-7 h-7 rounded-lg bg-[#1a2744] flex items-center justify-center">
    <Trophy size={14} className="text-yellow-500" />
  </div>

  {!collapsed && (
    <p className="text-xs font-medium text-slate-400">
      v1.0
    </p>
  )}
</div>
      <button onClick={logout} className=" flex items-center justify-center gap-2 py-2.5 rounded-lg text-slate-400 hover:text-white
    hover:bg-slate-800 transition-all">
 <LogOut size={18} />

{!collapsed && <span>Sair</span>}
</button>
    </motion.aside>
       
  );
}
