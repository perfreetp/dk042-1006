import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { SPIRIT_ROOT_COLORS, STATUS_COLORS, PERSONALITY_NAMES, REALM_NAMES } from '@/types/game';
import { getRecruitCost, calculateBreakthroughChance } from '@/utils/gameEngine';
import {
  Users,
  UserPlus,
  X,
  Heart,
  Sparkles,
  Swords,
  Shield,
  HeartPulse,
  Gem,
} from 'lucide-react';

export default function DisciplesPage() {
  const disciples = useGameStore((s) => s.disciples);
  const sect = useGameStore((s) => s.sect);
  const items = useGameStore((s) => s.items);
  const recruitDisciple = useGameStore((s) => s.recruitDisciple);
  const healDisciple = useGameStore((s) => s.healDisciple);
  const equipItem = useGameStore((s) => s.equipItem);
  const unequipItem = useGameStore((s) => s.unequipItem);

  const [selectedDisciple, setSelectedDisciple] = useState<string | null>(null);
  const [showRecruitConfirm, setShowRecruitConfirm] = useState(false);

  const recruitCost = getRecruitCost(disciples);
  const selected = disciples.find((d) => d.id === selectedDisciple);
  const equippedItems = selected
    ? items.filter((i) => i.equippedBy === selected.id)
    : [];
  const availableItems = items.filter((i) => !i.equippedBy && i.type !== 'material');

  const getBreakthroughText = (d: typeof disciples[0]) => {
    if (d.realmIndex >= REALM_NAMES.length - 1) return '已达最高';
    const chance = calculateBreakthroughChance(d);
    return `${(chance * 100).toFixed(0)}%`;
  };

  return (
    <div className="h-full flex gap-6 animate-fade-in-up">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-display font-bold text-gold-light">
              弟子名册
            </h1>
            <p className="text-text-muted mt-1">
              共 {disciples.length} 名弟子 · {disciples.filter((d) => d.status === '空闲').length} 人可用
            </p>
          </div>
          <button
            onClick={() => setShowRecruitConfirm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            招募弟子 ({recruitCost} 灵石)
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 lg:grid-cols-3 gap-4 pr-2">
          {disciples.map((disciple) => (
            <div
              key={disciple.id}
              onClick={() => setSelectedDisciple(disciple.id)}
              className={`bg-bg-card border rounded-lg p-4 cursor-pointer card-hover ${
                selectedDisciple === disciple.id ? 'border-gold' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0"
                  style={{
                    backgroundColor: SPIRIT_ROOT_COLORS[disciple.spiritRoot] + '30',
                    color: SPIRIT_ROOT_COLORS[disciple.spiritRoot],
                    border: `3px solid ${SPIRIT_ROOT_COLORS[disciple.spiritRoot]}`,
                  }}
                >
                  {disciple.name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg">{disciple.name}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: STATUS_COLORS[disciple.status] + '20',
                        color: STATUS_COLORS[disciple.status],
                      }}
                    >
                      {disciple.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        backgroundColor: SPIRIT_ROOT_COLORS[disciple.spiritRoot] + '20',
                        color: SPIRIT_ROOT_COLORS[disciple.spiritRoot],
                      }}
                    >
                      {disciple.spiritRoot}灵根
                    </span>
                    <span className="text-gold-light">{disciple.realm}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">性格</span>
                  <span>{PERSONALITY_NAMES[disciple.personality]}</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-text-muted">修为</span>
                    <span>
                      {Math.floor(disciple.cultivation)}/{disciple.maxCultivation}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill bg-gradient-to-r from-purple to-purple-light"
                      style={{ width: `${(disciple.cultivation / disciple.maxCultivation) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">突破概率</span>
                  <span className="text-gold-light">{getBreakthroughText(disciple)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <div className="w-96 bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col animate-slide-in-right">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display text-lg text-gold-light">弟子详情</h3>
            <button
              onClick={() => setSelectedDisciple(null)}
              className="p-1 hover:bg-bg-dark rounded"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div className="text-center">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-3xl mx-auto"
                style={{
                  backgroundColor: SPIRIT_ROOT_COLORS[selected.spiritRoot] + '30',
                  color: SPIRIT_ROOT_COLORS[selected.spiritRoot],
                  border: `4px solid ${SPIRIT_ROOT_COLORS[selected.spiritRoot]}`,
                }}
              >
                {selected.name.slice(0, 1)}
              </div>
              <h2 className="text-2xl font-bold mt-3">{selected.name}</h2>
              <p className="text-gold-light">{selected.realm}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-bg-dark rounded-lg">
                <Sparkles className="w-5 h-5" style={{ color: SPIRIT_ROOT_COLORS[selected.spiritRoot] }} />
                <div>
                  <p className="text-text-muted text-xs">灵根</p>
                  <p style={{ color: SPIRIT_ROOT_COLORS[selected.spiritRoot] }}>
                    {selected.spiritRoot}灵根
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-bg-dark rounded-lg">
                <Heart className="w-5 h-5 text-red-light" />
                <div>
                  <p className="text-text-muted text-xs">性格</p>
                  <p>{PERSONALITY_NAMES[selected.personality]}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-bg-dark rounded-lg">
                <Swords className="w-5 h-5 text-purple-light" />
                <div>
                  <p className="text-text-muted text-xs">状态</p>
                  <p style={{ color: STATUS_COLORS[selected.status] }}>
                    {selected.status}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-bg-dark rounded-lg">
                <Shield className="w-5 h-5 text-blue-light" />
                <div>
                  <p className="text-text-muted text-xs">寿命</p>
                  <p>{selected.lifespan} 年</p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-display text-gold-light mb-3">修炼进度</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">当前修为</span>
                  <span className="text-gold-light">
                    {Math.floor(selected.cultivation)} / {selected.maxCultivation}
                  </span>
                </div>
                <div className="progress-bar h-3">
                  <div
                    className="progress-fill animate-qi-flow"
                    style={{ width: `${(selected.cultivation / selected.maxCultivation) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">突破概率</span>
                  <span className="text-gold-light font-bold">{getBreakthroughText(selected)}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-display text-gold-light mb-3">已装备</h4>
              {equippedItems.length > 0 ? (
                <div className="space-y-2">
                  {equippedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-bg-dark rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-text-muted">{item.quality}</p>
                      </div>
                      <button
                        onClick={() => unequipItem(item.id)}
                        className="btn-secondary text-xs py-1 px-2"
                      >
                        卸下
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm">暂无装备</p>
              )}
            </div>

            {availableItems.length > 0 && (
              <div>
                <h4 className="font-display text-gold-light mb-3">可装备</h4>
                <div className="space-y-2">
                  {availableItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-bg-dark rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-text-muted">{item.quality}</p>
                      </div>
                      <button
                        onClick={() => equipItem(item.id, selected.id)}
                        className="btn-gold text-xs py-1 px-2"
                      >
                        装备
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border space-y-2">
            {selected.status === '受伤' && (
              <button
                onClick={() => healDisciple(selected.id)}
                className="w-full btn-gold flex items-center justify-center gap-2"
              >
                <HeartPulse className="w-4 h-4" />
                治疗 (100 灵石)
              </button>
            )}
            <div className="flex items-center justify-between text-sm p-3 bg-bg-dark rounded-lg">
              <span className="text-text-muted">分配灵石</span>
              <span className="text-gold-light flex items-center gap-1">
                <Gem className="w-4 h-4" />
                {selected.allocatedStones}
              </span>
            </div>
          </div>
        </div>
      )}

      {showRecruitConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-bg-card border-2 border-gold rounded-lg w-96 p-6 scroll-paper">
            <h3 className="text-xl font-display font-bold text-gold-light mb-4 text-center">
              招募新弟子
            </h3>
            <div className="text-center space-y-4">
              <p className="text-text-secondary">
                消耗 <span className="text-gold-light font-bold">{recruitCost}</span> 灵石
                招募一名新弟子
              </p>
              <p className="text-text-muted text-sm">
                弟子的灵根和性格将随机生成
              </p>
              <div className="p-4 bg-bg-dark rounded-lg">
                <p className="text-text-muted text-xs mb-2">灵根概率</p>
                <div className="grid grid-cols-5 gap-1 text-xs">
                  {(['金', '木', '水', '火', '土', '冰', '雷', '风', '天灵根', '变异灵根'] as const).map((root) => (
                    <div
                      key={root}
                      className="text-center px-1 py-2 rounded"
                      style={{ backgroundColor: SPIRIT_ROOT_COLORS[root] + '20' }}
                    >
                      <div style={{ color: SPIRIT_ROOT_COLORS[root] }}>{root}</div>
                      <div className="text-text-muted text-[10px]">
                        {root === '天灵根' ? '2%' : root === '变异灵根' ? '3%' : '~15%'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRecruitConfirm(false)}
                className="flex-1 btn-secondary"
              >
                取消
              </button>
              <button
                onClick={() => {
                  recruitDisciple();
                  setShowRecruitConfirm(false);
                }}
                disabled={sect.spiritStones < recruitCost}
                className="flex-1 btn-primary"
              >
                {sect.spiritStones >= recruitCost ? '确认招募' : '灵石不足'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
