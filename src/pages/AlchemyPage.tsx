import { useState, useEffect, useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { ItemSource, QualityType } from '@/types/game';
import {
  Flame,
  Beaker,
  Shield,
  Sparkles,
  AlertTriangle,
  Check,
  X,
  Star,
  ShoppingCart,
  Users,
  Filter,
  Coins,
  Package,
  Boxes,
} from 'lucide-react';

type TabType = 'pill' | 'artifact' | 'inventory' | 'materials';

const SOURCE_LABELS: Record<ItemSource, string> = {
  crafted: '炼制',
  expedition: '探索',
  market: '坊市',
  starting: '初始',
  unknown: '未知',
};

const QUALITY_COLORS: Record<QualityType, string> = {
  下品: 'bg-bg-dark text-text-muted',
  中品: 'bg-blue/30 text-blue-light',
  上品: 'bg-gold/30 text-gold-light',
  极品: 'bg-purple/30 text-purple-light',
};

const SOURCE_COLORS: Record<ItemSource, string> = {
  crafted: 'bg-green/20 text-green-light',
  expedition: 'bg-blue/20 text-blue-light',
  market: 'bg-gold/20 text-gold-light',
  starting: 'bg-purple/20 text-purple-light',
  unknown: 'bg-bg-dark text-text-muted',
};

export default function AlchemyPage() {
  const recipes = useGameStore((s) => s.recipes);
  const items = useGameStore((s) => s.items);
  const materials = useGameStore((s) => s.materials);
  const disciples = useGameStore((s) => s.disciples);
  const craftItem = useGameStore((s) => s.craftItem);
  const pendingCraftResult = useGameStore((s) => s.pendingCraftResult);
  const clearPendingCraftResult = useGameStore((s) => s.clearPendingCraftResult);
  const toggleMaterialReserved = useGameStore((s) => s.toggleMaterialReserved);
  const toggleItemReserved = useGameStore((s) => s.toggleItemReserved);
  const sellMaterial = useGameStore((s) => s.sellMaterial);
  const sellItem = useGameStore((s) => s.sellItem);
  const consumePill = useGameStore((s) => s.usePill);

  const [activeTab, setActiveTab] = useState<TabType>('pill');
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [craftingResult, setCraftingResult] = useState<{ success: boolean; itemName: string } | null>(null);
  const [pillModalItemId, setPillModalItemId] = useState<string | null>(null);

  const [matFilterSource, setMatFilterSource] = useState<ItemSource | 'all'>('all');
  const [matFilterReserved, setMatFilterReserved] = useState<'all' | 'reserved' | 'unreserved'>('all');
  const [matFilterPurpose, setMatFilterPurpose] = useState<'all' | 'craftable'>('all');

  const [itemFilterSource, setItemFilterSource] = useState<ItemSource | 'all'>('all');
  const [itemFilterQuality, setItemFilterQuality] = useState<QualityType | 'all'>('all');
  const [itemFilterType, setItemFilterType] = useState<'all' | 'pill' | 'artifact'>('all');
  const [itemFilterReserved, setItemFilterReserved] = useState<'all' | 'reserved' | 'unreserved'>('all');

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
      const entry = materials[material];
      if (!entry || entry.quantity < amount) return false;
      if (entry.reserved) return false;
    }
    return true;
  };

  const handleCraft = () => {
    if (!selected) return;
    craftItem(selected.id);
  };

  const administerPillToDisciple = (discipleId: string) => {
    if (!pillModalItemId) return;
    consumePill(pillModalItemId, discipleId);
    setPillModalItemId(null);
  };

  const stats = useMemo(() => {
    const materialTypes = Object.keys(materials).filter((k) => materials[k].quantity > 0).length;
    const itemTypes = items.reduce((acc, it) => {
      const key = `${it.name}-${it.quality}-${it.type}`;
      if (!acc.has(key)) acc.add(key);
      return acc;
    }, new Set<string>()).size;
    let totalValue = 0;
    Object.values(materials).forEach((m) => {
      totalValue += m.marketPrice * m.quantity;
    });
    items.forEach((it) => {
      totalValue += it.marketPrice * it.quantity;
    });
    return { materialTypes, itemTypes, totalValue };
  }, [materials, items]);

  const filteredMaterials = useMemo(() => {
    return Object.entries(materials)
      .filter(([, entry]) => entry.quantity > 0)
      .filter(([name, entry]) => {
        if (matFilterSource !== 'all' && entry.source !== matFilterSource) return false;
        if (matFilterReserved === 'reserved' && !entry.reserved) return false;
        if (matFilterReserved === 'unreserved' && entry.reserved) return false;
        if (matFilterPurpose === 'craftable') {
          const used = recipes.some((r) => Object.keys(r.materials).includes(name));
          if (!used) return false;
        }
        return true;
      });
  }, [materials, recipes, matFilterSource, matFilterReserved, matFilterPurpose]);

  const filteredItems = useMemo(() => {
    return items.filter((it) => {
      if (itemFilterSource !== 'all' && it.source !== itemFilterSource) return false;
      if (itemFilterQuality !== 'all' && it.quality !== itemFilterQuality) return false;
      if (itemFilterType !== 'all' && it.type !== itemFilterType) return false;
      if (itemFilterReserved === 'reserved' && !it.reserved) return false;
      if (itemFilterReserved === 'unreserved' && it.reserved) return false;
      return true;
    });
  }, [items, itemFilterSource, itemFilterQuality, itemFilterType, itemFilterReserved]);

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

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-bg-card border border-border rounded-lg p-4 flex items-center gap-3">
          <div className="p-3 bg-gold/20 rounded-lg">
            <Package className="w-5 h-5 text-gold" />
          </div>
          <div>
            <p className="text-text-muted text-sm">材料种类</p>
            <p className="text-xl font-bold text-gold-light">{stats.materialTypes}</p>
          </div>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-4 flex items-center gap-3">
          <div className="p-3 bg-purple/20 rounded-lg">
            <Boxes className="w-5 h-5 text-purple-light" />
          </div>
          <div>
            <p className="text-text-muted text-sm">成品种类</p>
            <p className="text-xl font-bold text-gold-light">{stats.itemTypes}</p>
          </div>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-4 flex items-center gap-3">
          <div className="p-3 bg-green/20 rounded-lg">
            <Coins className="w-5 h-5 text-green-light" />
          </div>
          <div>
            <p className="text-text-muted text-sm">库房总估值</p>
            <p className="text-xl font-bold text-gold-light">{stats.totalValue.toLocaleString()} 灵石</p>
          </div>
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
                      <div className={`px-2 py-1 rounded text-xs ${QUALITY_COLORS[recipe.resultQuality]}`}>
                        {recipe.resultQuality}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-text-muted">所需材料：</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(recipe.materials).map(([name, amount]) => {
                          const entry = materials[name];
                          const have = entry?.quantity || 0;
                          const enough = have >= amount && !entry?.reserved;
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
                              {entry?.reserved && <span className="ml-1">(保留)</span>}
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
                        const entry = materials[name];
                        const have = entry?.quantity || 0;
                        const enough = have >= amount && !entry?.reserved;
                        return (
                          <div
                            key={name}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className={enough ? 'text-green-light' : 'text-red-light'}>
                                {name}
                              </span>
                              {entry?.reserved && (
                                <Star className="w-3 h-3 text-gold fill-gold" />
                              )}
                            </div>
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
                    {canCraft(selected) ? '开始炼制' : '材料不足或被保留'}
                  </button>
                  {!canCraft(selected) && (
                    <p className="text-text-muted text-xs text-center mt-2">
                      请先收集足够的材料，或取消保留状态
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'inventory' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-bg-card border border-border rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gold" />
                <span className="font-medium text-gold-light">成品筛选</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-sm">来源：</span>
                  <select
                    value={itemFilterSource}
                    onChange={(e) => setItemFilterSource(e.target.value as ItemSource | 'all')}
                    className="bg-bg-dark border border-border rounded px-2 py-1 text-sm text-text-secondary focus:border-gold focus:outline-none"
                  >
                    <option value="all">全部</option>
                    <option value="crafted">炼制</option>
                    <option value="expedition">探索</option>
                    <option value="market">坊市</option>
                    <option value="starting">初始</option>
                    <option value="unknown">未知</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-sm">品质：</span>
                  <select
                    value={itemFilterQuality}
                    onChange={(e) => setItemFilterQuality(e.target.value as QualityType | 'all')}
                    className="bg-bg-dark border border-border rounded px-2 py-1 text-sm text-text-secondary focus:border-gold focus:outline-none"
                  >
                    <option value="all">全部</option>
                    <option value="下品">下品</option>
                    <option value="中品">中品</option>
                    <option value="上品">上品</option>
                    <option value="极品">极品</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-sm">类型：</span>
                  <select
                    value={itemFilterType}
                    onChange={(e) => setItemFilterType(e.target.value as 'all' | 'pill' | 'artifact')}
                    className="bg-bg-dark border border-border rounded px-2 py-1 text-sm text-text-secondary focus:border-gold focus:outline-none"
                  >
                    <option value="all">全部</option>
                    <option value="pill">丹药</option>
                    <option value="artifact">法器</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-sm">保留：</span>
                  <select
                    value={itemFilterReserved}
                    onChange={(e) => setItemFilterReserved(e.target.value as 'all' | 'reserved' | 'unreserved')}
                    className="bg-bg-dark border border-border rounded px-2 py-1 text-sm text-text-secondary focus:border-gold focus:outline-none"
                  >
                    <option value="all">全部</option>
                    <option value="reserved">已保留</option>
                    <option value="unreserved">未保留</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredItems.length > 0 ? (
                <div className="space-y-2">
                  {filteredItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="bg-bg-card border border-border rounded-xl p-4 card-hover"
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => toggleItemReserved(item.id)}
                            className={`p-1 rounded transition-colors ${
                              item.reserved
                                ? 'text-gold hover:text-gold-light'
                                : 'text-text-muted hover:text-gold'
                            }`}
                            title={item.reserved ? '取消保留' : '标记保留'}
                          >
                            <Star className={`w-5 h-5 ${item.reserved ? 'fill-gold' : ''}`} />
                          </button>

                          <div className="flex items-center gap-2">
                            <div className={`px-2 py-1 rounded text-xs ${QUALITY_COLORS[item.quality]}`}>
                              {item.quality}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs ${
                              item.type === 'pill'
                                ? 'bg-green/20 text-green-light'
                                : 'bg-blue/20 text-blue-light'
                            }`}>
                              {item.type === 'pill' ? '丹药' : '法器'}
                            </div>
                            <div className={`px-2 py-1 rounded text-xs ${SOURCE_COLORS[item.source]}`}>
                              {SOURCE_LABELS[item.source]}
                            </div>
                          </div>

                          <div>
                            <h3 className="font-display text-lg text-gold-light">{item.name}</h3>
                            <p className="text-text-muted text-sm">{item.effect || item.description}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-text-muted">单价</div>
                            <div className="font-medium text-gold-light">{item.marketPrice.toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-text-muted">数量</div>
                            <div className="font-medium text-gold-light">x{item.quantity}</div>
                          </div>

                          {item.type === 'pill' && !item.reserved && !item.equippedBy && (
                            <button
                              onClick={() => setPillModalItemId(item.id)}
                              className="btn-primary flex items-center gap-1 px-3 py-2 text-sm"
                            >
                              <Users className="w-4 h-4" />
                              给弟子服用
                            </button>
                          )}

                          {item.equippedBy && (
                            <div className="text-sm text-green-light flex items-center gap-1 px-3 py-2">
                              <Check className="w-4 h-4" />
                              已装备
                            </div>
                          )}

                          <button
                            onClick={() => sellItem(item.id, 1)}
                            disabled={item.reserved || !!item.equippedBy}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                              item.reserved || item.equippedBy
                                ? 'bg-bg-dark text-text-muted cursor-not-allowed'
                                : 'bg-gold/20 text-gold-light hover:bg-gold/30'
                            }`}
                            title={item.reserved ? '保留物品不可出售' : item.equippedBy ? '已装备不可出售' : '出售 1 个'}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            出售
                          </button>
                        </div>
                      </div>
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
          </div>
        )}

        {activeTab === 'materials' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="bg-bg-card border border-border rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gold" />
                <span className="font-medium text-gold-light">材料筛选</span>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-sm">来源：</span>
                  <select
                    value={matFilterSource}
                    onChange={(e) => setMatFilterSource(e.target.value as ItemSource | 'all')}
                    className="bg-bg-dark border border-border rounded px-2 py-1 text-sm text-text-secondary focus:border-gold focus:outline-none"
                  >
                    <option value="all">全部</option>
                    <option value="crafted">炼制</option>
                    <option value="expedition">探索</option>
                    <option value="market">坊市</option>
                    <option value="starting">初始</option>
                    <option value="unknown">未知</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-sm">保留：</span>
                  <select
                    value={matFilterReserved}
                    onChange={(e) => setMatFilterReserved(e.target.value as 'all' | 'reserved' | 'unreserved')}
                    className="bg-bg-dark border border-border rounded px-2 py-1 text-sm text-text-secondary focus:border-gold focus:outline-none"
                  >
                    <option value="all">全部</option>
                    <option value="reserved">已保留</option>
                    <option value="unreserved">未保留</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-text-muted text-sm">用途：</span>
                  <select
                    value={matFilterPurpose}
                    onChange={(e) => setMatFilterPurpose(e.target.value as 'all' | 'craftable')}
                    className="bg-bg-dark border border-border rounded px-2 py-1 text-sm text-text-secondary focus:border-gold focus:outline-none"
                  >
                    <option value="all">全部</option>
                    <option value="craftable">可炼制材料</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredMaterials.length > 0 ? (
                <div className="space-y-2">
                  {filteredMaterials.map(([name, entry], idx) => (
                    <div
                      key={name}
                      className="bg-bg-card border border-border rounded-xl p-4 card-hover"
                      style={{ animationDelay: `${idx * 0.03}s` }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => toggleMaterialReserved(name)}
                            className={`p-1 rounded transition-colors ${
                              entry.reserved
                                ? 'text-gold hover:text-gold-light'
                                : 'text-text-muted hover:text-gold'
                            }`}
                            title={entry.reserved ? '取消保留' : '标记保留'}
                          >
                            <Star className={`w-5 h-5 ${entry.reserved ? 'fill-gold' : ''}`} />
                          </button>

                          <div className={`px-2 py-1 rounded text-xs ${SOURCE_COLORS[entry.source]}`}>
                            {SOURCE_LABELS[entry.source]}
                          </div>

                          <div>
                            <h3 className="font-display text-lg text-gold-light">{name}</h3>
                            {entry.reserved && (
                              <p className="text-xs text-gold">保留中 - 不可出售、不可用于炼制</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-text-muted">单价</div>
                            <div className="font-medium text-gold-light">{entry.marketPrice.toLocaleString()}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-text-muted">数量</div>
                            <div className="font-medium text-gold-light">x{entry.quantity}</div>
                          </div>

                          <button
                            onClick={() => sellMaterial(name, 1)}
                            disabled={entry.reserved}
                            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                              entry.reserved
                                ? 'bg-bg-dark text-text-muted cursor-not-allowed'
                                : 'bg-gold/20 text-gold-light hover:bg-gold/30'
                            }`}
                            title={entry.reserved ? '保留物品不可出售' : '出售 1 个'}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            出售
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-text-muted">
                  <Flame className="w-16 h-16 mb-4 opacity-30" />
                  <p className="text-lg">材料库为空</p>
                  <p className="text-sm mt-1">请先探索秘境获取材料</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {pillModalItemId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-bg-card border border-border rounded-xl p-6 w-[500px] max-h-[70vh] flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display text-xl text-gold-light">选择弟子服用</h3>
                {(() => {
                  const pill = items.find((it) => it.id === pillModalItemId);
                  if (!pill) return null;
                  return (
                    <p className="text-text-muted text-sm mt-1">
                      {pill.quality} {pill.name} - {pill.effect} · 库存 x{pill.quantity}
                    </p>
                  );
                })()}
              </div>
              <button
                onClick={() => setPillModalItemId(null)}
                className="p-1 hover:bg-bg-dark rounded"
              >
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {disciples.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p>暂无弟子</p>
                </div>
              ) : (
                disciples.map((d) => {
                  const pill = items.find((it) => it.id === pillModalItemId);
                  const disabled = !pill || pill.quantity <= 0 || pill.reserved || !!pill.equippedBy;
                  return (
                    <button
                      key={d.id}
                      onClick={() => !disabled && administerPillToDisciple(d.id)}
                      disabled={disabled}
                      className={`w-full border rounded-lg p-3 text-left transition-colors flex items-center gap-3 ${
                        disabled
                          ? 'bg-bg-dark/50 border-border text-text-muted cursor-not-allowed'
                          : 'bg-bg-dark hover:bg-bg-dark/80 border-border hover:border-gold/50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
                        {d.name.slice(0, 1)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gold-light">{d.name}</div>
                        <div className="text-sm text-text-muted">
                          {d.realm} · {d.spiritRoot}灵根 · {d.status}
                        </div>
                        <div className="text-xs text-text-muted mt-1">
                          修为 {Math.floor(d.cultivation)}/{d.maxCultivation}
                          {d.status === '受伤' && <span className="text-red-light ml-2">· 受伤中</span>}
                        </div>
                      </div>
                      {disabled ? (
                        <div className="text-text-muted text-xs">
                          {!pill ? '丹药不存在' : pill.quantity <= 0 ? '库存不足' : pill.reserved ? '已保留' : '已装备'}
                        </div>
                      ) : (
                        <div className="text-gold">
                          <Check className="w-5 h-5" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
