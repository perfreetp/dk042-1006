import { useState, useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { REALM_NAMES, RELATION_COLORS, BOND_COLORS } from '@/types/game';
import {
  X,
  TrendingUp,
  TrendingDown,
  Gem,
  Star,
  Users,
  Sword,
  AlertTriangle,
  Award,
  Heart,
  ChevronLeft,
  ChevronRight,
  Map,
  Sparkles,
  Link,
  Gavel,
  Flame,
  Package,
} from 'lucide-react';

export default function SettlementModal() {
  const currentSettlement = useGameStore((s) => s.currentSettlement);
  const reports = useGameStore((s) => s.reports);
  const dismissSettlement = useGameStore((s) => s.dismissSettlement);
  const openHistoricalReport = useGameStore((s) => s.openHistoricalReport);
  const disciples = useGameStore((s) => s.disciples);
  const factions = useGameStore((s) => s.factions);

  const [tab, setTab] = useState<'overview' | 'exploration' | 'inventory' | 'relationships' | 'rule'>('overview');

  useEffect(() => {
    setTab('overview');
  }, [currentSettlement?.month]);

  if (!currentSettlement) return null;

  const reportMonths = reports.map((r) => r.month).sort((a, b) => a - b);
  const currentMonthIdx = reportMonths.indexOf(currentSettlement.month);
  const isHistorical = reports.some((r) => r.month === currentSettlement.month) && currentMonthIdx !== -1;

  const goPrevMonth = () => {
    if (currentMonthIdx > 0) openHistoricalReport(reportMonths[currentMonthIdx - 1]);
  };
  const goNextMonth = () => {
    if (currentMonthIdx < reportMonths.length - 1) openHistoricalReport(reportMonths[currentMonthIdx + 1]);
  };

  const netIncome = currentSettlement.spiritStoneNet;
  const getDiscipleName = (id: string) => disciples.find((d) => d.id === id)?.name || id;
  const qualityColor: Record<string, string> = {
    极品: 'text-purple-light',
    上品: 'text-gold-light',
    中品: 'text-blue-light',
    下品: 'text-text-muted',
  };
  const kindLabel: Record<string, string> = {
    material: '材料',
    item: '物品',
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in-up">
      <div className="bg-bg-card border-2 border-gold rounded-lg w-[780px] max-h-[85vh] overflow-hidden scroll-paper flex flex-col">
        <div className="sticky top-0 bg-bg-card border-b border-gold px-6 py-4 z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={goPrevMonth}
              disabled={currentMonthIdx <= 0}
              className="p-2 rounded hover:bg-bg-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <h2 className="text-2xl font-display font-bold text-gold-light">
                第 {currentSettlement.month} 月 · 月度战报
                {isHistorical && <span className="ml-2 text-sm text-text-muted">(历史)</span>}
              </h2>
              <p className="text-text-muted text-sm mt-0.5">
                {currentMonthIdx >= 0
                  ? `第 ${currentMonthIdx + 1} / 共 ${reportMonths.length} 份战报`
                  : '本月宗门运营情况汇总'}
              </p>
            </div>
            <button
              onClick={goNextMonth}
              disabled={currentMonthIdx < 0 || currentMonthIdx >= reportMonths.length - 1}
              className="p-2 rounded hover:bg-bg-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
          <button
            onClick={dismissSettlement}
            className="p-2 hover:bg-bg-card-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="border-b border-border flex gap-1 px-6 py-2 bg-bg-dark/50">
          {[
            { id: 'overview', label: '收支·伤亡·突破', icon: Gem },
            { id: 'exploration', label: '探索·炼制', icon: Map },
            { id: 'inventory', label: '库存变化', icon: Package },
            { id: 'relationships', label: '弟子关系', icon: Link },
            { id: 'rule', label: '门规·势力', icon: Gavel },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id as typeof tab)}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-colors ${
                  tab === t.id
                    ? 'bg-gold/20 text-gold-light border border-gold/40'
                    : 'text-text-muted hover:text-gold-light hover:bg-bg-dark'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-bg-dark p-4 rounded-lg border border-border text-center">
                  <Gem className="w-6 h-6 text-blue-light mx-auto mb-2" />
                  <p className="text-text-muted text-sm">收入</p>
                  <p className="text-2xl font-bold text-green-light">
                    +{currentSettlement.spiritStoneIncome}
                  </p>
                </div>
                <div className="bg-bg-dark p-4 rounded-lg border border-border text-center">
                  <TrendingDown className="w-6 h-6 text-red-light mx-auto mb-2" />
                  <p className="text-text-muted text-sm">支出</p>
                  <p className="text-2xl font-bold text-red-light">
                    -{currentSettlement.spiritStoneExpense}
                  </p>
                </div>
                <div className="bg-bg-dark p-4 rounded-lg border border-gold text-center">
                  <TrendingUp className="w-6 h-6 text-gold mx-auto mb-2" />
                  <p className="text-text-muted text-sm">净收入</p>
                  <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-light' : 'text-red-light'}`}>
                    {netIncome >= 0 ? '+' : ''}{netIncome}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg-dark p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-gold" />
                    <span className="font-display text-gold-light">声望变化</span>
                  </div>
                  <p className={`text-3xl font-bold ${currentSettlement.reputationChange >= 0 ? 'text-green-light' : 'text-red-light'}`}>
                    {currentSettlement.reputationChange >= 0 ? '+' : ''}{currentSettlement.reputationChange}
                  </p>
                </div>
                <div className="bg-bg-dark p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Heart className="w-5 h-5 text-purple-light" />
                    <span className="font-display text-gold-light">修炼总增益</span>
                  </div>
                  <p className="text-3xl font-bold text-purple-light">
                    +{currentSettlement.cultivationGains}
                  </p>
                </div>
              </div>

              {currentSettlement.breakthroughs.length > 0 && (
                <div className="bg-bg-dark p-4 rounded-lg border border-gold">
                  <div className="flex items-center gap-2 mb-3">
                    <Award className="w-5 h-5 text-gold" />
                    <span className="font-display text-gold-light">境界突破</span>
                    <span className="ml-auto text-xs text-gold-light bg-gold/20 px-2 py-0.5 rounded">
                      成功 {currentSettlement.breakthroughs.filter((b) => b.success).length} / 尝试 {currentSettlement.breakthroughs.length}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {currentSettlement.breakthroughs.map((b, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-border/40 last:border-0">
                        <span className="text-text-primary">{b.discipleName}</span>
                        <span>
                          {b.success ? (
                            <span className="text-gold">
                              {b.fromRealm} → <b>{b.toRealm}</b> ✦
                            </span>
                          ) : (
                            <span className="text-red-light">
                              {b.fromRealm} 突破失败，走火入魔
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentSettlement.casualties.length > 0 && (
                <div className="bg-red/10 p-4 rounded-lg border border-red">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-light" />
                    <span className="font-display text-red-light">伤亡报告</span>
                    <span className="ml-auto text-xs text-red-light bg-red/20 px-2 py-0.5 rounded">
                      {currentSettlement.casualties.length} 人
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {currentSettlement.casualties.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-text-primary">{c.discipleName}</span>
                        <span className="text-red-light">{c.cause}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentSettlement.newDisciples.length > 0 && (
                <div className="bg-green/10 p-4 rounded-lg border border-green">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-green-light" />
                    <span className="font-display text-green-light">新加入弟子</span>
                    <span className="ml-auto text-xs text-green-light bg-green/20 px-2 py-0.5 rounded">
                      {currentSettlement.newDisciples.length} 人
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {currentSettlement.newDisciples.map((id) => (
                      <span key={id} className="px-3 py-1 rounded bg-bg-dark text-sm text-text-primary">
                        {getDiscipleName(id)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {currentSettlement.events.length > 0 && (
                <div className="bg-bg-dark p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Sword className="w-5 h-5 text-gold" />
                    <span className="font-display text-gold-light">遗留未处理事件</span>
                    <span className="text-xs text-red-light ml-auto bg-red/10 px-2 py-0.5 rounded">
                      {currentSettlement.events.length} 件
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {currentSettlement.events.map((e) => (
                      <div key={e.id} className="text-sm text-text-muted py-1 flex items-center gap-2">
                        <span className="text-gold">·</span>
                        {e.title}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'exploration' && (
            <div className="space-y-5">
              {currentSettlement.explorationRecords.length > 0 ? (
                currentSettlement.explorationRecords.map((rec, idx) => (
                  <div
                    key={idx}
                    className={`rounded-lg p-4 border ${
                      rec.success ? 'bg-bg-dark border-gold/50' : 'bg-red/10 border-red/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Map className={`w-5 h-5 ${rec.success ? 'text-gold' : 'text-red-light'}`} />
                        <h4 className="font-display text-gold-light text-lg">{rec.realmName}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          rec.success ? 'bg-green/20 text-green-light' : 'bg-red/20 text-red-light'
                        }`}>
                          {rec.success ? '探索成功' : '探索失败'}
                        </span>
                      </div>
                      <div className="text-right text-sm">
                        <span className="text-green-light mr-3">灵石 +{rec.spiritStones}</span>
                        <span className={rec.reputation >= 0 ? 'text-gold-light' : 'text-red-light'}>
                          声望 {rec.reputation >= 0 ? '+' : ''}{rec.reputation}
                        </span>
                      </div>
                    </div>

                    {rec.casualties.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {rec.casualties.map((c, i) => (
                          <span key={i} className="text-xs px-2 py-1 rounded bg-red/20 text-red-light">
                            ⚠ {c.discipleName} {c.cause}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-bg-card rounded p-3">
                        <p className="text-xs text-text-muted mb-2 flex items-center gap-1">
                          <Flame className="w-3 h-3" /> 材料收获
                        </p>
                        {Object.keys(rec.materialGains).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(rec.materialGains).map(([name, qty]) => (
                              <span key={name} className="text-xs px-2 py-1 rounded bg-blue/10 text-blue-light">
                                {name} x{qty}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-text-muted">无</p>
                        )}
                      </div>
                      <div className="bg-bg-card rounded p-3">
                        <p className="text-xs text-text-muted mb-2 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> 成品收获
                        </p>
                        {rec.itemGains.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {rec.itemGains.map((it, i) => (
                              <span
                                key={i}
                                className={`text-xs px-2 py-1 rounded bg-purple/10 ${qualityColor[it.quality]}`}
                              >
                                [{it.quality}]{it.name} x{it.quantity}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-text-muted">无</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-text-muted py-12">
                  <Map className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>本月无秘境探索记录</p>
                </div>
              )}

              {currentSettlement.craftRecords.length > 0 && (
                <div className="bg-bg-dark p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-gold" />
                    <span className="font-display text-gold-light">本月炼制记录</span>
                  </div>
                  <div className="space-y-1.5">
                    {currentSettlement.craftRecords.map((cr, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-text-primary">
                          {cr.type === 'pill' ? '丹药' : '法器'} · {cr.recipeName}
                        </span>
                        <span className={cr.success ? 'text-green-light' : 'text-red-light'}>
                          {cr.success ? `成功炼制 ${cr.quality}` : '失败，材料已损耗'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'inventory' && (
            <div className="space-y-5">
              <div className="bg-bg-dark p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-gold" />
                    <span className="font-display text-gold-light">库存变化明细</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-light">
                      增加 {currentSettlement.inventoryChanges.filter((c) => c.delta > 0).length} 项
                    </span>
                    <span className="text-red-light">
                      减少 {currentSettlement.inventoryChanges.filter((c) => c.delta < 0).length} 项
                    </span>
                  </div>
                </div>

                {currentSettlement.inventoryChanges.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {currentSettlement.inventoryChanges.map((ic, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded bg-bg-card text-sm"
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs px-2 py-0.5 rounded bg-bg-dark text-text-muted">
                            {kindLabel[ic.kind] || ic.kind}
                          </span>
                          {ic.quality && (
                            <span className={`text-xs ${qualityColor[ic.quality]}`}>
                              [{ic.quality}]
                            </span>
                          )}
                          <span className="text-text-primary">{ic.name}</span>
                          {ic.type && ic.kind === 'item' && (
                            <span className="text-xs text-text-muted">
                              ({ic.type === 'pill' ? '丹药' : ic.type === 'artifact' ? '法器' : '材料'})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-text-muted max-w-[140px] truncate">{ic.reason}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              ic.delta > 0
                                ? 'bg-green/20 text-green-light'
                                : 'bg-red/20 text-red-light'
                            }`}
                          >
                            {ic.delta > 0 ? '+' : ''}{ic.delta}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-text-muted py-12">
                    <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>本月库存无变化</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'relationships' && (
            <div className="space-y-5">
              <div className="bg-bg-dark p-4 rounded-lg border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Link className="w-5 h-5 text-gold" />
                    <span className="font-display text-gold-light">本月关系变化</span>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span className="text-green-light">
                      关系改善 {currentSettlement.relationshipMonthlyDelta.improvedCount} 对
                    </span>
                    <span className="text-red-light">
                      关系恶化 {currentSettlement.relationshipMonthlyDelta.worsenedCount} 对
                    </span>
                  </div>
                </div>

                <div className="border-t border-border pt-3 mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display text-gold-light text-sm">当前关系状态</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-light">
                        友好关系 {currentSettlement.relationshipSummary.improvedPairs} 对
                      </span>
                      <span className="text-red-light">
                        对立关系 {currentSettlement.relationshipSummary.worsenedPairs} 对
                      </span>
                      <span className={`${
                        currentSettlement.relationshipSummary.impact >= 0 ? 'text-green-light' : 'text-red-light'
                      }`}>
                        声望影响 {currentSettlement.relationshipSummary.impact >= 0 ? '+' : ''}
                        {currentSettlement.relationshipSummary.impact}
                      </span>
                    </div>
                  </div>
                </div>

                {currentSettlement.relationshipChanges.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-2 mb-4">
                    {currentSettlement.relationshipChanges.map((rc, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded bg-bg-card text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-text-primary">{rc.discipleAName}</span>
                          <span className="text-text-muted">↔</span>
                          <span className="text-text-primary">{rc.discipleBName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-text-muted max-w-xs truncate">{rc.reason}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              rc.delta > 0
                                ? 'bg-green/20 text-green-light'
                                : 'bg-red/20 text-red-light'
                            }`}
                          >
                            {rc.delta > 0 ? '+' : ''}{rc.delta}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-text-muted py-4 mb-4">本月弟子关系无重大变化</p>
                )}
              </div>

              {(currentSettlement.activeBonds.length > 0 || currentSettlement.bondEffects.length > 0) && (
                <div className="bg-bg-dark p-4 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-purple-light" />
                      <span className="font-display text-gold-light">活跃羁绊</span>
                    </div>
                    <span className="text-xs text-text-muted">
                      共 {currentSettlement.activeBonds.length} 对羁绊
                    </span>
                  </div>

                  {currentSettlement.activeBonds.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-text-muted mb-2">当前羁绊</p>
                      <div className="flex flex-wrap gap-2">
                        {currentSettlement.activeBonds.map((bond, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-3 py-1.5 rounded bg-bg-card flex items-center gap-1.5"
                          >
                            <span className="text-text-primary">{bond.discipleAName}</span>
                            <span className="text-text-muted">·</span>
                            <span className="text-text-primary">{bond.discipleBName}</span>
                            <span
                              className="ml-1 px-1.5 py-0.5 rounded text-xs font-medium"
                              style={{ color: BOND_COLORS[bond.type], backgroundColor: `${BOND_COLORS[bond.type]}20` }}
                            >
                              {bond.type}
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {currentSettlement.bondEffects.length > 0 && (
                    <div>
                      <p className="text-xs text-text-muted mb-2">羁绊效果</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                        {currentSettlement.bondEffects.map((be, idx) => (
                          <div
                            key={idx}
                            className="p-3 rounded bg-bg-card border border-border"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-text-primary font-medium">{be.discipleAName}</span>
                                <span className="text-text-muted">·</span>
                                <span className="text-text-primary font-medium">{be.discipleBName}</span>
                                <span
                                  className="px-2 py-0.5 rounded text-xs font-medium"
                                  style={{ color: BOND_COLORS[be.type], backgroundColor: `${BOND_COLORS[be.type]}20` }}
                                >
                                  {be.type}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-text-muted mb-2">{be.effect}</p>
                            <div className="flex flex-wrap gap-3 text-xs">
                              {be.cultivationBoost !== 0 && (
                                <span className={be.cultivationBoost > 0 ? 'text-purple-light' : 'text-red-light'}>
                                  修炼加成 {be.cultivationBoost > 0 ? '+' : ''}{be.cultivationBoost}
                                </span>
                              )}
                              {be.expeditionBoost !== 0 && (
                                <span className={be.expeditionBoost > 0 ? 'text-blue-light' : 'text-red-light'}>
                                  探索加成 {be.expeditionBoost > 0 ? '+' : ''}{be.expeditionBoost}
                                </span>
                              )}
                              {be.reputationImpact !== 0 && (
                                <span className={be.reputationImpact > 0 ? 'text-gold-light' : 'text-red-light'}>
                                  声望影响 {be.reputationImpact > 0 ? '+' : ''}{be.reputationImpact}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'rule' && (
            <div className="space-y-5">
              <div className="bg-bg-dark p-4 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Gavel className="w-5 h-5 text-gold" />
                  <span className="font-display text-gold-light">门规影响</span>
                </div>
                {currentSettlement.ruleImpact.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {currentSettlement.ruleImpact.map((ri, idx) => (
                      <div key={idx} className="p-3 rounded bg-gold/10 border border-gold/30">
                        <div className="text-gold-light font-medium mb-1">{ri.label}</div>
                        <div className="text-sm text-text-muted">{ri.effect}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {currentSettlement.factionChanges.length > 0 && (
                <div className="bg-bg-dark p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-5 h-5 text-blue-light" />
                    <span className="font-display text-gold-light">势力关系变化</span>
                  </div>
                  <div className="space-y-2">
                    {currentSettlement.factionChanges.map((change, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded bg-bg-card text-sm">
                        <span className="text-text-primary">{change.factionName}</span>
                        <div className="flex items-center gap-2">
                          <span style={{ color: RELATION_COLORS[change.oldRelation] }} className="px-2 py-0.5 rounded bg-bg-dark">
                            {change.oldRelation}
                          </span>
                          <span className="text-text-muted">→</span>
                          <span
                            style={{ color: RELATION_COLORS[change.newRelation] }}
                            className="px-2 py-0.5 rounded bg-bg-dark font-medium"
                          >
                            {change.newRelation}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {factions.length > 0 && (
                <div className="bg-bg-dark p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Sword className="w-5 h-5 text-gold" />
                    <span className="font-display text-gold-light">当前势力总览</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {factions.map((f) => (
                      <div
                        key={f.id}
                        className="p-3 rounded bg-bg-card border border-border text-center"
                      >
                        <p className="font-medium text-text-primary mb-1">{f.name}</p>
                        <p
                          style={{ color: RELATION_COLORS[f.relation] }}
                          className="text-sm font-medium"
                        >
                          {f.relation}
                        </p>
                        <p className="text-xs text-text-muted mt-1">势力值 {f.power}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-bg-card border-t border-gold p-4 flex items-center gap-3">
          <div className="text-sm text-text-muted flex-1">
            {reports.length > 0 && (
              <span>
                历史战报：
                {reportMonths.slice(-6).map((m) => (
                  <button
                    key={m}
                    onClick={() => openHistoricalReport(m)}
                    className={`ml-2 px-2 py-0.5 rounded text-xs transition-colors ${
                      m === currentSettlement.month
                        ? 'bg-gold text-bg-dark'
                        : 'bg-bg-dark hover:bg-gold/20 text-text-secondary'
                    }`}
                  >
                    第{m}月
                  </button>
                ))}
              </span>
            )}
          </div>
          <button
            onClick={dismissSettlement}
            className="btn-gold px-8"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
