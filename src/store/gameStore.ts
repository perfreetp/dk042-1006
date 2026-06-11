import { create } from 'zustand'
import type { GameState, MonthlyReport } from '@/types/game'
import { REALM_NAMES, REALM_CULTIVATION_REQUIREMENTS } from '@/types/game'
import {
  getRecruitCost,
  generateDisciple,
  calculateBreakthroughChance,
  calculateExpeditionResult,
  generateRandomEvents,
  processMonthlySettlement,
  processCultivationGains,
} from '@/utils/gameEngine'
import { createInitialState } from '@/utils/initialData'

interface GameStoreState extends GameState {
  showSettlement: boolean
  currentSettlement: MonthlyReport | null
}

interface GameStoreActions {
  initGame: () => void
  recruitDisciple: () => void
  assignCultivation: (discipleId: string, slotId: string) => void
  removeFromCultivation: (discipleId: string) => void
  allocateSpiritStones: (discipleId: string, amount: number) => void
  attemptBreakthrough: (discipleId: string) => void
  assignExpedition: (realmId: string, teamIds: string[]) => void
  completeExpedition: (realmId: string) => void
  craftItem: (recipeId: string) => void
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
}

type GameStore = GameStoreState & GameStoreActions

export const useGameStore = create<GameStore>()((set, get) => ({
  ...createInitialState(),
  showSettlement: false,
  currentSettlement: null,

  initGame() {
    const initial = createInitialState()
    set({
      ...initial,
      showSettlement: false,
      currentSettlement: null,
    })
  },

  recruitDisciple() {
    const { disciples, sect, logs } = get()
    const cost = getRecruitCost(disciples)
    if (sect.spiritStones < cost) {
      set({ logs: [...logs, `【招募失败】灵石不足，需要 ${cost} 灵石`] })
      return
    }
    const newDisciple = generateDisciple()
    set({
      sect: { ...sect, spiritStones: sect.spiritStones - cost },
      disciples: [...disciples, newDisciple],
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

  attemptBreakthrough(discipleId: string) {
    set((state) => {
      const disciple = state.disciples.find((d) => d.id === discipleId)
      if (!disciple) return state
      if (disciple.cultivation < disciple.maxCultivation) return state
      const chance = calculateBreakthroughChance(disciple)
      const roll = Math.random()
      if (roll < chance) {
        const newRealmIndex = disciple.realmIndex + 1
        if (newRealmIndex >= REALM_NAMES.length) return state
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

  completeExpedition(realmId: string) {
    set((state) => {
      const realm = state.expeditionRealms.find((r) => r.id === realmId)
      if (!realm) return state
      const team = state.disciples.filter((d) => realm.teamIds.includes(d.id))
      const result = calculateExpeditionResult(realm, team)
      const newItems = [...state.items, ...result.items]
      const updatedDisciples = state.disciples.map((d) => {
        if (!realm.teamIds.includes(d.id)) return d
        return result.casualties.includes(d.id)
          ? { ...d, status: '受伤' as const }
          : { ...d, status: '空闲' as const, cultivation: Math.min(d.cultivation + 30, d.maxCultivation) }
      })
      const logs = [...state.logs]
      logs.push(`【第${state.sect.month}月】${realm.name} 探索${result.success ? '成功' : '失败'}！`)
      if (result.spiritStones > 0) logs.push(`  获得灵石：${result.spiritStones}`)
      if (result.reputation !== 0) logs.push(`  声望${result.reputation > 0 ? '提升' : '下降'}：${Math.abs(result.reputation)}`)
      result.casualties.forEach((id) => {
        const injured = state.disciples.find((d) => d.id === id)
        if (injured) logs.push(`  ${injured.name} 在探索中身受重伤！`)
      })
      result.items.forEach((item) => {
        logs.push(`  获得物品：${item.name} x${item.quantity}`)
      })
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
        items: newItems,
        logs,
      }
    })
  },

  craftItem(recipeId: string) {
    set((state) => {
      const recipe = state.recipes.find((r) => r.id === recipeId)
      if (!recipe) return state
      for (const [material, amount] of Object.entries(recipe.materials)) {
        if ((state.materials[material] || 0) < amount) {
          return { logs: [...state.logs, `【炼丹炼器】材料不足，无法炼制 ${recipe.name}`] }
        }
      }
      const roll = Math.random()
      const success = roll < recipe.successRate
      if (!success) {
        const newMaterials = { ...state.materials }
        for (const [material, amount] of Object.entries(recipe.materials)) {
          newMaterials[material] = (newMaterials[material] || 0) - amount
        }
        return {
          materials: newMaterials,
          logs: [...state.logs, `【炼丹炼器】炼制 ${recipe.name} 失败，材料已消耗`],
        }
      }
      const newMaterials = { ...state.materials }
      for (const [material, amount] of Object.entries(recipe.materials)) {
        newMaterials[material] = (newMaterials[material] || 0) - amount
      }
      const newItem = {
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: recipe.name,
        type: recipe.type,
        quality: recipe.resultQuality,
        quantity: 1,
        description: recipe.description,
        equippedBy: null,
        effect: '',
      }
      return {
        materials: newMaterials,
        items: [...state.items, newItem],
        logs: [...state.logs, `【炼丹炼器】成功炼制 ${recipe.resultQuality} ${recipe.name}！`],
      }
    })
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
      const logs = [...state.logs, `【事件】${event.title} - 选择：${option.text}`]
      let spiritStones = state.sect.spiritStones
      let reputation = state.sect.reputation
      let ruleTendency = state.sect.ruleTendency

      if (option.effects) {
        if (option.effects.spiritStones) {
          spiritStones += option.effects.spiritStones
          logs.push(`  灵石${option.effects.spiritStones > 0 ? '增加' : '减少'}：${Math.abs(option.effects.spiritStones)}`)
        }
        if (option.effects.reputation) {
          reputation = Math.max(0, Math.min(100, reputation + option.effects.reputation))
          logs.push(`  声望${option.effects.reputation > 0 ? '提升' : '下降'}：${Math.abs(option.effects.reputation)}`)
        }
        if (option.effects.ruleTendency) {
          ruleTendency = Math.max(0, Math.min(100, ruleTendency + option.effects.ruleTendency))
          logs.push(`  门规倾向调整：${option.effects.ruleTendency > 0 ? '更宽松' : '更严苛'}`)
        }
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
      const updatedState = { ...state, ...cultivationResult }
      const report = processMonthlySettlement(updatedState)

      let disciples = [...updatedState.disciples]
      let spiritStones = updatedState.sect.spiritStones + report.spiritStoneIncome - report.spiritStoneExpense
      let reputation = Math.max(0, Math.min(100, updatedState.sect.reputation + report.reputationChange))
      const logs = [...updatedState.logs]

      disciples = disciples.map((d) => {
        if (report.breakthroughs.includes(d.id) && d.realmIndex < REALM_NAMES.length - 1) {
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

      let factions = [...updatedState.factions]
      report.factionChanges.forEach((change) => {
        factions = factions.map((f) =>
          f.id === change.factionId
            ? { ...f, relation: change.newRelation, lastChange: state.sect.month }
            : f
        )
        const faction = factions.find((f) => f.id === change.factionId)
        if (faction) {
          logs.push(`【第${state.sect.month}月】与 ${faction.name} 的关系变为：${change.newRelation}`)
        }
      })

      state.expeditionRealms.forEach((r) => {
        if (r.status === '探索中') {
          const team = disciples.filter((d) => r.teamIds.includes(d.id))
          const result = calculateExpeditionResult(r, team)
          spiritStones += result.spiritStones
          reputation = Math.max(0, Math.min(100, reputation + result.reputation))
          disciples = disciples.map((d) => {
            if (!r.teamIds.includes(d.id)) return d
            return result.casualties.includes(d.id)
              ? { ...d, status: '受伤' as const }
              : { ...d, status: '空闲' as const }
          })
          logs.push(`【第${state.sect.month}月】${r.name} 探索${result.success ? '成功' : '失败'}，获得 ${result.spiritStones} 灵石`)
        }
      })

      const updatedRealms = state.expeditionRealms.map((r) =>
        r.status === '探索中' ? { ...r, status: '已完成' as const, teamIds: [] } : r
      )

      const newEvents = generateRandomEvents({ ...updatedState, sect: { ...updatedState.sect, month: state.sect.month + 1 } })

      logs.unshift(`========== 第 ${state.sect.month + 1} 月 ==========`)

      return {
        sect: { ...updatedState.sect, month: state.sect.month + 1, spiritStones, reputation },
        disciples,
        expeditionRealms: updatedRealms,
        factions,
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
