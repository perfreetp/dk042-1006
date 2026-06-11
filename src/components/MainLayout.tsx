import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  Mountain,
  Compass,
  Flame,
  MessageSquare,
  Save,
  RotateCcw,
  Calendar,
  Gem,
  Star,
  Clock,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import SettlementModal from '@/components/SettlementModal';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const sect = useGameStore((s) => s.sect);
  const advanceMonth = useGameStore((s) => s.advanceMonth);
  const saveGame = useGameStore((s) => s.saveGame);
  const initGame = useGameStore((s) => s.initGame);
  const showSettlement = useGameStore((s) => s.showSettlement);

  const [showQi, setShowQi] = useState(false);

  useEffect(() => {
    setShowQi(true);
    const interval = setInterval(() => {
      setShowQi(false);
      setTimeout(() => setShowQi(true), 100);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/', label: '宗门总览', icon: Home },
    { path: '/disciples', label: '弟子名册', icon: Users },
    { path: '/cultivation', label: '洞府修炼', icon: Mountain },
    { path: '/expedition', label: '秘境探索', icon: Compass },
    { path: '/alchemy', label: '炼丹炼器', icon: Flame },
    { path: '/council', label: '门派议事', icon: MessageSquare },
  ];

  return (
    <div className="h-screen w-screen flex bg-bg-dark overflow-hidden">
      {showQi && (
        <>
          <div className="qi-particle" style={{ left: '10%', top: '20%', animationDelay: '0s' }} />
          <div className="qi-particle" style={{ left: '85%', top: '35%', animationDelay: '0.5s' }} />
          <div className="qi-particle" style={{ left: '25%', top: '75%', animationDelay: '1s' }} />
          <div className="qi-particle" style={{ left: '70%', top: '80%', animationDelay: '1.5s' }} />
          <div className="qi-particle" style={{ left: '50%', top: '50%', animationDelay: '2s' }} />
        </>
      )}

      <aside className="w-64 bg-bg-card border-r border-border flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-border-gold">
          <h1 className="text-2xl font-display font-bold text-gold-light text-center">
            {sect.name}
          </h1>
          <p className="text-text-muted text-sm text-center mt-1">
            第 {sect.month} 月
          </p>
        </div>

        <div className="p-4 space-y-2 border-b border-border">
          <div className="flex items-center gap-2 text-sm">
            <Gem className="w-4 h-4 text-blue-light" />
            <span className="text-text-secondary">灵石</span>
            <span className="ml-auto text-gold-light font-semibold">
              {sect.spiritStones.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Star className="w-4 h-4 text-gold" />
            <span className="text-text-secondary">声望</span>
            <span className="ml-auto text-gold-light font-semibold">
              {sect.reputation}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-green-light" />
            <span className="text-text-secondary">门规</span>
            <span className="ml-auto text-text-primary">
              {sect.ruleTendency < 33 ? '严苛' : sect.ruleTendency < 66 ? '中庸' : '宽松'}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-2">
          <button
            onClick={advanceMonth}
            className="w-full btn-gold flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            进入下月
          </button>
          <div className="flex gap-2">
            <button
              onClick={saveGame}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm py-2"
            >
              <Save className="w-4 h-4" />
              保存
            </button>
            <button
              onClick={() => {
                if (confirm('确定要重新开始游戏吗？所有进度将丢失。')) {
                  initGame();
                }
              }}
              className="flex-1 btn-secondary flex items-center justify-center gap-2 text-sm py-2"
            >
              <RotateCcw className="w-4 h-4" />
              重置
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>

      {showSettlement && <SettlementModal />}
    </div>
  );
}
