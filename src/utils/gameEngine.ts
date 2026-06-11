import type {
  Disciple,
  SpiritRootType,
  PersonalityType,
  RealmType,
  MonthlyReport,
  GameState,
  SectEvent,
  ExpeditionRealm,
  Faction,
  FactionRelationType,
} from "@/types/game";
import {
  REALM_NAMES,
  REALM_CULTIVATION_REQUIREMENTS,
} from "@/types/game";

const SURNAMES = [
  "李", "王", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴",
  "徐", "孙", "朱", "马", "胡", "郭", "何", "高", "林", "罗",
  "郑", "梁", "谢", "宋", "唐", "许", "韩", "冯", "邓", "曹",
  "萧", "叶", "白", "秦", "江", "顾", "苏", "沈", "孟", "南宫",
  "欧阳", "上官", "司马", "诸葛", "慕容", "令狐", "轩辕", "百里",
];

const GIVEN_NAMES = [
  "青云", "紫霞", "玄霜", "赤焰", "玉清", "凌霄", "剑秋", "无痕",
  "明月", "清风", "傲雪", "寒霜", "惊鸿", "烟雨", "流云", "飞絮",
  "无忌", "不悔", "寻欢", "留香", "逍遥", "自在", "无尘", "清风",
  "子轩", "浩然", "明远", "思远", "天佑", "文轩", "擎宇", "致远",
  "灵儿", "婉儿", "嫣然", "若曦", "梦瑶", "思琪", "雅琴", "雪琪",
];

const SPIRIT_ROOTS: SpiritRootType[] = [
  "金", "木", "水", "火", "土", "金", "木", "水", "火", "土",
  "金", "木", "水", "火", "土", "冰", "雷", "风", "冰", "雷",
  "天灵根", "变异灵根",
];

const PERSONALITIES: PersonalityType[] = [
  "刚正", "阴柔", "狂傲", "谦逊", "多谋", "鲁莽", "淡泊", "执念",
];

export function generateDiscipleName(): string {
  const surname = SURNAMES[Math.floor(Math.random() * SURNAMES.length)];
  const givenName = GIVEN_NAMES[Math.floor(Math.random() * GIVEN_NAMES.length)];
  return surname + givenName;
}

export function generateDisciple(): Disciple {
  const spiritRootIndex = Math.floor(Math.random() * SPIRIT_ROOTS.length);
  const personality = PERSONALITIES[Math.floor(Math.random() * PERSONALITIES.length)];
  const realmIndex = 0;
  const maxCultivation = REALM_CULTIVATION_REQUIREMENTS[realmIndex];

  return {
    id: `d_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: generateDiscipleName(),
    spiritRoot: SPIRIT_ROOTS[spiritRootIndex],
    personality,
    realm: REALM_NAMES[realmIndex],
    realmIndex,
    cultivation: Math.floor(Math.random() * 50),
    maxCultivation,
    status: "空闲",
    assignedSlotId: null,
    allocatedStones: 0,
    lifespan: 200,
    relationships: [],
    equippedItems: [],
    avatar: Math.floor(Math.random() * 8),
  };
}

export function getRecruitCost(disciples: Disciple[]): number {
  return 100 + disciples.length * 80;
}

export function calculateBreakthroughChance(disciple: Disciple): number {
  let base = 40;

  if (disciple.spiritRoot === "天灵根") base += 30;
  else if (disciple.spiritRoot === "变异灵根") base += 20;
  else if (["金", "木", "水", "火", "土", "冰", "雷", "风"].includes(disciple.spiritRoot)) {
    base += 10;
  }

  base += Math.min((disciple.allocatedStones / 100) * 5, 25);
  base -= disciple.realmIndex * 3;

  return Math.max(5, Math.min(95, base)) / 100;
}

export function calculateCultivationSpeed(disciple: Disciple): number {
  let base = 20;

  if (disciple.spiritRoot === "天灵根") base += 15;
  else if (disciple.spiritRoot === "变异灵根") base += 10;
  else base += 5;

  base += disciple.allocatedStones / 100 * 3;

  if (disciple.status === "闭关") base *= 1.5;
  if (disciple.status === "受伤") base *= 0.3;

  return Math.floor(base);
}

export interface ExpeditionResult {
  success: boolean;
  spiritStones: number;
  reputation: number;
  items: {
    id: string;
    name: string;
    type: "pill" | "artifact" | "material";
    quality: "下品" | "中品" | "上品" | "极品";
    quantity: number;
    description: string;
    equippedBy: string | null;
    effect: string;
  }[];
  casualties: string[];
}

export function calculateExpeditionResult(
  realm: ExpeditionRealm,
  team: Disciple[]
): ExpeditionResult {
  const teamPower = team.reduce((sum, d) => sum + (d.realmIndex + 1) * 100 + d.cultivation / 10, 0);
  const requiredPower = realm.recommendedRealmIndex * 200 + realm.difficulty * 100;

  const successChance = Math.max(0.2, Math.min(0.95, teamPower / (teamPower + requiredPower)));
  const success = Math.random() < successChance;

  const baseReward = success ? 200 + realm.difficulty * 150 : 50;
  const reputationGain = success ? realm.difficulty * 5 : -realm.difficulty * 3;

  const casualties: string[] = [];
  if (!success || Math.random() < 0.3) {
    const casualtyCount = Math.floor(Math.random() * (success ? 1 : 2));
    for (let i = 0; i < casualtyCount; i++) {
      const idx = Math.floor(Math.random() * team.length);
      if (team[idx] && !casualties.includes(team[idx].id)) {
        casualties.push(team[idx].id);
      }
    }
  }

  const items: ExpeditionResult["items"] = [];
  if (success && realm.rewards.length > 0) {
    const reward = realm.rewards[Math.floor(Math.random() * realm.rewards.length)];
    if (reward) {
      items.push({
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: reward.name,
        type: reward.type,
        quality: "中品",
        quantity: reward.quantity,
        description: `秘境探索获得的${reward.name}`,
        equippedBy: null,
        effect: "",
      });
    }
  }

  return {
    success,
    spiritStones: baseReward,
    reputation: reputationGain,
    items,
    casualties,
  };
}

export function processCultivationGains(
  state: GameState
): Partial<GameState> {
  const updatedDisciples = state.disciples.map((d) => {
    if (d.status !== "闭关") return d;
    const gain = calculateCultivationSpeed(d);
    const newCultivation = Math.min(d.cultivation + gain, d.maxCultivation);
    return { ...d, cultivation: newCultivation };
  });

  return { disciples: updatedDisciples };
}

export function processMonthlySettlement(
  state: GameState
): MonthlyReport {
  const income = 200 + state.disciples.length * 50;
  const expense = state.disciples.length * 30 + state.disciples.filter((d) => d.status === "闭关").length * 50;

  const breakthroughs: string[] = [];
  const casualties: { discipleId: string; cause: string; discipleName: string }[] = [];

  state.disciples.forEach((d) => {
    if (d.status === "闭关" && d.cultivation >= d.maxCultivation && d.realmIndex < REALM_NAMES.length - 1) {
      const chance = calculateBreakthroughChance(d);
      if (Math.random() < chance * 0.3) {
        breakthroughs.push(d.id);
      }
    }
  });

  const activeEvents = state.events.filter((e) => !e.resolved);
  const factionChanges: MonthlyReport["factionChanges"] = [];

  state.factions.forEach((f) => {
    const roll = Math.random();
    if (roll < 0.2) {
      const relations: FactionRelationType[] = ["盟友", "中立", "敌对"];
      const idx = relations.indexOf(f.relation);
      const newIdx = Math.max(0, Math.min(2, idx + (Math.random() < 0.5 ? -1 : 1)));
      if (idx !== newIdx) {
        factionChanges.push({
          factionId: f.id,
          oldRelation: f.relation,
          newRelation: relations[newIdx] as FactionRelationType,
        });
      }
    }
  });

  const cultivationGains = state.disciples
    .filter((d) => d.status === "闭关")
    .reduce((sum, d) => sum + calculateCultivationSpeed(d), 0);

  return {
    month: state.sect.month,
    spiritStoneIncome: income,
    spiritStoneExpense: expense,
    reputationChange: Math.floor(Math.random() * 10) - 3,
    casualties,
    breakthroughs,
    newDisciples: [],
    events: activeEvents,
    factionChanges,
    cultivationGains,
  };
}

const EVENT_TEMPLATES = [
  {
    title: "天降灵雨",
    type: "opportunity" as const,
    severity: "low" as const,
    description: "天空降下罕见的灵雨，宗门内灵气大增，弟子们修炼速度提升。",
    options: [
      {
        text: "组织弟子集体修炼",
        effects: { reputation: 5, spiritStones: -50 },
      },
      {
        text: "收集灵雨酿制药酒",
        effects: { spiritStones: 100 },
      },
    ],
  },
  {
    title: "妖兽侵袭",
    type: "invasion" as const,
    severity: "medium" as const,
    description: "一群低阶妖兽从后山冲出，威胁到宗门安全。",
    options: [
      {
        text: "派遣弟子驱逐",
        effects: { reputation: 10, spiritStones: -30 },
      },
      {
        text: "设下陷阱诱杀",
        effects: { spiritStones: 80, reputation: -5 },
      },
      {
        text: "紧闭山门避让",
        effects: { reputation: -10 },
      },
    ],
  },
  {
    title: "散修来访",
    type: "dialogue" as const,
    severity: "low" as const,
    description: "一位游历的散修前来拜访，希望能在宗门暂住几日。",
    options: [
      {
        text: "热情款待，结交人脉",
        effects: { spiritStones: -50, reputation: 8 },
      },
      {
        text: "安排差事换取食宿",
        effects: { spiritStones: 30 },
      },
      {
        text: "婉言谢绝",
        effects: {},
      },
    ],
  },
  {
    title: "弟子争执",
    type: "dispute" as const,
    severity: "low" as const,
    description: "两名弟子因修炼资源分配问题发生争执，甚至差点动手。",
    options: [
      {
        text: "严厉处罚闹事者",
        effects: { ruleTendency: -5, reputation: 3 },
      },
      {
        text: "劝解调解，各退一步",
        effects: { ruleTendency: 3 },
      },
      {
        text: "公平重新分配资源",
        effects: { spiritStones: -40, reputation: 5 },
      },
    ],
  },
  {
    title: "灵脉异变",
    type: "disaster" as const,
    severity: "high" as const,
    description: "宗门灵脉突然出现不稳定波动，若不及时处理可能造成严重后果。",
    options: [
      {
        text: "投入大量灵石稳定灵脉",
        effects: { spiritStones: -200, reputation: 15 },
      },
      {
        text: "暂时疏散弟子避开",
        effects: { reputation: -10 },
      },
      {
        text: "冒险抽取异变能量",
        effects: { spiritStones: 150, reputation: -5 },
      },
    ],
  },
  {
    title: "仙缘降临",
    type: "treasure" as const,
    severity: "medium" as const,
    description: "有弟子在后山发现一处古修洞府遗迹，似乎藏有宝物。",
    options: [
      {
        text: "派队伍深入探索",
        effects: { spiritStones: 300, reputation: 10 },
      },
      {
        text: "谨慎封印，从长计议",
        effects: { reputation: 5 },
      },
    ],
  },
  {
    title: "外敌窥伺",
    type: "invasion" as const,
    severity: "high" as const,
    description: "探子来报，附近有邪修势力在宗门附近徘徊，意图不明。",
    options: [
      {
        text: "加强警戒，准备迎敌",
        effects: { spiritStones: -100, reputation: 10 },
      },
      {
        text: "主动出击，驱逐邪修",
        effects: { reputation: 20, spiritStones: -50 },
      },
      {
        text: "派人谈判交涉",
        effects: { spiritStones: -80 },
      },
    ],
  },
  {
    title: "宝物出世",
    type: "treasure" as const,
    severity: "medium" as const,
    description: "传闻附近山脉有异宝出世，光芒冲天。",
    options: [
      {
        text: "全力争夺",
        effects: { spiritStones: 500, reputation: -10 },
      },
      {
        text: "观望形势，伺机而动",
        effects: { spiritStones: 150 },
      },
      {
        text: "不参与争夺",
        effects: { reputation: 5 },
      },
    ],
  },
  {
    title: "弟子叛心",
    type: "betrayal" as const,
    severity: "critical" as const,
    description: "有弟子暗中与敌对势力勾结，意图盗取宗门功法。",
    options: [
      {
        text: "抓现行，严厉处置",
        effects: { reputation: 15, ruleTendency: -10 },
      },
      {
        text: "暗中观察，顺藤摸瓜",
        effects: { spiritStones: -100, reputation: 5 },
      },
      {
        text: "好言相劝，既往不咎",
        effects: { reputation: -15, ruleTendency: 10 },
      },
    ],
  },
];

export function generateRandomEvents(
  state: GameState
): SectEvent[] {
  const events: SectEvent[] = [];
  const eventCount = Math.floor(Math.random() * 2) + 1;

  const availableDisciples = state.disciples.filter((d) => d.status === "空闲");

  for (let i = 0; i < eventCount; i++) {
    const template = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
    if (!template) continue;

    const relatedDiscipleIds: string[] = [];
    if (availableDisciples.length > 0) {
      const count = Math.min(2, availableDisciples.length);
      for (let j = 0; j < count; j++) {
        const idx = Math.floor(Math.random() * availableDisciples.length);
        const disciple = availableDisciples[idx];
        if (disciple && !relatedDiscipleIds.includes(disciple.id)) {
          relatedDiscipleIds.push(disciple.id);
        }
      }
    }

    events.push({
      id: `ev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: template.title,
      description: template.description,
      type: template.type,
      severity: template.severity,
      relatedDiscipleIds,
      options: template.options,
      resolved: false,
      monthOccurred: state.sect.month,
    });
  }

  return events;
}
