import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  Flame,
  Beaker,
  Shield,
  Sparkles,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';

type TabType = 'pill' | 'artifact' | 'inventory' | 'materials';

export default function AlchemyPage() {
  const recipes = useGameStore((s) => s.recipes);
  const items = useGameStore((s) => s.items);
  const materials = useGameStore((s) => s.materials);
  const craftItem = useGameStore((s) => s.craftItem);
  const pendingCraftResult = useGameStore((s) => s.pendingCraftResult);
  const clearPendingCraftResult = useGameStore((s) => s.clearPendingCraftResult);

  const [activeTab, setActiveTab] = useState<TabType>('pill');
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [craftingResult, setCraftingResult] = useState<{ success: boolean; itemName: string } | null>(null);

  const pillRecipes = recipes.filter((r) => r.type === 'pill');
  const artifactRecipes = recipes.filter((r) => r.type === 'artifact');

  const currentRecipes = activeTab === 'pill' ? pillRecipes : artifactRecipes;
  const selected = currentRecipes.find((r) => r.id === selectedRecipe);

  useEffect(() => {
    if (pendingCraftResult) {
      setCraftingResult({
        success: pendingCraftResult.success,
        itemName: pendingCraftResult.recipeName,
      });
      clearPendingCraftResult();
      const timer = setTimeout(() => setCraftingResult(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [pendingCraftResult, clearPendingCraftResult]);

  const canCraft = (recipe: typeof recipes[0]) => {
    for (const [material, amount] of Object.entries(recipe.materials)) {
      if ((materials[material] || 0) < amount) return false;
    }
    return true;
  };

  const handleCraft = () => {
    if (!selected) return;
    craftItem(selected.id);
  };

  const tabs: { id: TabType; label: string; icon: typeof Flame }[] = [
    { id: 'pill', label: '炼丹', icon: Beaker },
    { id: 'artifact', label: '炼器', icon: Shield },
    { id: 'inventory', label: '成品库', icon: Sparkles },
    { id: 'materials', label: '材料库', icon: Flame },
  ];

  return (
    <div className="h-full flex flex-col animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gold-light">
            炼丹炼器
          </h1>
          <p className="text-text-muted mt-1">
            炼制丹药和法器，增强弟子实力
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-gold text-bg-dark font-medium'
                  : 'bg-bg-card border border-border text-text-secondary hover:border-gold/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {craftingResult && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
            craftingResult.success
              ? 'bg-green/20 border border-green text-green-light'
              : 'bg-red/20 border border-red text-red-light'
          } animate-fade-in-up`}
        >
          {craftingResult.success ? (
            <Check className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
          <span>
            炼制 {craftingResult.itemName} {craftingResult.success ? '成功！' : '失败，材料已损耗'}
          </span>
        </div>
      )}

      <div className="flex-1 flex gap-6 overflow-hidden">
        {(activeTab === 'pill' || activeTab === 'artifact') && (
          <>
            <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-4 pr-2">
              {currentRecipes.map((recipe, idx) => {
                const canMake = canCraft(recipe);
                return (
                  <div
                    key={recipe.id}
                    onClick={() => setSelectedRecipe(recipe.id)}
                    className={`bg-bg-card border rounded-xl p-5 cursor-pointer transition-all ${
                      selectedRecipe === recipe.id
                        ? 'border-gold shadow-lg shadow-gold/20'
                        : 'border-border hover:border-gold/50'
                    } ${!canMake ? 'opacity-60' : ''}`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-display text-lg text-gold-light">{recipe.name}</h3>
                        <p className="text-text-muted text-sm">{recipe.description}</p>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        recipe.resultQuality === '极品'
                          ? 'bg-purple/30 text-purple-light'
                          : recipe.resultQuality === '上品'
                          ? 'bg-gold/30 text-gold-light'
                          : recipe.resultQuality === '中品'
                          ? 'bg-blue/30 text-blue-light'
                          : 'bg-bg-dark text-text-muted'
                      }`}>
                        {recipe.resultQuality}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-text-muted">所需材料：</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(recipe.materials).map(([name, amount]) => {
                          const have = materials[name] || 0;
                          const enough = have >= amount;
                          return (
                            <div
                              key={name}
                              className={`px-3 py-1 rounded-lg text-sm ${
                                enough
                                  ? 'bg-green/20 text-green-light'
                                  : 'bg-red/20 text-red-light'
                              }`}
                            >
                              {name} {have}/{amount}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-text-muted">成功率：</span>
                        <span
                          className={
                            recipe.successRate >= 0.7
                              ? 'text-green-light'
                              : recipe.successRate >= 0.5
                              ? 'text-gold-light'
                              : 'text-red-light'
                          }
                        >
                          {(recipe.successRate * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selected && (
              <div className="w-80 bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col animate-slide-in-right">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-display text-lg text-gold-light">炼制详情</h3>
                  <button
                    onClick={() => setSelectedRecipe(null)}
                    className="p-1 hover:bg-bg-dark rounded"
                  >
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto bg-bg-dark rounded-full flex items-center justify-center animate-pulse-glow">
                      {selected.type === 'pill' ? (
                        <Beaker className="w-10 h-10 text-gold" />
                      ) : (
                        <Shield className="w-10 h-10 text-blue-light" />
                      )}
                    </div>
                    <h2 className="text-2xl font-bold mt-4">{selected.name}</h2>
                    <p className="text-text-muted mt-1">{selected.description}</p>
                  </div>

                  <div className="p-4 bg-bg-dark rounded-lg">
                    <h4 className="font-medium text-gold-light mb-3">所需材料</h4>
                    <div className="space-y-2">
                      {Object.entries(selected.materials).map(([name, amount]) => {
                        const have = materials[name] || 0;
                        const enough = have >= amount;
                        return (
                          <div
                            key={name}
                            className="flex items-center justify-between"
                          >
                            <span className={enough ? 'text-green-light' : 'text-red-light'}>
                              {name}
                            </span>
                            <span className={enough ? 'text-green-light' : 'text-red-light'}>
                              {have} / {amount}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="p-4 bg-bg-dark rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-text-muted">成功率</span>
                      <span
                        className={`font-bold ${
                          selected.successRate >= 0.7
                            ? 'text-green-light'
                            : selected.successRate >= 0.5
                            ? 'text-gold-light'
                            : 'text-red-light'
                        }`}
                      >
                        {(selected.successRate * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className={`progress-fill ${
                          selected.successRate >= 0.7
                            ? 'bg-green-light'
                            : selected.successRate >= 0.5
                            ? 'bg-gold'
                            : 'bg-red-light'
                        }`}
                        style={{ width: `${selected.successRate * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-bg-dark rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted">预期品质</span>
                      <span className="text-gold-light font-medium">{selected.resultQuality}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-border">
                  <button
                    onClick={handleCraft}
                    disabled={!canCraft(selected)}
                    className="w-full btn-gold flex items-center justify-center gap-2 py-3"
                  >
                    <Flame className="w-5 h-5" />
                    {canCraft(selected) ? '开始炼制' : '材料不足'}
                  </button>
                  {!canCraft(selected) && (
                    <p className="text-text-muted text-xs text-center mt-2">
                      请先收集足够的材料
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'inventory' && (
          <div className="flex-1 overflow-y-auto">
            {items.length > 0 ? (
              <div className="grid grid-cols-3 gap-4">
                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="bg-bg-card border border-border rounded-xl p-4 card-hover"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className={`px-2 py-1 rounded text-xs ${
                          item.quality === '极品'
                            ? 'bg-purple/30 text-purple-light'
                            : item.quality === '上品'
                            ? 'bg-gold/30 text-gold-light'
                            : item.quality === '中品'
                            ? 'bg-blue/30 text-blue-light'
                            : 'bg-bg-dark text-text-muted'
                        }`}
                      >
                        {item.quality}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        item.type === 'pill'
                          ? 'bg-green/20 text-green-light'
                          : 'bg-blue/20 text-blue-light'
                      }`}>
                        {item.type === 'pill' ? '丹药' : '法器'}
                      </div>
                    </div>
                    <h3 className="font-display text-lg text-gold-light">{item.name}</h3>
                    <p className="text-text-muted text-sm mt-1">{item.description}</p>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-text-muted">数量</span>
                      <span className="text-gold-light font-medium">x{item.quantity}</span>
                    </div>
                    {item.equippedBy && (
                      <div className="mt-2 text-sm text-green-light flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        已装备
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-text-muted">
                <Sparkles className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg">成品库为空</p>
                <p className="text-sm mt-1">请先炼制丹药或法器</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-4 gap-4">
              {Object.entries(materials).map(([name, quantity], idx) => (
                <div
                  key={name}
                  className="bg-bg-card border border-border rounded-xl p-5 text-center card-hover"
                  style={{ animationDelay: `${idx * 0.05}s` }}
                >
                  <div className="w-16 h-16 mx-auto bg-bg-dark rounded-full flex items-center justify-center mb-3">
                    <Flame className="w-8 h-8 text-gold" />
                  </div>
                  <h3 className="font-display text-lg text-gold-light">{name}</h3>
                  <p className="text-3xl font-bold text-gold-light mt-2">
                    {quantity}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
