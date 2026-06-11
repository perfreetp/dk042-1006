import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { SPIRIT_ROOT_COLORS, RELATION_COLORS } from '@/types/game';
import {
  MessageSquare,
  Users,
  AlertTriangle,
  Scale,
  ChevronRight,
  MessageCircle,
  Swords,
  CloudRain,
  Gift,
  UserX,
  Sparkles,
  X,
  Check,
} from 'lucide-react';

type TabType = 'events' | 'dialogues' | 'rules' | 'factions';

const eventIcons: Record<string, typeof MessageSquare> = {
  dialogue: MessageCircle,
  dispute: Swords,
  disaster: CloudRain,
  invasion: Swords,
  treasure: Gift,
  betrayal: UserX,
  opportunity: Sparkles,
};

const eventColors: Record<string, string> = {
  dialogue: 'text-blue-light',
  dispute: 'text-red-light',
  disaster: 'text-purple-light',
  invasion: 'text-red',
  treasure: 'text-gold-light',
  betrayal: 'text-red-light',
  opportunity: 'text-green-light',
};

export default function CouncilPage() {
  const events = useGameStore((s) => s.events);
  const disciples = useGameStore((s) => s.disciples);
  const factions = useGameStore((s) => s.factions);
  const sect = useGameStore((s) => s.sect);
  const resolveEvent = useGameStore((s) => s.resolveEvent);
  const adjustRuleTendency = useGameStore((s) => s.adjustRuleTendency);

  const [activeTab, setActiveTab] = useState<TabType>('events');
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const unresolvedEvents = events.filter((e) => !e.resolved);
  const resolvedEvents = events.filter((e) => e.resolved);
  const selected = events.find((e) => e.id === selectedEvent);

  const tabs: { id: TabType; label: string; icon: typeof MessageSquare; badge?: number }[] = [
    { id: 'events', label: '待处理事件', icon: AlertTriangle, badge: unresolvedEvents.length },
    { id: 'dialogues', label: '弟子互动', icon: MessageCircle },
    { id: 'rules', label: '门规调整', icon: Scale },
    { id: 'factions', label: '势力关系', icon: Users },
  ];

  const dialogueTemplates = [
    { pair: ['刚正', '狂傲'], type: '争执', content: '"哼，正道之人，行事怎可如此张扬？"' },
    { pair: ['谦逊', '谦逊'], type: '对话', content: '"师兄说得是，小弟受教了。"' },
    { pair: ['淡泊', '执念'], type: '对话', content: '"放下执念，方能得大道。"' },
    { pair: ['多谋', '鲁莽'], type: '争执', content: '"冲动行事，只会坏了大事！"' },
    { pair: ['阴柔', '刚正'], type: '对话', content: '"柔能克刚，刚亦能断柔。"' },
  ];

  const recentDialogues = disciples.length >= 2
    ? disciples.slice(0, 4).map((d1, i) => {
        const d2 = disciples[(i + 1) % disciples.length];
        const template = dialogueTemplates[i % dialogueTemplates.length];
        return { d1, d2, ...template };
      })
    : [];

  const handleResolve = (choiceIndex: number) => {
    if (selected) {
      resolveEvent(selected.id, choiceIndex);
      setSelectedEvent(null);
    }
  };

  return (
    <div className="h-full flex flex-col animate-fade-in-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-gold-light">
            门派议事
          </h1>
          <p className="text-text-muted mt-1">
            处理门派事务，调整门规，维护势力关系
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
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all relative ${
                activeTab === tab.id
                  ? 'bg-gold text-bg-dark font-medium'
                  : 'bg-bg-card border border-border text-text-secondary hover:border-gold/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red text-white text-xs rounded-full flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex-1 flex gap-6 overflow-hidden">
        {activeTab === 'events' && (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {unresolvedEvents.length > 0 ? (
                unresolvedEvents.map((event, idx) => {
                  const Icon = eventIcons[event.type] || AlertTriangle;
                  const ColorClass = eventColors[event.type] || 'text-text-primary';
                  const relatedDisciples = disciples.filter((d) =>
                    event.relatedDiscipleIds.includes(d.id)
                  );

                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event.id)}
                      className={`bg-bg-card border rounded-xl p-5 cursor-pointer transition-all ${
                        selectedEvent === event.id
                          ? 'border-gold shadow-lg shadow-gold/20'
                          : 'border-border hover:border-gold/50'
                      }`}
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-3 bg-bg-dark rounded-lg ${ColorClass}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-display text-lg text-gold-light">
                              {event.title}
                            </h3>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              event.severity === 'critical'
                                ? 'bg-red/30 text-red-light'
                                : event.severity === 'high'
                                ? 'bg-orange/30 text-orange-300'
                                : event.severity === 'medium'
                                ? 'bg-yellow/30 text-yellow-300'
                                : 'bg-green/30 text-green-light'
                            }`}>
                              {event.severity === 'critical'
                                ? '紧急'
                                : event.severity === 'high'
                                ? '重要'
                                : event.severity === 'medium'
                                ? '一般'
                                : '普通'}
                            </span>
                          </div>
                          <p className="text-text-secondary text-sm mb-3">
                            {event.description}
                          </p>
                          {relatedDisciples.length > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-text-muted text-xs">相关弟子：</span>
                              {relatedDisciples.map((d) => (
                                <div
                                  key={d.id}
                                  className="flex items-center gap-1 px-2 py-1 bg-bg-dark rounded"
                                >
                                  <div
                                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                                    style={{
                                      backgroundColor: SPIRIT_ROOT_COLORS[d.spiritRoot] + '30',
                                      color: SPIRIT_ROOT_COLORS[d.spiritRoot],
                                    }}
                                  >
                                    {d.name.slice(0, 1)}
                                  </div>
                                  <span className="text-xs">{d.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-text-muted" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-text-muted">
                  <Check className="w-16 h-16 mb-4 opacity-30 text-green-light" />
                  <p className="text-lg">暂无待处理事件</p>
                  <p className="text-sm mt-1">所有事件均已妥善处理</p>
                </div>
              )}

              {resolvedEvents.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-text-muted text-sm mb-3">已处理事件</h4>
                  <div className="space-y-2">
                    {resolvedEvents.slice(-5).map((event) => (
                      <div
                        key={event.id}
                        className="bg-bg-dark border border-border rounded-lg p-3 opacity-60"
                      >
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-light" />
                          <span className="font-medium">{event.title}</span>
                          <span className="text-text-muted text-xs ml-auto">
                            第{event.monthOccurred}月
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selected && (
              <div className="w-96 bg-bg-card border border-border rounded-lg overflow-hidden flex flex-col animate-slide-in-right">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <h3 className="font-display text-lg text-gold-light">事件详情</h3>
                  <button
                    onClick={() => setSelectedEvent(null)}
                    className="p-1 hover:bg-bg-dark rounded"
                  >
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  <div className="p-4 bg-bg-dark rounded-lg">
                    <h4 className="font-bold text-xl text-gold-light mb-2">
                      {selected.title}
                    </h4>
                    <p className="text-text-secondary">{selected.description}</p>
                  </div>

                  <div>
                    <h5 className="font-medium text-gold-light mb-3">请做出抉择：</h5>
                    <div className="space-y-3">
                      {selected.options.map((option, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleResolve(idx)}
                          className="w-full p-4 bg-bg-dark border border-border rounded-lg text-left hover:border-gold hover:bg-bg-card-hover transition-all group"
                        >
                          <p className="font-medium mb-2 group-hover:text-gold-light transition-colors">
                            {option.text}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {option.effects.spiritStones !== undefined && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                option.effects.spiritStones >= 0
                                  ? 'bg-green/20 text-green-light'
                                  : 'bg-red/20 text-red-light'
                              }`}>
                                灵石 {option.effects.spiritStones >= 0 ? '+' : ''}
                                {option.effects.spiritStones}
                              </span>
                            )}
                            {option.effects.reputation !== undefined && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                option.effects.reputation >= 0
                                  ? 'bg-gold/20 text-gold-light'
                                  : 'bg-red/20 text-red-light'
                              }`}>
                                声望 {option.effects.reputation >= 0 ? '+' : ''}
                                {option.effects.reputation}
                              </span>
                            )}
                            {option.effects.ruleTendency !== undefined && (
                              <span className="text-xs px-2 py-1 rounded bg-purple/20 text-purple-light">
                                门规 {option.effects.ruleTendency > 0 ? '更宽松' : '更严苛'}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'dialogues' && (
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-6">
              {recentDialogues.map((dialogue, idx) => (
                <div
                  key={idx}
                  className="bg-bg-card border border-border rounded-xl p-6"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                        style={{
                          backgroundColor: SPIRIT_ROOT_COLORS[dialogue.d1.spiritRoot] + '30',
                          color: SPIRIT_ROOT_COLORS[dialogue.d1.spiritRoot],
                          border: `2px solid ${SPIRIT_ROOT_COLORS[dialogue.d1.spiritRoot]}`,
                        }}
                      >
                        {dialogue.d1.name.slice(0, 1)}
                      </div>
                      <div>
                        <p className="font-medium">{dialogue.d1.name}</p>
                        <p className="text-xs text-text-muted">
                          {dialogue.d1.personality} · {dialogue.d1.realm}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        dialogue.type === '争执'
                          ? 'bg-red/20 text-red-light'
                          : 'bg-blue/20 text-blue-light'
                      }`}
                    >
                      {dialogue.type}
                    </span>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-medium">{dialogue.d2.name}</p>
                        <p className="text-xs text-text-muted">
                          {dialogue.d2.personality} · {dialogue.d2.realm}
                        </p>
                      </div>
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold"
                        style={{
                          backgroundColor: SPIRIT_ROOT_COLORS[dialogue.d2.spiritRoot] + '30',
                          color: SPIRIT_ROOT_COLORS[dialogue.d2.spiritRoot],
                          border: `2px solid ${SPIRIT_ROOT_COLORS[dialogue.d2.spiritRoot]}`,
                        }}
                      >
                        {dialogue.d2.name.slice(0, 1)}
                      </div>
                    </div>
                  </div>
                  <div className="dialogue-bubble">
                    <p className="text-text-secondary italic">"{dialogue.content}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="flex-1">
            <div className="max-w-2xl mx-auto">
              <div className="bg-bg-card border border-border rounded-xl p-8">
                <h3 className="text-xl font-display text-gold-light mb-6 text-center">
                  门规倾向调整
                </h3>

                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto bg-red/20 rounded-full flex items-center justify-center mb-2">
                        <Swords className="w-6 h-6 text-red-light" />
                      </div>
                      <p className="text-red-light font-medium">严苛</p>
                      <p className="text-text-muted text-xs">赏罚分明</p>
                    </div>
                    <div className="flex-1 mx-8">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={sect.ruleTendency}
                        onChange={(e) => adjustRuleTendency(parseInt(e.target.value))}
                        className="w-full h-3 bg-bg-dark rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto bg-green/20 rounded-full flex items-center justify-center mb-2">
                        <Scale className="w-6 h-6 text-green-light" />
                      </div>
                      <p className="text-green-light font-medium">宽松</p>
                      <p className="text-text-muted text-xs">无为而治</p>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-text-muted mb-2">当前倾向</p>
                    <p className="text-4xl font-bold text-gold-light">
                      {sect.ruleTendency}
                    </p>
                    <p className="text-text-muted mt-1">
                      {sect.ruleTendency < 25
                        ? '法度森严，弟子循规蹈矩但可能心生不满'
                        : sect.ruleTendency < 50
                        ? '偏于严苛，注重门风戒律'
                        : sect.ruleTendency < 75
                        ? '中庸之道，宽严相济'
                        : '无为而治，弟子自由但可能散漫'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-4 bg-bg-dark rounded-lg">
                    <p className="text-text-muted text-sm mb-1">弟子争执</p>
                    <p className="text-gold-light font-medium">
                      {sect.ruleTendency < 50 ? '从严处置' : '调解为主'}
                    </p>
                  </div>
                  <div className="p-4 bg-bg-dark rounded-lg">
                    <p className="text-text-muted text-sm mb-1">修炼氛围</p>
                    <p className="text-gold-light font-medium">
                      {sect.ruleTendency < 50 ? '紧张高效' : '轻松自在'}
                    </p>
                  </div>
                  <div className="p-4 bg-bg-dark rounded-lg">
                    <p className="text-text-muted text-sm mb-1">声望影响</p>
                    <p className="text-gold-light font-medium">
                      {sect.ruleTendency < 50 ? '敬畏' : '亲和'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'factions' && (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-3 gap-4">
              {factions.map((faction, idx) => (
                <div
                  key={faction.id}
                  className="bg-bg-card border border-border rounded-xl p-6 card-hover"
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-xl text-gold-light">
                      {faction.name}
                    </h3>
                    <span
                      className="px-3 py-1 rounded-full text-sm"
                      style={{
                        backgroundColor: RELATION_COLORS[faction.relation] + '20',
                        color: RELATION_COLORS[faction.relation],
                      }}
                    >
                      {faction.relation}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">势力实力</span>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 rounded ${
                              i < Math.ceil(faction.power / 20)
                                ? 'bg-gold'
                                : 'bg-bg-dark'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-muted">关系变动</span>
                      <span className="text-text-secondary">
                        {faction.lastChange > 0
                          ? `第${faction.lastChange}月`
                          : '暂无变动'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-text-muted">
                      <Users className="w-4 h-4" />
                      <span>
                        {faction.relation === '盟友'
                          ? '可请求支援'
                          : faction.relation === '中立'
                          ? '可进行贸易'
                          : '需小心防范'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
