import { create } from 'zustand'
import type { GameState, MonthlyReport } from '@/types/game'
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

const REALM_NAMES = ['练气', '筑基', '金丹', '元婴', '化神', '合体', '大乘', '渡劫']

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
    const { disciples, spiritStones } = get()
    const cost = getRecruitCost(disciples)
    if (spiritStones < cost) return
    const newDisciple = generateDisciple()
    set({
      spiritStones: spiritStones - cost,
      disciples: [...disciples, newDisciple],
    })
  },

  assignCultivation(discipleId: string, slotId: string) {
    set((state) => {
      const slot = state.cultivationSlots.find((s) => s.id === slotId)
      if (!slot) return state
      const updatedDisciples = state.disciples.map((d) => {
        if (slot.occupantId === d.id) return { ...d, status: '空闲' }
        if (d.id === discipleId) return { ...d, status: '闭关' }
        return d
      })
      const updatedSlots = state.cultivationSlots.map((s) => {
        if (s.id === slotId) return { ...s, occupantId: discipleId }
        if (s.occupantId === discipleId) return { ...s, occupantId: null }
        return s
      })
      return { disciples: updatedDisciples, cultivationSlots: updatedSlots }
    })
  },

  removeFromCultivation(discipleId: string) {
    set((state) => ({
      disciples: state.disciples.map((d) =>
        d.id === discipleId ? { ...d, status: '空闲' } : d
      ),
      cultivationSlots: state.cultivationSlots.map((s) =>
        s.occupantId === discipleId ? { ...s, occupantId: null } : s
      ),
    }))
  },

  allocateSpiritStones(discipleId: string, amount: number) {
    set((state) => {
      if (state.spiritStones < amount) return state
      const disciple = state.disciples.find((d) => d.id === discipleId)
      if (!disciple || disciple.status !== '闭关') return state
      return {
        spiritStones: state.spiritStones - amount,
        disciples: state.disciples.map((d) =>
          d.id === discipleId ? { ...d, allocatedStones: amount } : d
        ),
      }
    })
  },

  attemptBreakthrough(discipleId: string) {
    set((state) => {
      const disciple = state.disciples.find((d) => d.id === discipleId)
      if (!disciple) return state
      const chance = calculateBreakthroughChance(disciple)
      const roll = Math.random()
      if (roll < chance) {
        const newRealmIndex = disciple.realmIndex + 1
        if (newRealmIndex >= REALM_NAMES.length) return state
        const newMaxCultivation = (newRealmIndex + 1) * 1000
        return {
          disciples: state.disciples.map((d) =>
            d.id === discipleId
              ? {
                  ...d,
                  realm: REALM_NAMES[newRealmIndex],
                  realmIndex: newRealmIndex,
                  cultivation: 0,
                  maxCultivation: newMaxCultivation,
                }
              : d
          ),
        }
      }
      return {
        disciples: state.disciples.map((d) =>
          d.id === discipleId ? { ...d, status: '受伤' } : d
        ),
      }
    })
  },

  assignExpedition(realmId: string, teamIds: string[]) {
    set((state) => ({
      expeditionRealms: state.expeditionRealms.map((r) =>
        r.id === realmId ? { ...r, status: '探索中', teamIds } : r
      ),
      disciples: state.disciples.map((d) =>
        teamIds.includes(d.id) ? { ...d, status: '探索' } : d
      ),
    }))
  },

  completeExpedition(realmId: string) {
    set((state) => {
      const realm = state.expeditionRealms.find((r) => r.id === realmId)
      if (!realm) return state
      const team = state.disciples.filter((d) => realm.teamIds.includes(d.id))
      const result = calculateExpeditionResult(realm, team)
      return {
        spiritStones: state.spiritStones + (result.spiritStones || 0),
        reputation: state.reputation + (result.reputation || 0),
        expeditionRealms: state.expeditionRealms.map((r) =>
          r.id === realmId ? { ...r, status: '已完成', teamIds: [] } : r
        ),
        disciples: state.disciples.map((d) => {
          if (!realm.teamIds.includes(d.id)) return d
          return result.casualties?.includes(d.id)
            ? { ...d, status: '受伤' }
            : { ...d, status: '空闲' }
        }),
        items: [...state.items, ...(result.items || [])],
      }
    })
  },

  craftItem(recipeId: string) {
    set((state) => {
      const recipe = state.recipes.find((r) => r.id === recipeId)
      if (!recipe) return state
      for (const [material, amount] of Object.entries(recipe.materials)) {
        if ((state.materials[material] || 0) < amount) return state
      }
      const newMaterials = { ...state.materials }
      for (const [material, amount] of Object.entries(recipe.materials)) {
        newMaterials[material] -= amount
      }
      const newItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: recipe.name,
        type: recipe.type,
        quality: recipe.resultQuality,
        effect: '',
        equippedBy: null as string | null,
      }
      return {
        materials: newMaterials,
        items: [...state.items, newItem],
      }
    })
  },

  equipItem(itemId: string, discipleId: string) {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, equippedBy: discipleId } : item
      ),
    }))
  },

  unequipItem(itemId: string) {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, equippedBy: null } : item
      ),
    }))
  },

  resolveEvent(eventId: string, choiceIndex: number) {
    set((state) => {
      const event = state.events.find((e) => e.id === eventId)
      if (!event || event.resolved) return state
      const option = event.options[choiceIndex]
      if (!option) return state
      const updates: Partial<GameStoreState> = {
        events: state.events.map((e) =>
          e.id === eventId ? { ...e, resolved: true } : e
        ),
      }
      if (option.effects) {
        if (option.effects.spiritStones) {
          updates.spiritStones = state.spiritStones + option.effects.spiritStones
        }
        if (option.effects.reputation) {
          updates.reputation = state.reputation + option.effects.reputation
        }
      }
      return updates
    })
  },

  adjustRuleTendency(value: number) {
    set({ ruleTendency: Math.max(0, Math.min(100, value)) })
  },

  advanceMonth() {
    set((state) => {
      const cultivationResult = processCultivationGains(state)
      const updatedState = { ...state, ...cultivationResult }
      const report = processMonthlySettlement(updatedState)
      const newEvents = generateRandomEvents(updatedState)
      return {
        ...updatedState,
        month: state.month + 1,
        reports: [...state.reports, report],
        showSettlement: true,
        currentSettlement: report,
        events: [...state.events, ...newEvents],
      }
    })
  },

  dismissSettlement() {
    set({ showSettlement: false })
  },

  addLog(message: string) {
    set((state) => ({
      logs: [...state.logs, message],
    }))
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
      return true
    } catch {
      return false
    }
  },

  healDisciple(discipleId: string) {
    set((state) => {
      const disciple = state.disciples.find((d) => d.id === discipleId)
      if (!disciple || disciple.status !== '受伤') return state
      if (state.spiritStones < 100) return state
      return {
        spiritStones: state.spiritStones - 100,
        disciples: state.disciples.map((d) =>
          d.id === discipleId ? { ...d, status: '空闲' } : d
        ),
      }
    })
  },
}))
