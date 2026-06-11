import { useGameStore } from '@/store/gameStore';
import { SPIRIT_ROOT_COLORS, STATUS_COLORS, REALM_NAMES } from '@/types/game';
import {
  Users,
  Gem,
  Star,
  TrendingUp,
  Calendar,
  ChevronRight,
  Mountain,
  Compass,
  Flame,
  MessageSquare,
  ScrollText,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OverviewPage() {
  const navigate = useNavigate();
  const sect = useGameStore((s) => s.sect);
  const disciples = useGameStore((s) => s.disciples);
  const events = useGameStore((s) => s.events);
  const reports = useGameStore((s) => s.reports);
  const logs = useGameStore((s) => s.logs);
  const advanceMonth = useGameStore((s) => s.advanceMonth);
  const openHistoricalReport = useGameStore((s) => s.openHistoricalReport);

  const unresolvedEvents = events.filter((e) => !e.resolved);
  const cultivatingCount = disciples.filter((d) => d.status === '闭关').length;
  const injuredCount = disciples.filter((d) => d.status === '受伤').length;
  const exploringCount = disciples.filter((d) => d.status === '探索').length;

  const recentReports = reports.slice(-5);

  const quickActions = [
    { label: '弟子名册', icon: Users, path: '/disciples', desc: `共 ${disciples.length} 名弟子` },
    { label: '洞府修炼', icon: Mountain, path: '/cultivation', desc: `${cultivatingCount} 人闭关中` },
    { label: '秘境探索', icon: Compass, path: '/expedition', desc: `${exploringCount} 人探索中` },
    { label: '炼丹炼器', icon: Flame, path: '/alchemy', desc: '炼制丹药与法器' },
    { label: '门派议事', icon: MessageSquare, path: '/council', desc: `${unresolvedEvents.length} 件待处理` },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-gold-light">
            宗门总览
          </h1>
          <p className="text-text-muted mt-1">
            {sect.name} · 第 {sect.month} 月运营概况
          </p>
        </div>
        <button
          onClick={advanceMonth}
          className="btn-primary flex items-center gap-2 px-6 py-3 text-lg"
        >
          <Calendar className="w-5 h-5" />
          进入下月
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-bg-card border border-border rounded-lg p-5 card-hover">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue/30 rounded-lg">
              <Gem className="w-6 h-6 text-blue-light" />
            </div>
            <div>
              <p className="text-text-muted text-sm">灵石库存</p>
              <p className="text-2xl font-bold text-gold-light">
                {sect.spiritStones.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-5 card-hover">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gold/20 rounded-lg">
              <Star className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-text-muted text-sm">宗门声望</p>
              <p className="text-2xl font-bold text-gold-light">{sect.reputation}</p>
            </div>
          </div>
          <div className="mt-3 progress-bar">
            <div
              className="progress-fill bg-gradient-to-r from-gold-dark to-gold-light"
              style={{ width: `${sect.reputation}%` }}
            />
          </div>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-5 card-hover">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple/30 rounded-lg">
              <Users className="w-6 h-6 text-purple-light" />
            </div>
            <div>
              <p className="text-text-muted text-sm">弟子总数</p>
              <p className="text-2xl font-bold text-gold-light">{disciples.length}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            <span className="text-green-light">
              {disciples.filter((d) => d.status === '空闲').length} 空闲
            </span>
            <span className="text-purple-light">
              {cultivatingCount} 闭关
            </span>
            <span className="text-red-light">
              {injuredCount} 受伤
            </span>
          </div>
        </div>
        <div className="bg-bg-card border border-border rounded-lg p-5 card-hover">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-red-light" />
            </div>
            <div>
              <p className="text-text-muted text-sm">本月收支</p>
              <p className="text-2xl font-bold text-green-light">
                {reports.length > 0
                  ? (reports[reports.length - 1].spiritStoneIncome -
                      reports[reports.length - 1].spiritStoneExpense) >= 0
                    ? '+'
                    : ''
                  : '+0'}
                {reports.length > 0
                  ? reports[reports.length - 1].spiritStoneIncome -
                    reports[reports.length - 1].spiritStoneExpense
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.path}
              onClick={() => navigate(action.path)}
              className="bg-bg-card border border-border rounded-lg p-4 text-left card-hover group"
            >
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-6 h-6 text-gold" />
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-gold-light transition-colors" />
              </div>
              <p className="font-display text-gold-light">{action.label}</p>
              <p className="text-text-muted text-sm mt-1">{action.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-display text-lg text-gold-light flex items-center gap-2">
              <Users className="w-5 h-5" />
              弟子状态
            </h2>
            <button
              onClick={() => navigate('/disciples')}
              className="text-text-muted text-sm hover:text-gold-light transition-colors"
            >
              查看全部
            </button>
          </div>
          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            {disciples.slice(0, 6).map((disciple, idx) => (
              <div
                key={disciple.id}
                className="flex items-center gap-3 p-3 bg-bg-dark rounded-lg"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{
                    backgroundColor: SPIRIT_ROOT_COLORS[disciple.spiritRoot] + '30',
                    color: SPIRIT_ROOT_COLORS[disciple.spiritRoot],
                    border: `2px solid ${SPIRIT_ROOT_COLORS[disciple.spiritRoot]}`,
                  }}
                >
                  {disciple.name.slice(0, 1)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{disciple.name}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: STATUS_COLORS[disciple.status] + '20',
                        color: STATUS_COLORS[disciple.status],
                      }}
                    >
                      {disciple.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <span>{disciple.realm}</span>
                    <span>·</span>
                    <span style={{ color: SPIRIT_ROOT_COLORS[disciple.spiritRoot] }}>
                      {disciple.spiritRoot}灵根
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-text-muted">修为</div>
                  <div className="font-medium text-gold-light">
                    {Math.floor(disciple.cultivation)}/{disciple.maxCultivation}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-gold" />
            <h2 className="font-display text-lg text-gold-light">宗门日志</h2>
          </div>
          <div className="p-4 space-y-2 max-h-[300px] overflow-y-auto">
            {logs.slice(-20).reverse().map((log, idx) => (
              <div
                key={idx}
                className="text-sm text-text-secondary border-l-2 border-border pl-3 py-1"
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {unresolvedEvents.length > 0 && (
        <div className="bg-red/10 border border-red rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-display text-red-light flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                有 {unresolvedEvents.length} 件事件待处理
              </h3>
              <p className="text-text-muted text-sm mt-1">
                {unresolvedEvents.map((e) => e.title).join('、')}
              </p>
            </div>
            <button
              onClick={() => navigate('/council')}
              className="btn-primary"
            >
              前往处理
            </button>
          </div>
        </div>
      )}

      {recentReports.length > 0 && (
        <div className="bg-bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-gold" />
              <h2 className="font-display text-lg text-gold-light">近期战报</h2>
            </div>
            <span className="text-xs text-text-muted">点击柱形查看详情</span>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-4 h-32">
              {recentReports.map((report, idx) => {
                const net = report.spiritStoneIncome - report.spiritStoneExpense;
                const maxVal = Math.max(...recentReports.map((r) => Math.abs(r.spiritStoneIncome - r.spiritStoneExpense)), 1);
                const height = `${(Math.abs(net) / maxVal) * 100}%`;
                return (
                  <button
                    key={idx}
                    onClick={() => openHistoricalReport(report.month)}
                    className="flex-1 flex flex-col items-center gap-2 group cursor-pointer"
                  >
                    <div className="text-xs text-text-muted group-hover:text-gold-light transition-colors">第{report.month}月</div>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t transition-all group-hover:shadow-lg group-hover:brightness-110 ${
                          net >= 0 ? 'bg-gradient-to-t from-green/30 to-green/60' : 'bg-gradient-to-t from-red/30 to-red/60'
                        }`}
                        style={{ height }}
                      />
                    </div>
                    <div className={`text-xs font-medium ${net >= 0 ? 'text-green-light' : 'text-red-light'}`}>
                      {net >= 0 ? '+' : ''}{net}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
