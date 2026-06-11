export type SpiritRootType =
  | "金"
  | "木"
  | "水"
  | "火"
  | "土"
  | "冰"
  | "雷"
  | "风"
  | "天灵根"
  | "变异灵根";

export type PersonalityType =
  | "刚正"
  | "阴柔"
  | "狂傲"
  | "谦逊"
  | "多谋"
  | "鲁莽"
  | "淡泊"
  | "执念";

export type RealmType =
  | "练气"
  | "筑基"
  | "金丹"
  | "元婴"
  | "化神"
  | "合体"
  | "大乘"
  | "渡劫";

export type DiscipleStatus =
  | "空闲"
  | "闭关"
  | "历练"
  | "探索"
  | "受伤"
  | "突破";

export type EventSeverity = "low" | "medium" | "high" | "critical";

export type FactionRelationType = "盟友" | "中立" | "敌对";

export type ItemType = "pill" | "artifact" | "material";

export type QualityType = "下品" | "中品" | "上品" | "极品";

export type MaterialRarity = "common" | "uncommon" | "rare" | "legendary";

export interface DiscipleRelationship {
  discipleId: string;
  value: number;
}

export interface Disciple {
  id: string;
  name: string;
  spiritRoot: SpiritRootType;
  personality: PersonalityType;
  realm: RealmType;
  realmIndex: number;
  cultivation: number;
  maxCultivation: number;
  status: DiscipleStatus;
  assignedSlotId: string | null;
  allocatedStones: number;
  lifespan: number;
  relationships: DiscipleRelationship[];
  equippedItems: string[];
  avatar: number;
}

export interface Sect {
  name: string;
  spiritStones: number;
  reputation: number;
  month: number;
  ruleTendency: number;
}

export interface CultivationSlot {
  id: string;
  name: string;
  occupantId: string | null;
}

export interface SecretRealmReward {
  type: ItemType;
  name: string;
  quantity: number;
}

export interface ExpeditionRealm {
  id: string;
  name: string;
  difficulty: number;
  recommendedRealmIndex: number;
  description: string;
  status: "未探索" | "探索中" | "已完成";
  teamIds: string[];
  rewards: SecretRealmReward[];
}

export interface Recipe {
  id: string;
  name: string;
  type: "pill" | "artifact";
  materials: Record<string, number>;
  successRate: number;
  resultQuality: QualityType;
  description: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  quality: QualityType;
  quantity: number;
  description: string;
  equippedBy: string | null;
  effect: string;
}

export interface MaterialInventory {
  [key: string]: number;
}

export interface EventOption {
  text: string;
  effects: {
    spiritStones?: number;
    reputation?: number;
    ruleTendency?: number;
  };
}

export interface SectEvent {
  id: string;
  title: string;
  description: string;
  type: "dialogue" | "dispute" | "disaster" | "invasion" | "treasure" | "betrayal" | "opportunity";
  severity: EventSeverity;
  relatedDiscipleIds: string[];
  options: EventOption[];
  resolved: boolean;
  monthOccurred: number;
}

export interface Faction {
  id: string;
  name: string;
  relation: FactionRelationType;
  power: number;
  lastChange: number;
}

export interface Casualty {
  discipleId: string;
  cause: string;
  discipleName: string;
}

export interface MonthlyReport {
  month: number;
  spiritStoneIncome: number;
  spiritStoneExpense: number;
  reputationChange: number;
  casualties: Casualty[];
  breakthroughs: string[];
  newDisciples: string[];
  events: SectEvent[];
  factionChanges: { factionId: string; oldRelation: FactionRelationType; newRelation: FactionRelationType }[];
  cultivationGains: number;
}

export interface GameState {
  sect: Sect;
  disciples: Disciple[];
  cultivationSlots: CultivationSlot[];
  expeditionRealms: ExpeditionRealm[];
  recipes: Recipe[];
  items: InventoryItem[];
  materials: MaterialInventory;
  events: SectEvent[];
  factions: Faction[];
  reports: MonthlyReport[];
  logs: string[];
}

export const REALM_NAMES: RealmType[] = [
  "练气",
  "筑基",
  "金丹",
  "元婴",
  "化神",
  "合体",
  "大乘",
  "渡劫",
];

export const SPIRIT_ROOT_COLORS: Record<SpiritRootType, string> = {
  金: "#FFD700",
  木: "#22C55E",
  水: "#3B82F6",
  火: "#EF4444",
  土: "#A16207",
  冰: "#67E8F9",
  雷: "#A855F7",
  风: "#06B6D4",
  天灵根: "#F59E0B",
  变异灵根: "#EC4899",
};

export const PERSONALITY_NAMES: Record<PersonalityType, string> = {
  刚正: "刚正不阿",
  阴柔: "阴柔内敛",
  狂傲: "狂傲不羁",
  谦逊: "谦逊有礼",
  多谋: "多谋善断",
  鲁莽: "鲁莽冲动",
  淡泊: "淡泊名利",
  执念: "执念深重",
};

export const REALM_CULTIVATION_REQUIREMENTS: number[] = [
  100, 500, 2000, 8000, 30000, 100000, 400000, 1500000,
];

export const DISCIPLE_GENERATION_CONFIG = {
  spiritStoneCost: 100,
  rareSpiritRootChance: 0.05,
  variantSpiritRootChance: 0.03,
  heavenSpiritRootChance: 0.02,
  baseLifespan: 200,
  lifespanPerRealm: 150,
} as const;

export const STATUS_COLORS: Record<DiscipleStatus, string> = {
  空闲: "#10B981",
  闭关: "#8B5CF6",
  历练: "#F59E0B",
  探索: "#3B82F6",
  受伤: "#EF4444",
  突破: "#EC4899",
};

export const RELATION_COLORS: Record<FactionRelationType, string> = {
  盟友: "#10B981",
  中立: "#6B7280",
  敌对: "#EF4444",
};
