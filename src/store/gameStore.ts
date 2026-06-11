import { create } from 'zustand'
import type { GameState, MonthlyReport, InventoryItem, ExplorationRecord, CraftRecord, CultivationRecord } from '@/types/game'
import { REALM_NAMES, REALM_CULTIVATION_REQUIREMENTS } from '@/types/game'
import {
  getRecruitCost,
  generateDisciple,
  calculateBreakthroughChance,
  calculateExpeditionResult,
  generateRandomEvents,
  processMonthlySettlement,
  processCultivationGains,
  generateMonthlyRelationshipChanges,
  applyRuleTendencyModifier,
} from '@/utils/gameEngine'
import { createInitialState } from '@/utils/initialData'

interface GameStoreState extends GameState {
  showSettlement: boolean
  currentSettlement: MonthlyReport | null
  pendingCraftResult: CraftRecord | null
}

interface GameStoreActions {
  initGame: () => void
  recruitDisciple: () => void
  assignCultivation: (discipleId: string, slotId: string) => void
  removeFromCultivation: (discipleId: string) => void
  allocateSpiritStones: (discipleId: string, amount: number) => void
  attemptBreakthrough: (discipleId: string) => CultivationRecord | null
  assignExpedition: (realmId: string, teamIds: string[]) => void
  completeExpedition: (realmId: string) => ExplorationRecord | null
  craftItem: (recipeId: string) => CraftRecord | null
  equipItem: (itemId: string, discipleId: string) => void
  unequipItem: (itemId: string) => void
  resolveEvent: (eventId: string, choiceIndex: number) => void
  adjustRuleTendency: (value: number) => void
  advanceMonth: () => void
  dismissSettlement: () => void
  addLog: (message: string) => void
  saveGame: () => void
  loadGame: () => boolean
  healDisciple: (discipleId: string) => void
  openHistoricalReport: (month: number) => void
  clearPendingCraftResult: () => void
}

type GameStore = GameStoreState & GameStoreActions

function buildInventoryFromGains(
  gains: { name: string; type: 'pill' | 'artifact'; quality: '下品' | '中品' | '上品' | '极品'; quantity: number; description: string; effect: string }[],
  existingItems: InventoryItem[]
): InventoryItem[] {
  let items = [...existingItems]
  gains.forEach((g) => {
    const match = items.find(
      (it) => it.name === g.name && it.type === g.type && it.quality === g.quality && !it.equippedBy
    )
    if (match) {
      items = items.map((it) => (it.id === match.id ? { ...it, quantity: it.quantity + g.quantity } : it))
    } else {
      items.push({
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: g.name,
        type: g.type,
        quality: g.quality,
        quantity: g.quantity,
        description: g.description,
        equippedBy: null,
        effect: g.effect,
      })
    }
  })
  return items
}

export const useGameStore = create<GameStore>()((set, get) => ({
  ...createInitialState(),
  showSettlement: false,
  currentSettlement: null,
  pendingCraftResult: null,

  initGame() {
    const initial = createInitialState()
    set({
      ...initial,
      showSettlement: false,
      currentSettlement: null,
      pendingCraftResult: null,
    })
  },

  recruitDisciple() {
    const { disciples, sect, logs, reports } = get()
    const cost = getRecruitCost(disciples)
    if (sect.spiritStones < cost) {
      set({ logs: [...logs, `【招募失败】灵石不足，需要 ${cost} 灵石`] })
      return
    }
    const newDisciple = generateDisciple()
    const updatedReports = reports.length > 0
      ? reports.map((r, i) => i === reports.length - 1 ? { ...r, newDisciples: [...r.newDisciples, newDisciple.id] } : r)
      : reports
    set({
      sect: { ...sect, spiritStones: sect.spiritStones - cost },
      disciples: [...disciples, newDisciple],
      reports: updatedReports,
      logs: [...logs, `【第${sect.month}月】招募新弟子 ${newDisciple.name}，灵根：${newDisciple.spiritRoot}，性格：${newDisciple.personality}`],
    })
  },

  assignCultivation(discipleId: string, slotId: string) {
    set((state) => {
      const slot = state.cultivationSlots.find((s) => s.id === slotId)
      if (!slot) return state
      const updatedDisciples = state.disciples.map((d) => {
        if (slot.occupantId === d.id) return { ...d, status: '空闲' as const, assignedSlotId: null, allocatedStones: 0 }
        if (d.id === discipleId) return { ...d, status: '闭关' as const, assignedSlotId: slotId }
        return d
      })
      const prevSlot = state.cultivationSlots.find((s) => s.occupantId === discipleId)
      const updatedSlots = state.cultivationSlots.map((s) => {
        if (s.id === slotId) return { ...s, occupantId: discipleId }
        if (prevSlot && s.id === prevSlot.id) return { ...s, occupantId: null }
        return s
      })
      const disciple = state.disciples.find((d) => d.id === discipleId)
      return {
        disciples: updatedDisciples,
        cultivationSlots: updatedSlots,
        logs: [...state.logs, `【第${state.sect.month}月】${disciple?.name || '弟子'} 进入 ${slot.name} 闭关修炼`],
      }
    })
  },

  removeFromCultivation(discipleId: string) {
    set((state) => {
      const disciple = state.disciples.find((d) => d.id === discipleId)
      return {
        disciples: state.disciples.map((d) =>
          d.id === discipleId ? { ...d, status: '空闲' as const, assignedSlotId: null, allocatedStones: 0 } : d
        ),
        cultivationSlots: state.cultivationSlots.map((s) =>
          s.occupantId === discipleId ? { ...s, occupantId: null } : s
        ),
        logs: [...state.logs, `【第${state.sect.month}月】${disciple?.name || '弟子'} 结束闭关`],
      }
    })
  },

  allocateSpiritStones(discipleId: string, amount: number) {
    set((state) => {
      if (state.sect.spiritStones < amount) return state
      const disciple = state.disciples.find((d) => d.id === discipleId)
      if (!disciple || disciple.status !== '闭关') return state
      return {
        sect: { ...state.sect, spiritStones: state.sect.spiritStones - amount },
        disciples: state.disciples.map((d) =>
          d.id === discipleId ? { ...d, allocatedStones: d.allocatedStones + amount } : d
        ),
        logs: [...state.logs, `【第${state.sect.month}月】为 ${disciple.name} 分配 ${amount} 灵石加速修炼`],
      }
    })
  },

  attemptBreakthrough(discipleId: string): CultivationRecord | null {
    let result: CultivationRecord | null = null
    set((state) => {
      const disciple = state.disciples.find((d) => d.id === discipleId)
      if (!disciple) return state
      if (disciple.cultivation < disciple.maxCultivation) return state
      if (disciple.realmIndex >= REALM_NAMES.length - 1) return state
      const chance = calculateBreakthroughChance(disciple)
      const roll = Math.random()
      const success = roll < chance
      const newRealmIndex = disciple.realmIndex + 1

      result = {
        discipleId,
        discipleName: disciple.name,
        attempted: true,
        success,
        fromRealm: disciple.realm,
        toRealm: success ? REALM_NAMES[newRealmIndex] : undefined,
      }

      if (success) {
        const newMaxCultivation = REALM_CULTIVATION_REQUIREMENTS[newRealmIndex]
        return {
          disciples: state.disciples.map((d) =>
            d.id === discipleId
              ? {
                  ...d,
                  realm: REALM_NAMES[newRealmIndex] as typeof REALM_NAMES[number],
                  realmIndex: newRealmIndex,
                  cultivation: 0,
                  maxCultivation: newMaxCultivation,
                  status: '空闲' as const,
                  assignedSlotId: null,
                  allocatedStones: 0,
                }
              : d
          ),
          cultivationSlots: state.cultivationSlots.map((s) =>
            s.occupantId === discipleId ? { ...s, occupantId: null } : s
          ),
          logs: [...state.logs, `【第${state.sect.month}月】恭喜！${disciple.name} 突破成功！晋升 ${REALM_NAMES[newRealmIndex]}！`],
        }
      }
      return {
        disciples: state.disciples.map((d) =>
          d.id === discipleId ? { ...d, status: '受伤' as const, cultivation: Math.floor(d.cultivation * 0.7) } : d
        ),
        logs: [...state.logs, `【第${state.sect.month}月】${disciple.name} 突破失败，走火入魔身受重伤！`],
      }
    })
    return result
  },

  assignExpedition(realmId: string, teamIds: string[]) {
    set((state) => {
      const realm = state.expeditionRealms.find((r) => r.id === realmId)
      const disciples = state.disciples.filter((d) => teamIds.includes(d.id)).map((d) => d.name).join('、')
      return {
        expeditionRealms: state.expeditionRealms.map((r) =>
          r.id === realmId ? { ...r, status: '探索中' as const, teamIds } : r
        ),
        disciples: state.disciples.map((d) =>
          teamIds.includes(d.id) ? { ...d, status: '探索' as const } : d
        ),
        logs: [...state.logs, `【第${state.sect.month}月】派遣 ${disciples} 前往 ${realm?.name || '秘境'} 探索`],
      }
    })
  },

  completeExpedition(realmId: string): ExplorationRecord | null {
    let record: ExplorationRecord | null = null
    set((state) => {
      const realm = state.expeditionRealms.find((r) => r.id === realmId)
      if (!realm) return state
      const team = state.disciples.filter((d) => realm.teamIds.includes(d.id))
      const result = calculateExpeditionResult(realm, team)

      const newMaterials = { ...state.materials }
      Object.entries(result.materialGains).forEach(([k, v]) => {
        newMaterials[k] = (newMaterials[k] || 0) + v
      })
      const newItems = buildInventoryFromGains(result.itemGains, state.items)

      const updatedDisciples = state.disciples.map((d) => {
        if (!realm.teamIds.includes(d.id)) return d
        const isInjured = result.casualties.some((c) => c.discipleId === d.id)
        return isInjured
          ? { ...d, status: '受伤' as const }
          : { ...d, status: '空闲' as const, cultivation: Math.min(d.cultivation + 30, d.maxCultivation) }
      })

      const logs = [...state.logs]
      logs.push(`【第${state.sect.month}月】${realm.name} 探索${result.success ? '成功' : '失败'}！`)
      if (result.spiritStones > 0) logs.push(`  获得灵石：${result.spiritStones}`)
      if (result.reputation !== 0) logs.push(`  声望${result.reputation > 0 ? '提升' : '下降'}：${Math.abs(result.reputation)}`)
      result.casualties.forEach((c) => {
        logs.push(`  ${c.discipleName} ${c.cause}！`)
      })
      Object.entries(result.materialGains).forEach(([k, v]) => {
        logs.push(`  获得材料：${k} x${v}`)
      })
      result.itemGains.forEach((item) => {
        logs.push(`  获得${item.type === 'pill' ? '丹药' : '法器'}：${item.quality}${item.name} x${item.quantity}`)
      })

      record = {
        realmId,
        realmName: realm.name,
        success: result.success,
        spiritStones: result.spiritStones,
        reputation: result.reputation,
        casualties: result.casualties,
        materialGains: result.materialGains,
        itemGains: result.itemGains.map((g) => ({
          name: g.name,
          type: g.type,
          quality: g.quality,
          quantity: g.quantity,
        })),
      }

      return {
        sect: {
          ...state.sect,
          spiritStones: state.sect.spiritStones + result.spiritStones,
          reputation: Math.max(0, Math.min(100, state.sect.reputation + result.reputation)),
        },
        expeditionRealms: state.expeditionRealms.map((r) =>
          r.id === realmId ? { ...r, status: '已完成' as const, teamIds: [] } : r
        ),
        disciples: updatedDisciples,
        materials: newMaterials,
        items: newItems,
        logs,
      }
    })
    return record
  },

  craftItem(recipeId: string): CraftRecord | null {
    let record: CraftRecord | null = null
    set((state) => {
      const recipe = state.recipes.find((r) => r.id === recipeId)
      if (!recipe) return state
      for (const [material, amount] of Object.entries(recipe.materials)) {
        if ((state.materials[material] || 0) < amount) {
          return { logs: [...state.logs, `【炼丹炼器】材料不足，无法炼制 ${recipe.name}`] }
        }
      }
      const newMaterials = { ...state.materials }
      for (const [material, amount] of Object.entries(recipe.materials)) {
        newMaterials[material] = (newMaterials[material] || 0) - amount
      }

      const roll = Math.random()
      const success = roll < recipe.successRate

      record = {
        recipeId,
        recipeName: recipe.name,
        type: recipe.type,
        success,
        quality: recipe.resultQuality,
      }

      if (!success) {
        return {
          materials: newMaterials,
          pendingCraftResult: record,
          logs: [...state.logs, `【炼丹炼器】炼制 ${recipe.name} 失败，材料已消耗`],
        }
      }

      let newItems = [...state.items]
      const match = newItems.find(
        (it) => it.name === recipe.name && it.type === recipe.type && it.quality === recipe.resultQuality && !it.equippedBy
      )
      if (match) {
        newItems = newItems.map((it) => (it.id === match.id ? { ...it, quantity: it.quantity + 1 } : it))
      } else {
        newItems.push({
          id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: recipe.name,
          type: recipe.type,
          quality: recipe.resultQuality,
          quantity: 1,
          description: recipe.description,
          equippedBy: null,
          effect: recipe.type === 'pill' ? '服用可增益修为' : '装备可提升战力',
        })
      }
      return {
        materials: newMaterials,
        items: newItems,
        pendingCraftResult: record,
        logs: [...state.logs, `【炼丹炼器】成功炼制 ${recipe.resultQuality} ${recipe.name}！`],
      }
    })
    return record
  },

  clearPendingCraftResult() {
    set({ pendingCraftResult: null })
  },

  equipItem(itemId: string, discipleId: string) {
    set((state) => {
      const item = state.items.find((i) => i.id === itemId)
      const disciple = state.disciples.find((d) => d.id === discipleId)
      if (!item || !disciple) return state
      return {
        items: state.items.map((item) =>
          item.id === itemId ? { ...item, equippedBy: discipleId } : item
        ),
        disciples: state.disciples.map((d) =>
          d.id === discipleId ? { ...d, equippedItems: [...d.equippedItems, itemId] } : d
        ),
        logs: [...state.logs, `【第${state.sect.month}月】${disciple.name} 装备了 ${item.name}`],
      }
    })
  },

  unequipItem(itemId: string) {
    set((state) => {
      const item = state.items.find((i) => i.id === itemId)
      if (!item || !item.equippedBy) return state
      return {
        items: state.items.map((item) =>
          item.id === itemId ? { ...item, equippedBy: null } : item
        ),
        disciples: state.disciples.map((d) =>
          d.id === item.equippedBy
            ? { ...d, equippedItems: d.equippedItems.filter((id) => id !== itemId) }
            : d
        ),
      }
    })
  },

  resolveEvent(eventId: string, choiceIndex: number) {
    set((state) => {
      const event = state.events.find((e) => e.id === eventId)
      if (!event || event.resolved) return state
      const option = event.options[choiceIndex]
      if (!option) return state

      const effects = applyRuleTendencyModifier(option.effects || {}, state.sect.ruleTendency)

      const logs = [...state.logs, `【事件】${event.title} - 选择：${option.text}`]
      let spiritStones = state.sect.spiritStones
      let reputation = state.sect.reputation
      let ruleTendency = state.sect.ruleTendency

      if (effects.spiritStones) {
        spiritStones += effects.spiritStones
        logs.push(`  灵石${effects.spiritStones > 0 ? '增加' : '减少'}：${Math.abs(effects.spiritStones)}${state.sect.ruleTendency >= 80 || state.sect.ruleTendency <= 20 ? '（门规修正）' : ''}`)
      }
      if (effects.reputation) {
        reputation = Math.max(0, Math.min(100, reputation + effects.reputation))
        logs.push(`  声望${effects.reputation > 0 ? '提升' : '下降'}：${Math.abs(effects.reputation)}${state.sect.ruleTendency >= 80 || state.sect.ruleTendency <= 20 ? '（门规修正）' : ''}`)
      }
      if (effects.ruleTendency) {
        ruleTendency = Math.max(0, Math.min(100, ruleTendency + effects.ruleTendency))
        logs.push(`  门规倾向调整：${effects.ruleTendency > 0 ? '更宽松' : '更严苛'}`)
      }
      return {
        sect: { ...state.sect, spiritStones, reputation, ruleTendency },
        events: state.events.map((e) =>
          e.id === eventId ? { ...e, resolved: true } : e
        ),
        logs,
      }
    })
  },

  adjustRuleTendency(value: number) {
    set({ sect: { ...get().sect, ruleTendency: Math.max(0, Math.min(100, value)) } })
  },

  advanceMonth() {
    set((state) => {
      const cultivationResult = processCultivationGains(state)
      let workingState: GameState = { ...state, ...cultivationResult }

      const relResult = generateMonthlyRelationshipChanges(workingState)
      workingState = { ...workingState, disciples: relResult.disciples }

      const explorationRecords: ExplorationRecord[] = []
      const craftRecords: CraftRecord[] = []
      let spiritStones = workingState.sect.spiritStones
      let reputation = workingState.sect.reputation
      const allCasualties: MonthlyReport['casualties'] = []
      let disciples = [...workingState.disciples]
      let materials = { ...workingState.materials }
      let items = [...workingState.items]
      const logs = [...workingState.logs]

      workingState.expeditionRealms.forEach((r) => {
        if (r.status === '探索中') {
          const team = disciples.filter((d) => r.teamIds.includes(d.id))
          const result = calculateExpeditionResult(r, team)

          spiritStones += result.spiritStones
          reputation = Math.max(0, Math.min(100, reputation + result.reputation))

          Object.entries(result.materialGains).forEach(([k, v]) => {
            materials[k] = (materials[k] || 0) + v
          })
          items = buildInventoryFromGains(result.itemGains, items)

          disciples = disciples.map((d) => {
            if (!r.teamIds.includes(d.id)) return d
            const isInjured = result.casualties.some((c) => c.discipleId === d.id)
            return isInjured
              ? { ...d, status: '受伤' as const }
              : { ...d, status: '空闲' as const }
          })

          allCasualties.push(...result.casualties)
          logs.push(`【第${state.sect.month}月】${r.name} 探索${result.success ? '成功' : '失败'}，灵石 ${result.spiritStones > 0 ? '+' : ''}${result.spiritStones}`)

          explorationRecords.push({
            realmId: r.id,
            realmName: r.name,
            success: result.success,
            spiritStones: result.spiritStones,
            reputation: result.reputation,
            casualties: result.casualties,
            materialGains: result.materialGains,
            itemGains: result.itemGains.map((g) => ({
              name: g.name,
              type: g.type,
              quality: g.quality,
              quantity: g.quantity,
            })),
          })
        }
      })

      const updatedRealms = workingState.expeditionRealms.map((r) =>
        r.status === '探索中' ? { ...r, status: '已完成' as const, teamIds: [] } : r
      )

      const stateForReport: GameState = {
        ...workingState,
        sect: { ...workingState.sect, spiritStones, reputation },
        disciples,
        materials,
        items,
        expeditionRealms: updatedRealms,
      }
      let report = processMonthlySettlement(stateForReport)

      report = {
        ...report,
        casualties: allCasualties,
        explorationRecords,
        craftRecords,
        relationshipChanges: relResult.changes,
      }

      let updatedDisciples = disciples.map((d) => {
        const record = report.breakthroughs.find((b) => b.discipleId === d.id && b.success)
        if (record && d.realmIndex < REALM_NAMES.length - 1) {
          const newIdx = d.realmIndex + 1
          logs.push(`【第${state.sect.month}月】${d.name} 成功突破至 ${REALM_NAMES[newIdx]}！`)
          return {
            ...d,
            realmIndex: newIdx,
            realm: REALM_NAMES[newIdx] as typeof REALM_NAMES[number],
            cultivation: 0,
            maxCultivation: REALM_CULTIVATION_REQUIREMENTS[newIdx],
          }
        }
        return d
      })

      let factions = [...workingState.factions]
      report.factionChanges.forEach((change) => {
        factions = factions.map((f) =>
          f.id === change.factionId
            ? { ...f, relation: change.newRelation, lastChange: state.sect.month }
            : f
        )
        const faction = factions.find((f) => f.id === change.factionId)
        if (faction) {
          logs.push(`【第${state.sect.month}月】与 ${faction.name} 的关系：${change.oldRelation} → ${change.newRelation}`)
        }
      })

      const newEvents = generateRandomEvents({ ...workingState, sect: { ...workingState.sect, month: state.sect.month + 1 } })

      spiritStones = spiritStones + report.spiritStoneIncome - report.spiritStoneExpense
      reputation = Math.max(0, Math.min(100, reputation + report.reputationChange))

      logs.unshift(`========== 第 ${state.sect.month + 1} 月 ==========`)

      return {
        sect: { ...workingState.sect, month: state.sect.month + 1, spiritStones, reputation },
        disciples: updatedDisciples,
        expeditionRealms: updatedRealms,
        factions,
        materials,
        items,
        reports: [...state.reports, report],
        showSettlement: true,
        currentSettlement: report,
        events: [...state.events, ...newEvents],
        logs,
      }
    })
  },

  dismissSettlement() {
    set({ showSettlement: false })
  },

  openHistoricalReport(month: number) {
    const report = get().reports.find((r) => r.month === month)
    if (report) {
      set({ currentSettlement: report, showSettlement: true })
    }
  },

  addLog(message: string) {
    set((state) => ({ logs: [...state.logs, message] }))
  },

  saveGame() {
    const state = get()
    const saveData: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(state)) {
      if (typeof value !== 'function') {
        saveData[key] = value
      }
    }
    localStorage.setItem('xiuxian-game-save', JSON.stringify(saveData))
    set((state) => ({ logs: [...state.logs, `【系统】游戏已保存`] }))
  },

  loadGame() {
    const saved = localStorage.getItem('xiuxian-game-save')
    if (!saved) return false
    try {
      const data = JSON.parse(saved)
      set({
        ...data,
        showSettlement: false,
        currentSettlement: null,
        pendingCraftResult: null,
      })
      set((state) => ({ logs: [...state.logs, `【系统】游戏已读取`] }))
      return true
    } catch {
      return false
    }
  },

  healDisciple(discipleId: string) {
    set((state) => {
      const disciple = state.disciples.find((d) => d.id === discipleId)
      if (!disciple || disciple.status !== '受伤') return state
      if (state.sect.spiritStones < 100) {
        return { logs: [...state.logs, `【治疗】灵石不足，无法治疗 ${disciple.name}`] }
      }
      return {
        sect: { ...state.sect, spiritStones: state.sect.spiritStones - 100 },
        disciples: state.disciples.map((d) =>
          d.id === discipleId ? { ...d, status: '空闲' as const } : d
        ),
        logs: [...state.logs, `【第${state.sect.month}月】花费 100 灵石治愈 ${disciple.name}`],
      }
    })
  },
}))
