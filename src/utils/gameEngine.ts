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
  RelationshipChange,
  CultivationRecord,
  ExplorationRecord,
  QualityType,
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
  materialGains: Record<string, number>;
  itemGains: {
    name: string;
    type: "pill" | "artifact";
    quality: QualityType;
    quantity: number;
    description: string;
    effect: string;
  }[];
  casualties: { discipleId: string; cause: string; discipleName: string }[];
}

const MATERIAL_POOL: Record<number, string[]> = {
  0: ["灵草", "赤铁", "玄石", "青藤"],
  1: ["冰晶", "雷精", "火云石", "乙木精"],
  2: ["龙涎草", "万年冰魄", "天罡砂", "幽冥铁"],
};

const PILL_POOL: QualityType[] = ["下品", "中品", "上品", "极品"];

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

  const casualties: ExpeditionResult["casualties"] = [];
  const casualtyCount = success
    ? Math.floor(Math.random() * (Math.random() < 0.3 ? 1 : 0))
    : Math.floor(Math.random() * 2) + 1;

  for (let i = 0; i < casualtyCount; i++) {
    const idx = Math.floor(Math.random() * team.length);
    const d = team[idx];
    if (d && !casualties.find((c) => c.discipleId === d.id)) {
      casualties.push({
        discipleId: d.id,
        discipleName: d.name,
        cause: success ? "探索受伤" : "探索失败重伤",
      });
    }
  }

  const materialGains: Record<string, number> = {};
  const itemGains: ExpeditionResult["itemGains"] = [];

  if (success) {
    const matPool = MATERIAL_POOL[realm.difficulty] ?? MATERIAL_POOL[1];
    const matCount = 1 + Math.floor(Math.random() * 2) + realm.difficulty;
    for (let i = 0; i < matCount; i++) {
      const mat = matPool[Math.floor(Math.random() * matPool.length)];
      if (mat) materialGains[mat] = (materialGains[mat] || 0) + 1 + Math.floor(Math.random() * 3);
    }

    if (Math.random() < 0.3 + realm.difficulty * 0.1) {
      const pillNames = ["筑基丹", "聚灵丹", "疗伤丹", "凝神丹", "大还丹"];
      const qualityIdx = Math.min(3, Math.floor(Math.random() * (realm.difficulty + 1)));
      itemGains.push({
        name: pillNames[Math.min(pillNames.length - 1, realm.difficulty)] || "聚灵丹",
        type: "pill",
        quality: PILL_POOL[qualityIdx] || "中品",
        quantity: 1 + Math.floor(Math.random() * 2),
        description: `秘境探索获得的${PILL_POOL[qualityIdx] || "中品"}丹药`,
        effect: qualityIdx >= 2 ? "修为+100" : "修为+40",
      });
    }

    if (Math.random() < 0.2 + realm.difficulty * 0.08) {
      const artNames = ["青锋剑", "玄铁盾", "护身玉佩", "攻击符箓", "飞行法器"];
      const qualityIdx = Math.min(3, Math.floor(Math.random() * (realm.difficulty + 1)));
      itemGains.push({
        name: artNames[Math.min(artNames.length - 1, realm.difficulty)] || "青锋剑",
        type: "artifact",
        quality: PILL_POOL[qualityIdx] || "中品",
        quantity: 1,
        description: `秘境探索获得的${PILL_POOL[qualityIdx] || "中品"}法器`,
        effect: qualityIdx >= 2 ? "战力+200" : "战力+80",
      });
    }
  }

  return {
    success,
    spiritStones: baseReward,
    reputation: reputationGain,
    materialGains,
    itemGains,
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

const PERSONALITY_COMPATIBILITY: Record<PersonalityType, PersonalityType[]> = {
  刚正: ["谦逊", "多谋", "淡泊"],
  阴柔: ["执念", "淡泊", "多谋"],
  狂傲: ["执念", "刚正"],
  谦逊: ["刚正", "多谋", "淡泊", "阴柔"],
  多谋: ["刚正", "谦逊", "阴柔", "淡泊"],
  鲁莽: ["狂傲", "执念"],
  淡泊: ["刚正", "谦逊", "多谋", "阴柔"],
  执念: ["狂傲", "阴柔", "鲁莽"],
};

export function calculateRelationshipDelta(
  a: Disciple,
  b: Disciple,
  context: "cultivation" | "expedition" | "council" | "dispute"
): { delta: number; reason: string } {
  let base = 0;
  let reason = "";

  const compatible = PERSONALITY_COMPATIBILITY[a.personality]?.includes(b.personality);
  const compatibleReverse = PERSONALITY_COMPATIBILITY[b.personality]?.includes(a.personality);

  if (compatible || compatibleReverse) {
    base += 3;
    reason = `${a.name}与${b.name}性情相投`;
  } else if (
    (a.personality === "刚正" && b.personality === "阴柔") ||
    (a.personality === "狂傲" && b.personality === "谦逊") ||
    (a.personality === "鲁莽" && b.personality === "多谋") ||
    (a.personality === "淡泊" && b.personality === "执念")
  ) {
    base -= 3;
    reason = `${a.name}与${b.name}性格不合`;
  }

  switch (context) {
    case "cultivation":
      base += 2;
      reason = reason || `共同闭关论道`;
      break;
    case "expedition":
      base += 4;
      reason = reason || `秘境同生共死`;
      break;
    case "council":
      base += 1;
      reason = reason || `议事交流`;
      break;
    case "dispute":
      base -= 5;
      reason = reason || `因事起争执`;
      break;
  }

  if (a.spiritRoot === b.spiritRoot && a.spiritRoot !== "天灵根" && a.spiritRoot !== "变异灵根") {
    base += 2;
    reason += "，灵根相近";
  }

  return { delta: base, reason };
}

export function applyRelationshipChange(
  disciples: Disciple[],
  aId: string,
  bId: string,
  delta: number,
  reason: string
): { disciples: Disciple[]; change: RelationshipChange | null } {
  if (aId === bId) return { disciples, change: null };

  const a = disciples.find((d) => d.id === aId);
  const b = disciples.find((d) => d.id === bId);
  if (!a || !b) return { disciples, change: null };

  const updatedDisciples = disciples.map((d) => {
    if (d.id === aId) {
      const existing = d.relationships.find((r) => r.discipleId === bId);
      const newRel = existing
        ? { ...existing, value: Math.max(-100, Math.min(100, existing.value + delta)) }
        : { discipleId: bId, value: Math.max(-100, Math.min(100, delta)) };
      return {
        ...d,
        relationships: [
          ...d.relationships.filter((r) => r.discipleId !== bId),
          newRel,
        ],
      };
    }
    if (d.id === bId) {
      const existing = d.relationships.find((r) => r.discipleId === aId);
      const newRel = existing
        ? { ...existing, value: Math.max(-100, Math.min(100, existing.value + delta)) }
        : { discipleId: aId, value: Math.max(-100, Math.min(100, delta)) };
      return {
        ...d,
        relationships: [
          ...d.relationships.filter((r) => r.discipleId !== aId),
          newRel,
        ],
      };
    }
    return d;
  });

  return {
    disciples: updatedDisciples,
    change: {
      discipleAId: aId,
      discipleAName: a.name,
      discipleBId: bId,
      discipleBName: b.name,
      delta,
      reason,
    },
  };
}

export function generateMonthlyRelationshipChanges(
  state: GameState
): { disciples: Disciple[]; changes: RelationshipChange[] } {
  let disciples = [...state.disciples];
  const changes: RelationshipChange[] = [];

  state.cultivationSlots.forEach((slot) => {
    const neighbors = state.cultivationSlots
      .filter((s) => s.occupantId && s.id !== slot.id && slot.occupantId)
      .map((s) => s.occupantId!);
    if (slot.occupantId && neighbors.length > 0) {
      const neighbor = neighbors[Math.floor(Math.random() * neighbors.length)];
      if (neighbor && Math.random() < 0.4) {
        const { delta, reason } = calculateRelationshipDelta(
          disciples.find((d) => d.id === slot.occupantId)!,
          disciples.find((d) => d.id === neighbor)!,
          "cultivation"
        );
        const result = applyRelationshipChange(disciples, slot.occupantId, neighbor, delta, reason);
        disciples = result.disciples;
        if (result.change) changes.push(result.change);
      }
    }
  });

  state.expeditionRealms.forEach((realm) => {
    if (realm.status === "探索中" && realm.teamIds.length >= 2) {
      for (let i = 0; i < realm.teamIds.length; i++) {
        for (let j = i + 1; j < realm.teamIds.length; j++) {
          if (Math.random() < 0.6) {
            const { delta, reason } = calculateRelationshipDelta(
              disciples.find((d) => d.id === realm.teamIds[i])!,
              disciples.find((d) => d.id === realm.teamIds[j])!,
              "expedition"
            );
            const result = applyRelationshipChange(disciples, realm.teamIds[i], realm.teamIds[j], delta, reason);
            disciples = result.disciples;
            if (result.change) changes.push(result.change);
          }
        }
      }
    }
  });

  state.events
    .filter((e) => e.resolved && e.monthOccurred === state.sect.month - 1)
    .forEach((ev) => {
      if (ev.relatedDiscipleIds.length >= 2) {
        for (let i = 0; i < ev.relatedDiscipleIds.length; i++) {
          for (let j = i + 1; j < ev.relatedDiscipleIds.length; j++) {
            const ctx = ev.type === "dispute" ? "dispute" : "council";
            const { delta, reason } = calculateRelationshipDelta(
              disciples.find((d) => d.id === ev.relatedDiscipleIds[i])!,
              disciples.find((d) => d.id === ev.relatedDiscipleIds[j])!,
              ctx
            );
            const result = applyRelationshipChange(
              disciples,
              ev.relatedDiscipleIds[i],
              ev.relatedDiscipleIds[j],
              delta,
              reason
            );
            disciples = result.disciples;
            if (result.change) changes.push(result.change);
          }
        }
      }
    });

  return { disciples, changes };
}

export function applyRuleTendencyModifier(
  baseEffects: { spiritStones?: number; reputation?: number; ruleTendency?: number },
  ruleTendency: number
): { spiritStones?: number; reputation?: number; ruleTendency?: number } {
  const modified = { ...baseEffects };

  if (ruleTendency <= 20) {
    if (modified.reputation && modified.reputation > 0) modified.reputation = Math.ceil(modified.reputation * 1.3);
    if (modified.reputation && modified.reputation < 0) modified.reputation = Math.ceil(modified.reputation * 0.7);
  } else if (ruleTendency >= 80) {
    if (modified.spiritStones && modified.spiritStones > 0) modified.spiritStones = Math.ceil(modified.spiritStones * 1.2);
    if (modified.spiritStones && modified.spiritStones < 0) modified.spiritStones = Math.ceil(modified.spiritStones * 0.8);
  }

  return modified;
}

export function calculateRelationshipImpact(
  disciples: Disciple[]
): { improved: number; worsened: number; impact: number } {
  let improved = 0;
  let worsened = 0;
  let impact = 0;

  disciples.forEach((d) => {
    d.relationships.forEach((r) => {
      if (r.value >= 30) improved++;
      if (r.value <= -30) worsened++;
      impact += r.value;
    });
  });

  return { improved, worsened, impact: Math.floor(impact / 2) };
}

export function generateRuleImpactSummary(ruleTendency: number): { label: string; effect: string }[] {
  const summary: { label: string; effect: string }[] = [];

  if (ruleTendency <= 20) {
    summary.push({ label: "门规严苛", effect: "声望收益+30%，声望损失-30%；弟子修炼效率略降" });
  } else if (ruleTendency >= 80) {
    summary.push({ label: "门规宽松", effect: "灵石收益+20%，灵石损失-20%；弟子关系更易改善" });
  } else {
    summary.push({ label: "门规中和", effect: "无特殊加成，宗门平稳发展" });
  }

  return summary;
}

export function processMonthlySettlement(
  state: GameState
): MonthlyReport {
  const income = 200 + state.disciples.length * 50;
  const expense = state.disciples.length * 30 + state.disciples.filter((d) => d.status === "闭关").length * 50;
  const net = income - expense;

  const breakthroughs: CultivationRecord[] = [];

  state.disciples.forEach((d) => {
    if (d.status === "闭关" && d.cultivation >= d.maxCultivation && d.realmIndex < REALM_NAMES.length - 1) {
      const chance = calculateBreakthroughChance(d);
      const success = Math.random() < chance * 0.3;
      breakthroughs.push({
        discipleId: d.id,
        discipleName: d.name,
        attempted: true,
        success,
        fromRealm: d.realm,
        toRealm: success ? REALM_NAMES[d.realmIndex + 1] : undefined,
      });
    }
  });

  const activeEvents = state.events.filter((e) => !e.resolved && e.monthOccurred <= state.sect.month);

  const factionChanges: MonthlyReport["factionChanges"] = [];

  state.factions.forEach((f) => {
    const roll = Math.random();
    if (roll < 0.3) {
      const relations: FactionRelationType[] = ["盟友", "中立", "敌对"];
      const idx = relations.indexOf(f.relation);
      const dir = Math.random() < 0.5 ? -1 : 1;
      const newIdx = Math.max(0, Math.min(2, idx + dir));
      if (idx !== newIdx) {
        factionChanges.push({
          factionId: f.id,
          factionName: f.name,
          oldRelation: f.relation,
          newRelation: relations[newIdx] as FactionRelationType,
        });
      }
    }
  });

  const cultivationGains = state.disciples
    .filter((d) => d.status === "闭关")
    .reduce((sum, d) => sum + calculateCultivationSpeed(d), 0);

  const relImpact = calculateRelationshipImpact(state.disciples);
  const ruleImpact = generateRuleImpactSummary(state.sect.ruleTendency);

  return {
    month: state.sect.month,
    spiritStoneIncome: income,
    spiritStoneExpense: expense,
    spiritStoneNet: net,
    reputationChange: Math.floor(relImpact.impact / 10),
    casualties: [],
    breakthroughs,
    newDisciples: [],
    events: activeEvents,
    factionChanges,
    cultivationGains,
    explorationRecords: [],
    craftRecords: [],
    relationshipChanges: [],
    relationshipSummary: relImpact,
    ruleImpact,
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
