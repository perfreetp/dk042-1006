import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { SPIRIT_ROOT_COLORS, REALM_NAMES } from '@/types/game';
import { calculateBreakthroughChance } from '@/utils/gameEngine';
import {
  Mountain,
  User,
  X,
  Gem,
  Zap,
  ArrowRight,
  Lock,
} from 'lucide-react';

export default function CultivationPage() {
  const disciples = useGameStore((s) => s.disciples);
  const sect = useGameStore((s) => s.sect);
  const cultivationSlots = useGameStore((s) => s.cultivationSlots);
  const assignCultivation = useGameStore((s) => s.assignCultivation);
  const removeFromCultivation = useGameStore((s) => s.removeFromCultivation);
  const allocateSpiritStones = useGameStore((s) => s.allocateSpiritStones);
  const attemptBreakthrough = useGameStore((s) => s.attemptBreakthrough);

  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [allocateAmount, setAllocateAmount] = useState<Record<string, number>>({});

  const availableDisciples = disciples.filter((d) => d.status === '空闲' || d.status === '受伤');
  const selectedSlotData = cultivationSlots.find((s) => s.id === selectedSlot);
  const occupant = selectedSlotData?.occupantId
    ? disciples.find((d) => d.id === selectedSlotData.occupantId)
    : null;

  const handleAssign = (discipleId: string) => {
    if (selectedSlot) {
      assignCultivation(discipleId, selectedSlot);
      setSelectedSlot(null);
    }
  };

  return (
    <div className="h-full flex gap-6 animate-fade-in-up">
      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-gold-light">
            洞府修炼
          </h1>
          <p className="text-text-muted mt-1">
            安排弟子进入洞府闭关修炼，提升修为
          </p>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {cultivationSlots.map((slot, idx) => {
            const occupant = slot.occupantId
              ? disciples.find((d) => d.id === slot.occupantId)
              : null;

            return (
              <div
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                className={`bg-bg-card border-2 rounded-xl p-6 cursor-pointer transition-all ${
                  selectedSlot === slot.id
                    ? 'border-gold shadow-lg shadow-gold/20'
                    : 'border-border hover:border-gold/50'
                }`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Mountain className="w-6 h-6 text-purple-light" />
                    <h3 className="font-display text-xl text-gold-light">{slot.name}</h3>
                  </div>
                  {!occupant && (
                    <div className="px-3 py-1 bg-green/20 text-green-light rounded-full text-sm">
                      空闲
                    </div>
                  )}
                  {occupant && occupant.status === '闭关' && (
                    <div className="px-3 py-1 bg-purple/20 text-purple-light rounded-full text-sm animate-pulse-glow">
                      修炼中
                    </div>
                  )}
                </div>

                {occupant ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl"
                        style={{
                          backgroundColor: SPIRIT_ROOT_COLORS[occupant.spiritRoot] + '30',
                          color: SPIRIT_ROOT_COLORS[occupant.spiritRoot],
                          border: `3px solid ${SPIRIT_ROOT_COLORS[occupant.spiritRoot]}`,
                        }}
                      >
                        {occupant.name.slice(0, 1)}
                      </div>
                      <div>
                        <p className="font-bold text-lg">{occupant.name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span style={{ color: SPIRIT_ROOT_COLORS[occupant.spiritRoot] }}>
                            {occupant.spiritRoot}灵根
                          </span>
                          <span className="text-gold">{occupant.realm}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-text-muted">修为进度</span>
                        <span className="text-gold-light">
                          {Math.floor(occupant.cultivation)} / {occupant.maxCultivation}
                        </span>
                      </div>
                      <div className="progress-bar h-4">
                        <div
                          className="progress-fill animate-qi-flow"
                          style={{ width: `${(occupant.cultivation / occupant.maxCultivation) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-bg-dark rounded-lg text-center">
                        <p className="text-text-muted text-xs mb-1">每月增长</p>
                        <p className="text-purple-light font-bold">+{20 + (occupant.allocatedStones / 100) * 3}</p>
                      </div>
                      <div className="p-3 bg-bg-dark rounded-lg text-center">
                        <p className="text-text-muted text-xs mb-1">突破概率</p>
                        <p className="text-gold-light font-bold">
                          {(calculateBreakthroughChance(occupant) * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Gem className="w-4 h-4 text-blue-light" />
                      <span className="text-text-muted text-sm">已分配灵石</span>
                      <span className="text-gold-light font-medium ml-auto">
                        {occupant.allocatedStones}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const amount = allocateAmount[occupant.id] || 100;
                          if (sect.spiritStones >= amount) {
                            allocateSpiritStones(occupant.id, amount);
                            setAllocateAmount({ ...allocateAmount, [occupant.id]: 0 });
                          }
                        }}
                        disabled={occupant.cultivation >= occupant.maxCultivation || occupant.status !== '闭关'}
                        className="flex-1 btn-secondary text-sm"
                      >
                        +{allocateAmount[occupant.id] || 100} 灵石
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          attemptBreakthrough(occupant.id);
                        }}
                        disabled={occupant.cultivation < occupant.maxCultivation}
                        className="flex-1 btn-primary text-sm flex items-center justify-center gap-1"
                      >
                        <Zap className="w-4 h-4" />
                        尝试突破
                      </button>
                    </div>

                    <div>
                      <input
                        type="range"
                        min="100"
                        max="1000"
                        step="100"
                        value={allocateAmount[occupant.id] || 100}
                        onChange={(e) => setAllocateAmount({
                          ...allocateAmount,
                          [occupant.id]: parseInt(e.target.value),
                        })}
                        className="w-full h-2 bg-bg-dark rounded-lg appearance-none cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex justify-between text-xs text-text-muted mt-1">
                        <span>100</span>
                        <span>{allocateAmount[occupant.id] || 100} 灵石</span>
                        <span>1000</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromCultivation(occupant.id);
                      }}
                      className="w-full btn-secondary text-sm text-red-light border-red/30 hover:bg-red/10"
                    >
                      结束闭关
                    </button>
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-text-muted border-2 border-dashed border-border rounded-lg">
                    <User className="w-12 h-12 mb-2 opacity-30" />
                    <p>点击选择弟子</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedSlot && !selectedSlotData?.occupantId && (
        <div className="w-80 bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col animate-slide-in-right">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display text-lg text-gold-light">选择弟子</h3>
            <button
              onClick={() => setSelectedSlot(null)}
              className="p-1 hover:bg-bg-dark rounded"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <p className="text-text-muted text-sm mb-4">
              {selectedSlotData?.name} · 选择一名空闲弟子进入闭关
            </p>

            {availableDisciples.length > 0 ? (
              <div className="space-y-2">
                {availableDisciples.map((disciple) => (
                  <div
                    key={disciple.id}
                    className="p-3 bg-bg-dark rounded-lg hover:bg-bg-card-hover transition-colors cursor-pointer"
                    onClick={() => handleAssign(disciple.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                        style={{
                          backgroundColor: SPIRIT_ROOT_COLORS[disciple.spiritRoot] + '30',
                          color: SPIRIT_ROOT_COLORS[disciple.spiritRoot],
                          border: `2px solid ${SPIRIT_ROOT_COLORS[disciple.spiritRoot]}`,
                        }}
                      >
                        {disciple.name.slice(0, 1)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{disciple.name}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span style={{ color: SPIRIT_ROOT_COLORS[disciple.spiritRoot] }}>
                            {disciple.spiritRoot}
                          </span>
                          <span className="text-gold">{disciple.realm}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-text-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-text-muted">
                <Lock className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>没有可用的弟子</p>
                <p className="text-sm mt-1">所有弟子都在忙碌中</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
