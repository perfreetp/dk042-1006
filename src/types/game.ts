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
  | "idle"
  | "cultivating"
  | "expedition"
  | "exploring"
  | "injured"
  | "breakthrough";

export type EventSeverity = "low" | "medium" | "high" | "critical";

export type FactionRelationType = "ally" | "neutral" | "hostile";

export type ItemType = "pill" | "artifact" | "material";

export type QualityType = "下品" | "中品" | "上品" | "极品";

export type SectRuleTendency = number & { readonly __brand: unique symbol };

export type MaterialRarity = "common" | "uncommon" | "rare" | "legendary";

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
  spiritStonesAllocated: number;
  lifespan: number;
  relationships: Map<string, number>;
  equippedItems: string[];
}

export interface Sect {
  name: string;
  spiritStones: number;
  reputation: number;
  month: number;
  ruleTendency: number;
  maxCultivationSlots: number;
}

export interface CultivationSlot {
  id: string;
  discipleId: string | null;
  name: string;
}

export interface SecretRealmReward {
  type: ItemType;
  name: string;
  quantity: number;
}

export interface SecretRealm {
  id: string;
  name: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  recommendedRealmIndex: number;
  description: string;
  rewards: SecretRealmReward[];
  isActive: boolean;
  teamDiscipleIds: string[];
  progress: number;
  completed: boolean;
}

export interface RecipeMaterial {
  name: string;
  quantity: number;
}

export interface Recipe {
  id: string;
  name: string;
  type: "pill" | "artifact";
  requiredMaterials: RecipeMaterial[];
  successRate: number;
  qualityChance: Record<QualityType, number>;
  resultItem: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  type: ItemType;
  quality: QualityType;
  quantity: number;
  description: string;
  equippedBy: string | null;
}

export interface Material {
  id: string;
  name: string;
  quantity: number;
  rarity: MaterialRarity;
}

export interface EventChoice {
  text: string;
  effects: Record<string, number>;
}

export interface SectEvent {
  id: string;
  title: string;
  description: string;
  type:
    | "dialogue"
    | "dispute"
    | "disaster"
    | "invasion"
    | "treasure"
    | "betrayal"
    | "opportunity";
  severity: EventSeverity;
  relatedDiscipleIds: string[];
  choices: EventChoice[];
  resolved: boolean;
  monthOccurred: number;
}

export interface Faction {
  id: string;
  name: string;
  relation: FactionRelationType;
  power: number;
}

export interface Casualty {
  discipleId: string;
  cause: string;
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
}

export interface GameState {
  sect: Sect;
  disciples: Disciple[];
  cultivationSlots: CultivationSlot[];
  secretRealms: SecretRealm[];
  recipes: Recipe[];
  inventory: InventoryItem[];
  materials: Material[];
  events: SectEvent[];
  factions: Faction[];
  monthlyReports: MonthlyReport[];
  pendingEvents: SectEvent[];
  log: string[];
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
  刚正: "刚正",
  阴柔: "阴柔",
  狂傲: "狂傲",
  谦逊: "谦逊",
  多谋: "多谋",
  鲁莽: "鲁莽",
  淡泊: "淡泊",
  执念: "执念",
};

export const REALM_CULTIVATION_REQUIREMENTS: number[] = [
  100,
  500,
  2000,
  8000,
  30000,
  100000,
  400000,
  1500000,
];

export const DISCIPLE_GENERATION_CONFIG = {
  spiritStoneCost: 100,
  recruitmentBaseSuccessRate: 0.6,
  rareSpiritRootChance: 0.05,
  variantSpiritRootChance: 0.01,
  heavenSpiritRootChance: 0.02,
  baseLifespan: 200,
  lifespanPerRealm: 150,
  baseCultivation: 0,
  initialRealmIndex: 0,
  maxInitialRealmIndex: 2,
  personalityWeights: {
    刚正: 0.15,
    阴柔: 0.1,
    狂傲: 0.12,
    谦逊: 0.15,
    多谋: 0.12,
    鲁莽: 0.1,
    淡泊: 0.13,
    执念: 0.13,
  } as Record<PersonalityType, number>,
} as const;
