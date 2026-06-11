import type {
  Disciple,
  SpiritRootType,
  PersonalityType,
  RealmType,
  MonthlyReport,
  GameState,
  SectEvent,
  EventTemplate,
  ExpeditionRealm,
  Faction,
  FactionRelationType,
  RelationshipChange,
  CultivationRecord,
  ExplorationRecord,
  QualityType,
  InventoryItem,
  BondType,
  BondEffect,
  ItemType,
  PillEffect,
  ArtifactBonus,
} from "@/types/game";
import {
  REALM_NAMES,
  REALM_CULTIVATION_REQUIREMENTS,
  QUALITY_PRICE_MULTIPLIER,
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
    bonds: [],
    equippedItems: [],
    avatar: Math.floor(Math.random() * 8),
  };
}

export function getRecruitCost(disciples: Disciple[]): number {
  return 100 + disciples.length * 80;
}

export function calculateBreakthroughChance(disciple: Disciple, items: InventoryItem[] = []): number {
  let base = 40;

  if (disciple.spiritRoot === "天灵根") base += 30;
  else if (disciple.spiritRoot === "变异灵根") base += 20;
  else if (["金", "木", "水", "火", "土", "冰", "雷", "风"].includes(disciple.spiritRoot)) {
    base += 10;
  }

  base += Math.min((disciple.allocatedStones / 100) * 5, 25);
  base -= disciple.realmIndex * 3;

  disciple.equippedItems.forEach((iid) => {
    const it = items.find((i) => i.id === iid);
    if (it?.pillEffect?.breakthroughBoost) base += it.pillEffect.breakthroughBoost;
  });

  return Math.max(5, Math.min(95, base)) / 100;
}

export function calculateCultivationSpeed(disciple: Disciple, items: InventoryItem[] = [], bondMultiplier = 1): number {
  let base = 20;

  if (disciple.spiritRoot === "天灵根") base += 15;
  else if (disciple.spiritRoot === "变异灵根") base += 10;
  else base += 5;

  base += disciple.allocatedStones / 100 * 3;

  disciple.equippedItems.forEach((iid) => {
    const it = items.find((i) => i.id === iid);
    if (it?.artifactBonus?.cultivationSpeed) base += it.artifactBonus.cultivationSpeed;
  });

  if (disciple.status === "闭关") base *= 1.5;
  if (disciple.status === "受伤") base *= 0.3;

  base *= bondMultiplier;

  return Math.floor(base);
}

export function calculateDiscipleCombatPower(disciple: Disciple, items: InventoryItem[] = []): number {
  let power = (disciple.realmIndex + 1) * 100 + disciple.cultivation / 10;

  disciple.equippedItems.forEach((iid) => {
    const it = items.find((i) => i.id === iid);
    if (it?.artifactBonus?.power) power += it.artifactBonus.power;
  });

  if (disciple.status === "受伤") power *= 0.5;
  return Math.floor(power);
}

export function getPillEffect(name: string, quality: QualityType): PillEffect {
  const mult = QUALITY_PRICE_MULTIPLIER[quality] || 1;
  if (name.includes("疗伤") || name.includes("大还")) return { heal: true };
  if (name.includes("突破")) return { breakthroughBoost: Math.floor(15 * mult) };
  return { cultivationGain: Math.floor(30 * mult) };
}

export function getArtifactBonus(name: string, quality: QualityType): ArtifactBonus {
  const mult = QUALITY_PRICE_MULTIPLIER[quality] || 1;
  if (name.includes("盾") || name.includes("玉佩") || name.includes("护")) {
    return { defense: Math.floor(50 * mult), power: Math.floor(30 * mult) };
  }
  if (name.includes("剑") || name.includes("刀") || name.includes("符箓") || name.includes("攻击")) {
    return { power: Math.floor(100 * mult) };
  }
  if (name.includes("修炼") || name.includes("辅助")) {
    return { cultivationSpeed: Math.floor(10 * mult), power: Math.floor(20 * mult) };
  }
  return { power: Math.floor(60 * mult) };
}

export function getItemMarketPrice(
  name: string,
  quality: QualityType,
  type: ItemType
): number {
  const base = type === "pill" ? 30 : 80;
  return Math.ceil(base * (QUALITY_PRICE_MULTIPLIER[quality] || 1));
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
    pillEffect?: PillEffect;
    artifactBonus?: ArtifactBonus;
    marketPrice: number;
  }[];
  casualties: { discipleId: string; cause: string; discipleName: string }[];
}

const MATERIAL_POOL: Record<number, { name: string; price: number }[]> = {
  0: [
    { name: "灵草", price: 20 },
    { name: "赤铁", price: 30 },
    { name: "玄石", price: 40 },
    { name: "青藤", price: 10 },
  ],
  1: [
    { name: "冰晶", price: 60 },
    { name: "雷精", price: 100 },
    { name: "火云石", price: 80 },
    { name: "乙木精", price: 120 },
  ],
  2: [
    { name: "龙涎草", price: 200 },
    { name: "万年冰魄", price: 300 },
    { name: "天罡砂", price: 250 },
    { name: "幽冥铁", price: 400 },
  ],
};

const PILL_POOL: QualityType[] = ["下品", "中品", "上品", "极品"];

export function calculateExpeditionResult(
  realm: ExpeditionRealm,
  team: Disciple[],
  items: InventoryItem[] = []
): ExpeditionResult {
  const teamPower = team.reduce((sum, d) => sum + calculateDiscipleCombatPower(d, items), 0);
  const requiredPower = realm.recommendedRealmIndex * 200 + realm.difficulty * 100;

  const successChance = Math.max(0.2, Math.min(0.95, teamPower / (teamPower + requiredPower)));
  const success = Math.random() < successChance;

  const baseReward = success ? 200 + realm.difficulty * 150 : 50;
  const reputationGain = success ? realm.difficulty * 5 : -realm.difficulty * 3;

  let casualtyProb = success ? 0.15 : 0.4;
  team.forEach((d) => {
    d.equippedItems.forEach((iid) => {
      const it = items.find((i) => i.id === iid);
      if (it?.artifactBonus?.defense) casualtyProb = Math.max(0, casualtyProb - 0.1);
    });
  });

  const casualties: ExpeditionResult["casualties"] = [];
  team.forEach((d) => {
    if (!casualties.find((c) => c.discipleId === d.id) && Math.random() < casualtyProb) {
      casualties.push({
        discipleId: d.id,
        discipleName: d.name,
        cause: success ? "探索受伤" : "探索失败重伤",
      });
    }
  });

  const materialGains: Record<string, number> = {};
  const itemGains: ExpeditionResult["itemGains"] = [];

  if (success) {
    const matPool = MATERIAL_POOL[realm.difficulty] ?? MATERIAL_POOL[1];
    const matCount = 1 + Math.floor(Math.random() * 2) + realm.difficulty;
    for (let i = 0; i < matCount; i++) {
      const mat = matPool[Math.floor(Math.random() * matPool.length)];
      if (mat) materialGains[mat.name] = (materialGains[mat.name] || 0) + 1 + Math.floor(Math.random() * 3);
    }

    if (Math.random() < 0.3 + realm.difficulty * 0.1) {
      const pillNames = ["筑基丹", "聚灵丹", "疗伤丹", "凝神丹", "大还丹"];
      const qualityIdx = Math.min(3, Math.floor(Math.random() * (realm.difficulty + 1)));
      const q = PILL_POOL[qualityIdx] || "中品";
      const nm = pillNames[Math.min(pillNames.length - 1, realm.difficulty)] || "聚灵丹";
      const eff = getPillEffect(nm, q);
      itemGains.push({
        name: nm,
        type: "pill",
        quality: q,
        quantity: 1 + Math.floor(Math.random() * 2),
        description: `秘境探索获得的${q}丹药`,
        effect: eff.cultivationGain ? `修为+${eff.cultivationGain}` : eff.heal ? "治愈伤势" : `突破率+${eff.breakthroughBoost || 0}%`,
        pillEffect: eff,
        marketPrice: getItemMarketPrice(nm, q, "pill"),
      });
    }

    if (Math.random() < 0.2 + realm.difficulty * 0.08) {
      const artNames = ["青锋剑", "玄铁盾", "护身玉佩", "攻击符箓", "飞行法器"];
      const qualityIdx = Math.min(3, Math.floor(Math.random() * (realm.difficulty + 1)));
      const q = PILL_POOL[qualityIdx] || "中品";
      const nm = artNames[Math.min(artNames.length - 1, realm.difficulty)] || "青锋剑";
      const bonus = getArtifactBonus(nm, q);
      itemGains.push({
        name: nm,
        type: "artifact",
        quality: q,
        quantity: 1,
        description: `秘境探索获得的${q}法器`,
        effect: bonus.power ? `战力+${bonus.power}` : "辅助法器",
        artifactBonus: bonus,
        marketPrice: getItemMarketPrice(nm, q, "artifact"),
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
    let mult = 1;
    d.bonds.forEach((b) => {
      if (b.type === "同修") mult += 0.15;
      if (b.type === "师徒") mult += 0.1;
      if (b.type === "仇敌") mult -= 0.1;
    });
    const gain = calculateCultivationSpeed(d, state.items, mult);
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

export function autoUpdateBonds(disciples: Disciple[], month: number): Disciple[] {
  return disciples.map((d) => {
    const newBonds = [...d.bonds];
    d.relationships.forEach((rel) => {
      const existing = newBonds.find((b) => b.withDiscipleId === rel.discipleId);
      if (rel.value >= 60 && !existing) {
        const other = disciples.find((x) => x.id === rel.discipleId);
        if (other) {
          const type: BondType =
            Math.abs(d.realmIndex - other.realmIndex) >= 2 ? "师徒" :
            rel.value >= 80 ? "同修" : "挚友";
          newBonds.push({ withDiscipleId: rel.discipleId, type, monthFormed: month });
        }
      }
      if (rel.value <= -50 && !existing) {
        newBonds.push({ withDiscipleId: rel.discipleId, type: "仇敌", monthFormed: month });
      }
      if (existing && existing.type === "仇敌" && rel.value > -20) {
        const idx = newBonds.findIndex((b) => b.withDiscipleId === rel.discipleId);
        if (idx >= 0) newBonds.splice(idx, 1);
      }
      if (existing && existing.type !== "仇敌" && existing.type !== "路人" && rel.value < 40) {
        const idx = newBonds.findIndex((b) => b.withDiscipleId === rel.discipleId);
        if (idx >= 0) newBonds.splice(idx, 1);
      }
    });
    return { ...d, bonds: newBonds };
  });
}

export function calculateBondEffects(
  disciples: Disciple[]
): { bondEffects: BondEffect[]; cultivationBoost: number; expeditionBoost: number; reputationImpact: number } {
  const bondEffects: BondEffect[] = [];
  let cultivationBoost = 0;
  let expeditionBoost = 0;
  let reputationImpact = 0;
  const processed = new Set<string>();

  disciples.forEach((a) => {
    a.bonds.forEach((b) => {
      const key = [a.id, b.withDiscipleId].sort().join("|");
      if (processed.has(key)) return;
      processed.add(key);
      const other = disciples.find((d) => d.id === b.withDiscipleId);
      if (!other) return;

      let effect = "";
      let cb = 0;
      let eb = 0;
      let ri = 0;
      switch (b.type) {
        case "同修":
          effect = "结伴同修，彼此修炼速度+15%，探索默契提升";
          cb = 15;
          eb = 10;
          ri = 2;
          break;
        case "师徒":
          effect = "师徒传承，徒弟修炼速度+10%，师父声望提升";
          cb = 10;
          eb = 5;
          ri = 3;
          break;
        case "挚友":
          effect = "挚友并肩，探索成功率提升";
          cb = 5;
          eb = 15;
          ri = 1;
          break;
        case "仇敌":
          effect = "仇敌对立，修炼效率-10%，容易起冲突";
          cb = -10;
          eb = -15;
          ri = -3;
          break;
        default:
          break;
      }
      if (effect) {
        cultivationBoost += cb;
        expeditionBoost += eb;
        reputationImpact += ri;
        bondEffects.push({
          discipleAName: a.name,
          discipleBName: other.name,
          type: b.type,
          effect,
          cultivationBoost: cb,
          expeditionBoost: eb,
          reputationImpact: ri,
        });
      }
    });
  });

  return { bondEffects, cultivationBoost, expeditionBoost, reputationImpact };
}

export function countRelationshipPairs(disciples: Disciple[]): { improvedPairs: number; worsenedPairs: number } {
  let improvedPairs = 0;
  let worsenedPairs = 0;
  const processed = new Set<string>();

  disciples.forEach((a) => {
    a.relationships.forEach((rel) => {
      const key = [a.id, rel.discipleId].sort().join("|");
      if (processed.has(key)) return;
      processed.add(key);
      if (rel.value >= 30) improvedPairs++;
      if (rel.value <= -30) worsenedPairs++;
    });
  });

  return { improvedPairs, worsenedPairs };
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
): { improvedPairs: number; worsenedPairs: number; impact: number } {
  const pairs = countRelationshipPairs(disciples);
  let impact = 0;
  const processed = new Set<string>();

  disciples.forEach((a) => {
    a.relationships.forEach((r) => {
      const key = [a.id, r.discipleId].sort().join("|");
      if (processed.has(key)) return;
      processed.add(key);
      impact += r.value;
    });
  });

  return { ...pairs, impact: Math.floor(impact / 2) };
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
  const { bondEffects, cultivationBoost, expeditionBoost, reputationImpact } = calculateBondEffects(state.disciples);

  const activeBonds: MonthlyReport["activeBonds"] = [];
  const processed = new Set<string>();
  state.disciples.forEach((a) => {
    a.bonds.forEach((b) => {
      const key = [a.id, b.withDiscipleId].sort().join("|");
      if (processed.has(key)) return;
      processed.add(key);
      const other = state.disciples.find((d) => d.id === b.withDiscipleId);
      if (other) activeBonds.push({ discipleAName: a.name, discipleBName: other.name, type: b.type });
    });
  });

  const income = Math.floor((200 + state.disciples.length * 50) * (state.sect.ruleTendency >= 80 ? 1.2 : 1));
  const expense = state.disciples.length * 30 + state.disciples.filter((d) => d.status === "闭关").length * 50;
  const net = income - expense;

  const breakthroughs: CultivationRecord[] = [];

  state.disciples.forEach((d) => {
    if (d.status === "闭关" && d.cultivation >= d.maxCultivation && d.realmIndex < REALM_NAMES.length - 1) {
      const chance = calculateBreakthroughChance(d, state.items);
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
    .reduce((sum, d) => sum + calculateCultivationSpeed(d, state.items), 0) + cultivationBoost;

  const relImpact = calculateRelationshipImpact(state.disciples);
  const ruleImpact = generateRuleImpactSummary(state.sect.ruleTendency);

  return {
    month: state.sect.month,
    spiritStoneIncome: income,
    spiritStoneExpense: expense,
    spiritStoneNet: net,
    reputationChange: Math.floor(relImpact.impact / 10) + reputationImpact,
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
    inventoryChanges: [],
    bondEffects,
    activeBonds,
  };
}

const DISPUTE_EVENT_TEMPLATES: EventTemplate[] = [
  {
    title: "洞府资源之争",
    type: "dispute" as const,
    severity: "low" as const,
    description: "两名弟子因抢占修炼洞府大打出手，一方灵田被踩踏，损失不小。",
    options: [
      { text: "严厉处罚闹事者", effects: { ruleTendency: -5, reputation: 3 } },
      { text: "公平重新分配洞府", effects: { spiritStones: -40, reputation: 5, ruleTendency: 2 } },
      { text: "勒令双方冷静思过", effects: { ruleTendency: -2, spiritStones: -20 } },
    ],
  },
  {
    title: "灵石分配不公",
    type: "dispute" as const,
    severity: "medium" as const,
    description: "有弟子投诉修炼灵石被克扣，与执事弟子激烈争执。",
    options: [
      { text: "彻查账目，秉公处理", effects: { spiritStones: -60, reputation: 8, ruleTendency: 3 } },
      { text: "各打五十大板", effects: { ruleTendency: -3, reputation: -2 } },
      { text: "追加灵石平息事端", effects: { spiritStones: -100, reputation: 5 } },
    ],
  },
  {
    title: "弟子私斗成伤",
    type: "dispute" as const,
    severity: "high" as const,
    description: "两名关系恶劣的弟子私下比武，一方重伤濒死，影响恶劣。",
    options: [
      { text: "重罚主犯，逐出山门", effects: { reputation: 12, ruleTendency: -8 } },
      { text: "责令赔偿，闭关思过", effects: { spiritStones: -150, ruleTendency: -4 } },
      { text: "调解为上，双方和解", effects: { reputation: -5, ruleTendency: 8 } },
    ],
  },
  {
    title: "道统理念之争",
    type: "dispute" as const,
    severity: "medium" as const,
    description: "修炼理念不同的两派弟子在议事堂激烈辩论，几乎升级为群殴。",
    options: [
      { text: "鼓励百家争鸣", effects: { reputation: 10, ruleTendency: 5 } },
      { text: "统一修炼典籍", effects: { ruleTendency: -6, reputation: 3 } },
      { text: "分设两堂分别修行", effects: { spiritStones: -80, reputation: 6 } },
    ],
  },
];

const COOP_EVENT_TEMPLATES: EventTemplate[] = [
  {
    title: "弟子结伴历练归来",
    type: "dialogue" as const,
    severity: "low" as const,
    description: "两名外出历练的弟子结伴归来，带回不少收获，彼此关系更进一步。",
    options: [
      { text: "当众嘉奖二人", effects: { reputation: 6, spiritStones: -30 } },
      { text: "记录历练心得入藏", effects: { reputation: 3, ruleTendency: 2 } },
    ],
  },
  {
    title: "师徒传道佳话",
    type: "dialogue" as const,
    severity: "medium" as const,
    description: "宗门内一对师徒修炼刻苦，徒弟进步神速，成为弟子们的榜样。",
    options: [
      { text: "赏赐师徒二人", effects: { spiritStones: -80, reputation: 10 } },
      { text: "请师徒公开讲道", effects: { reputation: 12, ruleTendency: 3 } },
    ],
  },
];

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    title: "天降灵雨",
    type: "opportunity" as const,
    severity: "low" as const,
    description: "天空降下罕见的灵雨，宗门内灵气大增，弟子们修炼速度提升。",
    options: [
      { text: "组织弟子集体修炼", effects: { reputation: 5, spiritStones: -50 } },
      { text: "收集灵雨酿制药酒", effects: { spiritStones: 100 } },
    ],
  },
  {
    title: "妖兽侵袭",
    type: "invasion" as const,
    severity: "medium" as const,
    description: "一群低阶妖兽从后山冲出，威胁到宗门安全。",
    options: [
      { text: "派遣弟子驱逐", effects: { reputation: 10, spiritStones: -30 } },
      { text: "设下陷阱诱杀", effects: { spiritStones: 80, reputation: -5 } },
      { text: "紧闭山门避让", effects: { reputation: -10 } },
    ],
  },
  {
    title: "散修来访",
    type: "dialogue" as const,
    severity: "low" as const,
    description: "一位游历的散修前来拜访，希望能在宗门暂住几日。",
    options: [
      { text: "热情款待，结交人脉", effects: { spiritStones: -50, reputation: 8 } },
      { text: "安排差事换取食宿", effects: { spiritStones: 30 } },
      { text: "婉言谢绝", effects: {} },
    ],
  },
  {
    title: "弟子争执",
    type: "dispute" as const,
    severity: "low" as const,
    description: "两名弟子因修炼资源分配问题发生争执，甚至差点动手。",
    options: [
      { text: "严厉处罚闹事者", effects: { ruleTendency: -5, reputation: 3 } },
      { text: "劝解调解，各退一步", effects: { ruleTendency: 3 } },
      { text: "公平重新分配资源", effects: { spiritStones: -40, reputation: 5 } },
    ],
  },
  {
    title: "灵脉异变",
    type: "disaster" as const,
    severity: "high" as const,
    description: "宗门灵脉突然出现不稳定波动，若不及时处理可能造成严重后果。",
    options: [
      { text: "投入大量灵石稳定灵脉", effects: { spiritStones: -200, reputation: 15 } },
      { text: "暂时疏散弟子避开", effects: { reputation: -10 } },
      { text: "冒险抽取异变能量", effects: { spiritStones: 150, reputation: -5 } },
    ],
  },
  {
    title: "仙缘降临",
    type: "treasure" as const,
    severity: "medium" as const,
    description: "有弟子在后山发现一处古修洞府遗迹，似乎藏有宝物。",
    options: [
      { text: "派队伍深入探索", effects: { spiritStones: 300, reputation: 10 } },
      { text: "谨慎封印，从长计议", effects: { reputation: 5 } },
    ],
  },
  {
    title: "外敌窥伺",
    type: "invasion" as const,
    severity: "high" as const,
    description: "探子来报，附近有邪修势力在宗门附近徘徊，意图不明。",
    options: [
      { text: "加强警戒，准备迎敌", effects: { spiritStones: -100, reputation: 10 } },
      { text: "主动出击，驱逐邪修", effects: { reputation: 20, spiritStones: -50 } },
      { text: "派人谈判交涉", effects: { spiritStones: -80 } },
    ],
  },
  {
    title: "宝物出世",
    type: "treasure" as const,
    severity: "medium" as const,
    description: "传闻附近山脉有异宝出世，光芒冲天。",
    options: [
      { text: "全力争夺", effects: { spiritStones: 500, reputation: -10 } },
      { text: "观望形势，伺机而动", effects: { spiritStones: 150 } },
      { text: "不参与争夺", effects: { reputation: 5 } },
    ],
  },
  {
    title: "弟子叛心",
    type: "betrayal" as const,
    severity: "critical" as const,
    description: "有弟子暗中与敌对势力勾结，意图盗取宗门功法。",
    options: [
      { text: "抓现行，严厉处置", effects: { reputation: 15, ruleTendency: -10 } },
      { text: "暗中观察，顺藤摸瓜", effects: { spiritStones: -100, reputation: 5 } },
      { text: "好言相劝，既往不咎", effects: { reputation: -15, ruleTendency: 10 } },
    ],
  },
];

export function generateRandomEvents(
  state: GameState
): SectEvent[] {
  const events: SectEvent[] = [];
  let eventCount = Math.floor(Math.random() * 2) + 1;

  const availableDisciples = state.disciples.filter((d) => d.status === "空闲");

  const enemies = state.disciples.filter((d) => d.bonds.some((b) => b.type === "仇敌")).length;
  if (enemies >= 2 && Math.random() < 0.4) eventCount++;

  for (let i = 0; i < eventCount; i++) {
    let template: EventTemplate = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
    const hasEnemies = state.disciples.some((a) => a.bonds.some((b) => b.type === "仇敌"));
    if (hasEnemies && Math.random() < 0.35) {
      template = DISPUTE_EVENT_TEMPLATES[Math.floor(Math.random() * DISPUTE_EVENT_TEMPLATES.length)];
    } else if (state.disciples.some((a) => a.bonds.some((b) => b.type === "同修" || b.type === "师徒" || b.type === "挚友")) && Math.random() < 0.2) {
      template = COOP_EVENT_TEMPLATES[Math.floor(Math.random() * COOP_EVENT_TEMPLATES.length)];
    }
    if (!template) continue;

    const relatedDiscipleIds: string[] = [];

    if (template.type === "dispute") {
      const disc = state.disciples.filter((d) => d.bonds.some((b) => b.type === "仇敌"));
      if (disc.length >= 2) {
        const pool: string[] = [];
        disc.forEach((d) => {
          d.bonds.forEach((b) => {
            if (b.type === "仇敌") {
              const key = [d.id, b.withDiscipleId].sort().join("|");
              if (!pool.includes(key)) {
                pool.push(d.id, b.withDiscipleId);
              }
            }
          });
        });
        if (pool.length >= 2) {
          relatedDiscipleIds.push(pool[0], pool[1]);
        }
      }
    }

    if (relatedDiscipleIds.length < 2 && availableDisciples.length > 0) {
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
