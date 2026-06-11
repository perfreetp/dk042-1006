import { useGameStore } from '@/store/gameStore';
import { REALM_NAMES, RELATION_COLORS } from '@/types/game';
import { X, TrendingUp, TrendingDown, Gem, Star, Users, Sword, AlertTriangle, Award, Heart } from 'lucide-react';

export default function SettlementModal() {
  const currentSettlement = useGameStore((s) => s.currentSettlement);
  const dismissSettlement = useGameStore((s) => s.dismissSettlement);
  const disciples = useGameStore((s) => s.disciples);
  const factions = useGameStore((s) => s.factions);

  if (!currentSettlement) return null;

  const netIncome = currentSettlement.spiritStoneIncome - currentSettlement.spiritStoneExpense;

  const getDiscipleName = (id: string) => disciples.find((d) => d.id === id)?.name || id;
  const getFactionName = (id: string) => factions.find((f) => f.id === id)?.name || id;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in-up">
      <div className="bg-bg-card border-2 border-gold rounded-lg w-[700px] max-h-[80vh] overflow-hidden scroll-paper">
        <div className="sticky top-0 bg-bg-card border-b border-gold p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-display font-bold text-gold-light">
              第 {currentSettlement.month} 月 · 月度结算
            </h2>
            <p className="text-text-muted text-sm mt-1">本月宗门运营情况汇总</p>
          </div>
          <button
            onClick={dismissSettlement}
            className="p-2 hover:bg-bg-card-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(80vh-120px)]">
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
              </div>
              <div className="space-y-2">
                {currentSettlement.breakthroughs.map((id) => {
                  const disciple = disciples.find((d) => d.id === id);
                  if (!disciple) return null;
                  const prevRealm = REALM_NAMES[Math.max(0, disciple.realmIndex - 1)];
                  return (
                    <div key={id} className="flex items-center justify-between text-sm">
                      <span className="text-text-primary">{disciple.name}</span>
                      <span className="text-gold">
                        {prevRealm} → {disciple.realm}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentSettlement.casualties.length > 0 && (
            <div className="bg-red/20 p-4 rounded-lg border border-red">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-light" />
                <span className="font-display text-red-light">伤亡报告</span>
              </div>
              <div className="space-y-2">
                {currentSettlement.casualties.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">{c.discipleName}</span>
                    <span className="text-red-light">{c.cause}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSettlement.factionChanges.length > 0 && (
            <div className="bg-bg-dark p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-blue-light" />
                <span className="font-display text-gold-light">势力关系变化</span>
              </div>
              <div className="space-y-2">
                {currentSettlement.factionChanges.map((change, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-text-primary">{getFactionName(change.factionId)}</span>
                    <div className="flex items-center gap-2">
                      <span style={{ color: RELATION_COLORS[change.oldRelation] }}>
                        {change.oldRelation}
                      </span>
                      <span className="text-text-muted">→</span>
                      <span style={{ color: RELATION_COLORS[change.newRelation] }}>
                        {change.newRelation}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentSettlement.events.length > 0 && (
            <div className="bg-bg-dark p-4 rounded-lg border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Sword className="w-5 h-5 text-gold" />
                <span className="font-display text-gold-light">未处理事件</span>
                <span className="text-xs text-red-light ml-auto">
                  {currentSettlement.events.length} 件
                </span>
              </div>
              <p className="text-text-muted text-sm">
                请前往门派议事处理未解决的事件
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-bg-card border-t border-gold p-4">
          <button
            onClick={dismissSettlement}
            className="w-full btn-gold"
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}
