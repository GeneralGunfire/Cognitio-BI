import { NavLink } from 'react-router-dom';
import { Home, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/', end: true, icon: Home, label: 'Home' },
  { to: '/open', icon: FolderOpen, label: 'Open' },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-16 flex-shrink-0 flex-col justify-between bg-[#F3F2F1] py-2">
      <nav className="flex flex-col items-center gap-1">
        {NAV_ITEMS.map(({ to, end, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-[#605E5C]',
                isActive && 'text-[#0F8564]'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="h-5 w-5" strokeWidth={1.75} color={isActive ? '#0F8564' : '#605E5C'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="flex flex-col items-start gap-2 px-3 pb-2">
        <button className="text-left text-[11px] text-[#605E5C] hover:text-[#323130]">Sign out</button>
        <button className="text-left text-[11px] text-[#605E5C] hover:text-[#323130]">
          Options and settings
        </button>
      </div>
    </aside>
  );
}
