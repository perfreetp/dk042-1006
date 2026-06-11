import type { GameState, Disciple, ExpeditionRealm, Recipe, Faction, MaterialInventoryEntry } from "@/types/game";
import { REALM_NAMES, REALM_CULTIVATION_REQUIREMENTS } from "@/types/game";
import { generateDisciple } from "@/utils/gameEngine";

const mat = (qty: number, price: number = 20, reserved = false): MaterialInventoryEntry => ({
  quantity: qty,
  source: "starting",
  reserved,
  marketPrice: price,
});

export function createInitialState(): GameState {
  const initialDisciples: Disciple[] = [];
  for (let i = 0; i < 3; i++) {
    const d = generateDisciple();
    d.realmIndex = Math.floor(Math.random() * 2);
    d.realm = REALM_NAMES[d.realmIndex] as typeof REALM_NAMES[number];
    d.maxCultivation = REALM_CULTIVATION_REQUIREMENTS[d.realmIndex];
    d.cultivation = Math.floor(Math.random() * d.maxCultivation * 0.5);
    d.bonds = [];
    initialDisciples.push(d);
  }

  return {
    sect: {
      name: "云霄宗",
      spiritStones: 1000,
      reputation: 50,
      month: 1,
      ruleTendency: 50,
    },
    disciples: initialDisciples,
    cultivationSlots: [
      { id: "slot_1", name: "青莲洞", occupantId: null },
      { id: "slot_2", name: "紫云洞", occupantId: null },
      { id: "slot_3", name: "玄霜洞", occupantId: null },
      { id: "slot_4", name: "赤焰洞", occupantId: null },
    ],
    expeditionRealms: [
      {
        id: "realm_1",
        name: "落霞秘境",
        difficulty: 0,
        recommendedRealmIndex: 0,
        description: "一处风景秀丽的低阶秘境，传闻常有灵草生长其中。",
        status: "未探索",
        teamIds: [],
        rewards: [
          { type: "material", name: "灵草", quantity: 5 },
          { type: "material", name: "赤铁", quantity: 3 },
          { type: "pill", name: "培元丹", quantity: 2 },
        ],
      },
      {
        id: "realm_2",
        name: "天罡秘境",
        difficulty: 1,
        recommendedRealmIndex: 1,
        description: "罡气纵横的中阶秘境，内有古修遗迹，藏有法器图纸。",
        status: "未探索",
        teamIds: [],
        rewards: [
          { type: "material", name: "冰晶", quantity: 3 },
          { type: "material", name: "雷精", quantity: 2 },
          { type: "artifact", name: "青锋剑", quantity: 1 },
        ],
      },
      {
        id: "realm_3",
        name: "幽冥秘境",
        difficulty: 2,
        recommendedRealmIndex: 2,
        description: "阴森恐怖的高阶秘境，危险与机遇并存，传说有上古传承。",
        status: "未探索",
        teamIds: [],
        rewards: [
          { type: "material", name: "玄石", quantity: 5 },
          { type: "artifact", name: "玄铁盾", quantity: 1 },
          { type: "pill", name: "聚灵丹", quantity: 3 },
        ],
      },
    ] as ExpeditionRealm[],
    recipes: [
      {
        id: "recipe_1",
        name: "筑基丹",
        type: "pill",
        materials: { 灵草: 3 },
        successRate: 0.7,
        resultQuality: "中品",
        description: "辅助筑基期修士稳定根基的丹药，服用可提升修为。",
      },
      {
        id: "recipe_2",
        name: "聚灵丹",
        type: "pill",
        materials: { 灵草: 5, 冰晶: 2 },
        successRate: 0.5,
        resultQuality: "上品",
        description: "金丹期修士修炼的辅助丹药，大幅提升修为。",
      },
      {
        id: "recipe_3",
        name: "疗伤丹",
        type: "pill",
        materials: { 灵草: 2, 青藤: 1 },
        successRate: 0.8,
        resultQuality: "下品",
        description: "常见疗伤丹药，可快速治愈伤势。",
      },
      {
        id: "recipe_4",
        name: "青锋剑",
        type: "artifact",
        materials: { 赤铁: 4 },
        successRate: 0.6,
        resultQuality: "中品",
        description: "锋利无比的飞剑，装备后探索战力显著提升。",
      },
      {
        id: "recipe_5",
        name: "玄铁盾",
        type: "artifact",
        materials: { 赤铁: 3, 冰晶: 2 },
        successRate: 0.55,
        resultQuality: "上品",
        description: "坚不可摧的防御法器，降低探索受伤概率。",
      },
    ] as Recipe[],
    items: [],
    materials: {
      灵草: mat(10, 20, true),
      赤铁: mat(5, 30, true),
      冰晶: mat(3, 60, false),
      雷精: mat(2, 100, false),
      青藤: mat(5, 10, false),
      玄石: mat(0, 40, false),
    },
    events: [],
    factions: [
      { id: "faction_1", name: "天剑门", relation: "中立", power: 60, lastChange: 0 },
      { id: "faction_2", name: "万药谷", relation: "中立", power: 50, lastChange: 0 },
      { id: "faction_3", name: "魔道血宗", relation: "敌对", power: 70, lastChange: 0 },
    ] as Faction[],
    reports: [],
    logs: ["【第1月】云霄宗开门立派，宗主继位！"],
  };
}
