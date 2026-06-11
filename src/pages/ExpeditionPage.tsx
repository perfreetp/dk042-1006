import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { SPIRIT_ROOT_COLORS, REALM_NAMES } from '@/types/game';
import {
  Compass,
  Swords,
  Users,
  Trophy,
  AlertTriangle,
  CheckCircle,
  Play,
  X,
  Gem,
  Star,
} from 'lucide-react';

export default function ExpeditionPage() {
  const disciples = useGameStore((s) => s.disciples);
  const expeditionRealms = useGameStore((s) => s.expeditionRealms);
  const assignExpedition = useGameStore((s) => s.assignExpedition);
  const completeExpedition = useGameStore((s) => s.completeExpedition);

  const [selectedRealm, setSelectedRealm] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<string[]>([]);

  const realm = expeditionRealms.find((r) => r.id === selectedRealm);
  const availableDisciples = disciples.filter((d) => d.status === '空闲');
  const teamDisciples = disciples.filter((d) => selectedTeam.includes(d.id));

  const teamPower = teamDisciples.reduce((sum, d) => sum + (d.realmIndex + 1) * 100 + d.cultivation / 10, 0);
  const requiredPower = realm
    ? realm.recommendedRealmIndex * 200 + realm.difficulty * 100
    : 0;
  const successChance = teamPower > 0 && requiredPower > 0
    ? Math.max(20, Math.min(95, (teamPower / (teamPower + requiredPower)) * 100))
    : 0;

  const toggleTeamMember = (id: string) => {
    if (selectedTeam.includes(id)) {
      setSelectedTeam(selectedTeam.filter((t) => t !== id));
    } else if (selectedTeam.length < 3) {
      setSelectedTeam([...selectedTeam, id]);
    }
  };

  const handleStartExpedition = () => {
    if (realm && selectedTeam.length > 0) {
      assignExpedition(realm.id, selectedTeam);
      setSelectedRealm(null);
      setSelectedTeam([]);
    }
  };

  const getDifficultyStars = (difficulty: number) => {
    return '★'.repeat(difficulty) + '☆'.repeat(5 - difficulty);
  };

  return (
    <div className="h-full flex gap-6 animate-fade-in-up">
      <div className="flex-1">
        <div className="mb-6">
          <h1 className="text-3xl font-display font-bold text-gold-light">
            秘境探索
          </h1>
          <p className="text-text-muted mt-1">
            派遣弟子前往秘境探索，获取珍贵资源
          </p>
        </div>

        <div className="space-y-4">
          {expeditionRealms.map((realm, idx) => {
            const teamMembers = disciples.filter((d) => realm.teamIds.includes(d.id));

            return (
              <div
                key={realm.id}
                onClick={() => realm.status !== '探索中' && setSelectedRealm(realm.id)}
                className={`bg-bg-card border rounded-xl p-6 transition-all ${
                  selectedRealm === realm.id
                    ? 'border-gold shadow-lg shadow-gold/20'
                    : 'border-border hover:border-gold/50'
                } ${realm.status === '探索中' ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-xl text-gold-light">{realm.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-xs ${
                          realm.status === '已完成'
                            ? 'bg-green/20 text-green-light'
                            : realm.status === '探索中'
                            ? 'bg-blue/20 text-blue-light animate-pulse'
                            : 'bg-bg-dark text-text-muted'
                        }`}
                      >
                        {realm.status}
                      </span>
                    </div>
                    <p className="text-text-secondary text-sm mb-4">{realm.description}</p>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Swords className="w-4 h-4 text-gold" />
                        <span className="text-gold text-lg">{getDifficultyStars(realm.difficulty)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-purple-light" />
                        <span className="text-text-secondary">
                          推荐境界：{REALM_NAMES[realm.recommendedRealmIndex]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Trophy className="w-4 h-4 text-blue-light" />
                        <span className="text-text-secondary">
                          奖励：{realm.rewards.map((r) => r.name).join('、')}
                        </span>
                      </div>
                    </div>

                    {teamMembers.length > 0 && (
                      <div className="mt-4 flex items-center gap-2">
                        <span className="text-text-muted text-sm">队伍：</span>
                        {teamMembers.map((m) => (
                          <div
                            key={m.id}
                            className="flex items-center gap-1 px-2 py-1 bg-bg-dark rounded"
                          >
                            <div
                              className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                              style={{
                                backgroundColor: SPIRIT_ROOT_COLORS[m.spiritRoot] + '30',
                                color: SPIRIT_ROOT_COLORS[m.spiritRoot],
                              }}
                            >
                              {m.name.slice(0, 1)}
                            </div>
                            <span className="text-sm">{m.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    {realm.status === '探索中' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          completeExpedition(realm.id);
                        }}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        结算探索
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRealm(realm.id);
                        }}
                        className="btn-gold flex items-center gap-2"
                      >
                        <Swords className="w-4 h-4" />
                        派遣队伍
                      </button>
                    )}

                    {realm.status === '已完成' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="btn-secondary text-green-light border-green/30"
                        disabled
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        已完成
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedRealm && (
        <div className="w-96 bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col animate-slide-in-right">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-display text-lg text-gold-light">编组队伍</h3>
            <button
              onClick={() => {
                setSelectedRealm(null);
                setSelectedTeam([]);
              }}
              className="p-1 hover:bg-bg-dark rounded"
            >
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="p-4 bg-bg-dark rounded-lg">
              <h4 className="font-medium text-gold-light mb-2">{realm?.name}</h4>
              <p className="text-sm text-text-muted mb-3">{realm?.description}</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">难度</span>
                  <span className="text-gold">{getDifficultyStars(realm?.difficulty || 1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted">推荐境界</span>
                  <span>{REALM_NAMES[realm?.recommendedRealmIndex || 0]}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gold-light mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                已选队员 ({selectedTeam.length}/3)
              </h4>
              {selectedTeam.length > 0 ? (
                <div className="space-y-2">
                  {teamDisciples.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-3 bg-purple/10 border border-purple/30 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                          style={{
                            backgroundColor: SPIRIT_ROOT_COLORS[d.spiritRoot] + '30',
                            color: SPIRIT_ROOT_COLORS[d.spiritRoot],
                          }}
                        >
                          {d.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-text-muted">{d.realm}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleTeamMember(d.id)}
                        className="p-1 hover:bg-bg-dark rounded"
                      >
                        <X className="w-4 h-4 text-text-muted" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted text-sm">请从下方选择队员</p>
              )}
            </div>

            {selectedTeam.length > 0 && (
              <div className="p-4 bg-bg-dark rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted text-sm">队伍战力</span>
                  <span className="text-gold-light font-bold">{Math.floor(teamPower)}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-text-muted text-sm">推荐战力</span>
                  <span className="text-text-secondary">{requiredPower}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted text-sm">成功率</span>
                  <span
                    className={`font-bold ${
                      successChance >= 70
                        ? 'text-green-light'
                        : successChance >= 40
                        ? 'text-gold-light'
                        : 'text-red-light'
                    }`}
                  >
                    {successChance.toFixed(0)}%
                  </span>
                </div>
                <div className="progress-bar mt-3">
                  <div
                    className={`progress-fill ${
                      successChance >= 70
                        ? 'bg-green-light'
                        : successChance >= 40
                        ? 'bg-gold'
                        : 'bg-red-light'
                    }`}
                    style={{ width: `${successChance}%` }}
                  />
                </div>
                {successChance < 40 && (
                  <div className="flex items-center gap-2 mt-3 text-red-light text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>成功率较低，建议更换队员</span>
                  </div>
                )}
              </div>
            )}

            <div>
              <h4 className="font-medium text-gold-light mb-3">可用弟子</h4>
              {availableDisciples.length > 0 ? (
                <div className="space-y-2">
                  {availableDisciples.map((d) => {
                    const isSelected = selectedTeam.includes(d.id);
                    return (
                      <div
                        key={d.id}
                        onClick={() => toggleTeamMember(d.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-gold/20 border border-gold'
                            : 'bg-bg-dark hover:bg-bg-card-hover border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                            style={{
                              backgroundColor: SPIRIT_ROOT_COLORS[d.spiritRoot] + '30',
                              color: SPIRIT_ROOT_COLORS[d.spiritRoot],
                              border: `2px solid ${SPIRIT_ROOT_COLORS[d.spiritRoot]}`,
                            }}
                          >
                            {d.name.slice(0, 1)}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{d.name}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <span style={{ color: SPIRIT_ROOT_COLORS[d.spiritRoot] }}>
                                {d.spiritRoot}灵根
                              </span>
                              <span className="text-gold">{d.realm}</span>
                              <span className="text-text-muted">
                                战力: {Math.floor((d.realmIndex + 1) * 100 + d.cultivation / 10)}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-gold" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-text-muted text-sm text-center py-4">
                  没有可用的弟子
                </p>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between p-3 bg-bg-dark rounded-lg mb-3">
              <div className="flex items-center gap-2">
                <Gem className="w-4 h-4 text-blue-light" />
                <span className="text-text-muted text-sm">预计消耗</span>
              </div>
              <span className="text-gold-light">{selectedTeam.length * 50} 灵石</span>
            </div>
            <button
              onClick={handleStartExpedition}
              disabled={selectedTeam.length === 0}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Swords className="w-5 h-5" />
              出发探索
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
