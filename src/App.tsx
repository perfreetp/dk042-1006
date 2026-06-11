import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import MainLayout from "@/components/MainLayout";
import OverviewPage from "@/pages/OverviewPage";
import DisciplesPage from "@/pages/DisciplesPage";
import CultivationPage from "@/pages/CultivationPage";
import ExpeditionPage from "@/pages/ExpeditionPage";
import AlchemyPage from "@/pages/AlchemyPage";
import CouncilPage from "@/pages/CouncilPage";
import { useGameStore } from "@/store/gameStore";

export default function App() {
  const loadGame = useGameStore((s) => s.loadGame);
  const saveGame = useGameStore((s) => s.saveGame);
  const initGame = useGameStore((s) => s.initGame);

  useEffect(() => {
    const hasLoaded = loadGame();
    if (!hasLoaded) {
      initGame();
    }

    const handleSave = () => saveGame();
    const handleLoad = () => loadGame();
    const handleInit = () => initGame();

    window.addEventListener('save-game', handleSave);
    window.addEventListener('load-game', handleLoad);
    window.addEventListener('init-game', handleInit);

    const interval = setInterval(() => {
      saveGame();
    }, 60000);

    const handleBeforeUnload = () => {
      saveGame();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('save-game', handleSave);
      window.removeEventListener('load-game', handleLoad);
      window.removeEventListener('init-game', handleInit);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(interval);
    };
  }, [loadGame, saveGame, initGame]);

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/disciples" element={<DisciplesPage />} />
          <Route path="/cultivation" element={<CultivationPage />} />
          <Route path="/expedition" element={<ExpeditionPage />} />
          <Route path="/alchemy" element={<AlchemyPage />} />
          <Route path="/council" element={<CouncilPage />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}
