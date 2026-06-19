import { useState } from 'react'
import {
  Sword, Shield, Eye, Gem, Trophy,
  Shirt, Footprints, Watch, FlaskConical,
  Crosshair, Swords,
} from 'lucide-react'
import type { GGGCharacter, GGGItem, ItemSlot } from '@/types/app'
import { computeStats, formatNumber, formatPercent, frameTypeColor, type ComputedStats } from '@/lib/statsCalculator'

interface EquipmentTabProps {
  character: GGGCharacter
}

const SLOT_ORDER: ItemSlot[] = [
  'Weapon', 'Offhand', 'Helm', 'Chest', 'Gloves', 'Boots',
  'Amulet', 'Ring', 'Ring2', 'Belt', 'Flask', 'Trinket',
]

const SLOT_ICONS: Record<ItemSlot, React.ReactNode> = {
  Weapon:  <Swords className="w-5 h-5" />,
  Offhand: <Shield className="w-5 h-5" />,
  Helm:    <Eye className="w-5 h-5" />,
  Chest:   <Shirt className="w-5 h-5" />,
  Gloves:  <Gem className="w-5 h-5" />,
  Boots:   <Footprints className="w-5 h-5" />,
  Amulet:  <Trophy className="w-5 h-5" />,
  Ring:    <Gem className="w-5 h-5" />,
  Ring2:   <Gem className="w-5 h-5" />,
  Belt:    <Watch className="w-5 h-5" />,
  Flask:   <FlaskConical className="w-5 h-5" />,
  Trinket: <Gem className="w-5 h-5" />,
}

const SLOT_LABELS: Record<ItemSlot, string> = {
  Weapon: 'Weapon', Offhand: 'Offhand', Helm: 'Helm', Chest: 'Body Armour',
  Gloves: 'Gloves', Boots: 'Boots', Amulet: 'Amulet', Ring: 'Ring',
  Ring2: 'Ring', Belt: 'Belt', Flask: 'Flask', Trinket: 'Trinket',
}

interface WeaponSimState {
  enabled: boolean
  physDps: number
  eleDps: number
  crit: number
  aps: number
}

export default function EquipmentTab({ character }: EquipmentTabProps) {
  const [selectedItem, setSelectedItem] = useState<GGGItem | null>(null)
  const [weaponSim, setWeaponSim] = useState<WeaponSimState>({ enabled: false, physDps: 0, eleDps: 0, crit: 5, aps: 1.5 })

  const baseStats = computeStats(character)
  const simStats: ComputedStats = weaponSim.enabled
    ? { ...baseStats, weaponPhysicalDps: weaponSim.physDps, weaponElementalDps: weaponSim.eleDps, weaponTotalDps: weaponSim.physDps + weaponSim.eleDps, weaponCritChance: weaponSim.crit, weaponAttacksPerSecond: weaponSim.aps, weaponAvgHit: (weaponSim.physDps + weaponSim.eleDps) / (weaponSim.aps || 1) }
    : baseStats

  const items = character.equipment ?? []

  function getSlotItem(slot: ItemSlot): GGGItem | undefined {
    return items.find(i => i.slot === slot)
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Character Stats Sheet */}
      <div className="card p-5 border-poe-gold/20">
        <h3 className="text-poe-gold font-display text-sm tracking-wide mb-4 flex items-center gap-2">
          <Crosshair className="w-4 h-4" />
          Character Stats
          <span className="text-poe-muted text-xs font-normal font-sans">· {character.name} Lv.{character.level} {character.class}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
          <StatCard label="Life" value={formatNumber(simStats.life)} color="text-green-400" />
          <StatCard label="Mana" value={formatNumber(simStats.mana)} color="text-blue-400" />
          <StatCard label="Energy Shield" value={formatNumber(simStats.energyShield)} color="text-cyan-400" />
          <StatCard label="Armour" value={formatNumber(simStats.armour)} color="text-yellow-400" />
          <StatCard label="Evasion" value={formatNumber(simStats.evasion)} color="text-green-300" />
          <StatCard label="Block" value={formatPercent(simStats.blockChance)} color="text-orange-400" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-4">
          <StatCard label="Strength" value={String(simStats.strength)} color="text-red-400" />
          <StatCard label="Dexterity" value={String(simStats.dexterity)} color="text-green-400" />
          <StatCard label="Intelligence" value={String(simStats.intelligence)} color="text-blue-400" />
          <StatCard label="Fire Res" value={formatPercent(simStats.resistFire)} color={simStats.resistFire >= 75 ? 'text-green-400' : 'text-red-400'} />
          <StatCard label="Cold Res" value={formatPercent(simStats.resistCold)} color={simStats.resistCold >= 75 ? 'text-green-400' : 'text-red-400'} />
          <StatCard label="Lightning Res" value={formatPercent(simStats.resistLightning)} color={simStats.resistLightning >= 75 ? 'text-green-400' : 'text-red-400'} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Chaos Res" value={formatPercent(simStats.resistChaos)} color={simStats.resistChaos >= 60 ? 'text-green-400' : 'text-red-400'} />
          <StatCard label="Spell Dmg" value={formatPercent(simStats.spellDamage)} color="text-purple-400" />
          <StatCard label="Cast Speed" value={formatPercent(simStats.castSpeed)} color="text-purple-300" />
          <StatCard label="Movement Speed" value={formatPercent(simStats.movementSpeed)} color="text-yellow-300" />
        </div>

        {/* Weapon DPS */}
        {(simStats.weaponTotalDps > 0 || weaponSim.enabled) && (
          <div className="mt-4 p-4 rounded-xl border border-poe-border bg-poe-elevated">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-poe-muted uppercase tracking-wider">Weapon Stats</span>
              <button
                onClick={() => setWeaponSim(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`text-xs px-2 py-1 rounded transition-colors ${weaponSim.enabled ? 'bg-poe-gold/20 text-poe-gold border border-poe-gold/30' : 'bg-poe-elevated text-poe-muted border border-poe-border hover:text-poe-text'}`}
              >
                {weaponSim.enabled ? 'Simulating...' : 'Simulate Weapon'}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <StatCard label="Physical DPS" value={formatNumber(simStats.weaponPhysicalDps)} color="text-orange-400" />
              <StatCard label="Elemental DPS" value={formatNumber(simStats.weaponElementalDps)} color="text-blue-400" />
              <StatCard label="Total DPS" value={formatNumber(simStats.weaponTotalDps)} color="text-poe-gold" />
              <StatCard label="Crit Chance" value={(simStats.weaponCritChance).toFixed(1) + '%'} color="text-red-300" />
              <StatCard label="Attack Rate" value={simStats.weaponAttacksPerSecond.toFixed(2)} color="text-green-300" />
            </div>
            {weaponSim.enabled && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[10px] text-poe-muted block mb-0.5">Phys DPS</label>
                  <input type="number" value={weaponSim.physDps} onChange={e => setWeaponSim(p => ({ ...p, physDps: +e.target.value }))} className="w-full select-poe py-1 px-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-poe-muted block mb-0.5">Ele DPS</label>
                  <input type="number" value={weaponSim.eleDps} onChange={e => setWeaponSim(p => ({ ...p, eleDps: +e.target.value }))} className="w-full select-poe py-1 px-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-poe-muted block mb-0.5">Crit %</label>
                  <input type="number" step="0.1" value={weaponSim.crit} onChange={e => setWeaponSim(p => ({ ...p, crit: +e.target.value }))} className="w-full select-poe py-1 px-2 text-xs" />
                </div>
                <div>
                  <label className="text-[10px] text-poe-muted block mb-0.5">APS</label>
                  <input type="number" step="0.01" value={weaponSim.aps} onChange={e => setWeaponSim(p => ({ ...p, aps: +e.target.value }))} className="w-full select-poe py-1 px-2 text-xs" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Equipment Grid */}
      <div>
        <h3 className="text-poe-gold font-display text-sm tracking-wide mb-3 flex items-center gap-2">
          <Sword className="w-4 h-4" />
          Equipped Items
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {SLOT_ORDER.map(slot => {
            const item = getSlotItem(slot)
            return (
              <button
                key={slot}
                onClick={() => item && setSelectedItem(selectedItem?.id === item.id ? null : item)}
                className={`card p-3 text-left transition-all duration-200 border ${item ? 'hover:border-poe-gold/40 cursor-pointer' : 'border-poe-border/30 opacity-40'} ${selectedItem?.id === item?.id ? 'border-poe-gold ring-1 ring-poe-gold/30' : ''}`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-poe-muted shrink-0">{SLOT_ICONS[slot]}</span>
                  <span className="text-[10px] text-poe-muted uppercase tracking-wider">{SLOT_LABELS[slot]}</span>
                </div>
                {item ? (
                  <>
                    <p className={`text-xs font-medium truncate ${frameTypeColor(item.frameType ?? 0)}`}>
                      {item.name || item.typeLine || 'Unnamed'}
                    </p>
                    {item.typeLine && item.name !== item.typeLine && (
                      <p className="text-[10px] text-poe-subtle truncate">{item.typeLine}</p>
                    )}
                    <div className="flex gap-2 mt-1">
                      <span className="text-[10px] text-poe-subtle">iLvl {item.ilvl}</span>
                      {item.frameType === 2 && <span className="text-[10px] text-yellow-500">Rare</span>}
                      {item.frameType === 3 && <span className="text-[10px] text-orange-400">Unique</span>}
                    </div>
                  </>
                ) : (
                  <p className="text-[11px] text-poe-subtle italic">Empty</p>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Item Detail */}
      {selectedItem && (
        <div className="card p-5 border-poe-gold/30 animate-fade-in">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className={`text-sm font-display font-medium ${frameTypeColor(selectedItem.frameType ?? 0)}`}>
                {selectedItem.name || selectedItem.typeLine || 'Item'}
              </h4>
              {selectedItem.typeLine && selectedItem.name !== selectedItem.typeLine && (
                <p className="text-xs text-poe-muted">{selectedItem.typeLine}</p>
              )}
              <div className="flex gap-3 mt-1 text-[10px] text-poe-subtle">
                <span>{SLOT_LABELS[selectedItem.slot]}</span>
                <span>iLvl {selectedItem.ilvl}</span>
              </div>
            </div>
            <button onClick={() => setSelectedItem(null)} className="text-poe-muted hover:text-poe-text text-xs px-2 py-1 rounded border border-poe-border hover:border-poe-gold/40 transition-colors">Close</button>
          </div>

          {/* Implicit Mods */}
          {selectedItem.implicitMods && selectedItem.implicitMods.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] text-poe-muted uppercase tracking-wider mb-1">Implicit Modifiers</p>
              <div className="space-y-0.5">
                {selectedItem.implicitMods.map((mod, i) => (
                  <p key={i} className="text-xs text-poe-text/80">{mod}</p>
                ))}
              </div>
            </div>
          )}

          {/* Explicit Mods */}
          {selectedItem.explicitMods && selectedItem.explicitMods.length > 0 && (
            <div>
              <p className="text-[10px] text-poe-muted uppercase tracking-wider mb-1">Explicit Modifiers</p>
              <div className="space-y-0.5">
                {selectedItem.explicitMods.map((mod, i) => (
                  <p key={i} className="text-xs text-blue-300">{mod}</p>
                ))}
              </div>
            </div>
          )}

          {(!selectedItem.explicitMods || selectedItem.explicitMods.length === 0) &&
           (!selectedItem.implicitMods || selectedItem.implicitMods.length === 0) && (
            <p className="text-xs text-poe-subtle italic">No modifiers</p>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-poe-elevated rounded-lg border border-poe-border p-3 text-center">
      <p className="text-[10px] text-poe-muted uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-lg font-bold font-display ${color}`}>{value}</p>
    </div>
  )
}
