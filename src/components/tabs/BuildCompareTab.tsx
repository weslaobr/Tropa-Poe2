import { useState, useRef } from 'react'
import { Upload, GitCompare, ChevronDown, ChevronUp, Check, X, AlertCircle, FileText, Shield, Zap, BookOpen, Layers, Sword } from 'lucide-react'
import { parsePoeNinjaBuild, compareBuilds, type BuildCompareResult } from '@/lib/buildCompare'

function passiveDisplayName(id: string): string {
  const known: Record<string, string> = {
    'passive_keystone_elemental_equilibrium': 'Elemental Equilibrium',
    'passive_keystone_blood_magic': 'Blood Magic',
    'passive_keystone_chaos_inoculation': 'Chaos Inoculation',
    'passive_keystone_eldritch_battery': 'Eldritch Battery',
    'passive_keystone_ghost_reaver': 'Ghost Reaver',
    'passive_keystone_iron_grip': 'Iron Grip',
    'passive_keystone_iron_reflexes': 'Iron Reflexes',
    'passive_keystone_iron_will': 'Iron Will',
    'passive_keystone_minion_instability': 'Minion Instability',
    'passive_keystone_necrotic_aegis': 'Necrotic Aegis',
    'passive_keystone_nullification': 'Nullification',
    'passive_keystone_pain_attunement': 'Pain Attunement',
    'passive_keystone_point_blank': 'Point Blank',
    'passive_keystone_resolute_technique': 'Resolute Technique',
    'passive_keystone_unwavering_stance': 'Unwavering Stance',
    'passive_keystone_vaal_pact': 'Vaal Pact',
    'passive_keystone_zealots_oath': 'Zealot\'s Oath',
  }
  if (known[id]) return known[id]
  if (id.startsWith('jewel_slot')) return 'Jewel Socket'
  if (id.startsWith('Ascendancy')) return id.replace(/Ascendancy/, '').replace(/([A-Z])/g, ' $1').trim()
  return id
}

interface PassiveSection {
  id: string
  weaponSet: number
}

function PassiveList({ items, empty }: { items: PassiveSection[]; empty: string }) {
  if (items.length === 0) return <p className="text-poe-subtle text-xs">{empty}</p>
  return (
    <div className="flex flex-wrap gap-1">
      {items.map(p => (
        <span key={p.id} title={p.id} className="px-1.5 py-0.5 rounded text-xs border bg-poe-elevated/50">
          {passiveDisplayName(p.id)}
          {p.weaponSet > 0 && <span className="text-poe-subtle ml-0.5">(WS{p.weaponSet})</span>}
        </span>
      ))}
    </div>
  )
}

function SkillCard({ skill, icon }: { skill: { name: string; supports: { id: string; name: string }[] }; icon: React.ReactNode }) {
  return (
    <div className="border border-poe-border rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-sm font-medium text-poe-text">{skill.name}</span>
      </div>
      {skill.supports.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {skill.supports.map((s, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded text-xs bg-poe-elevated border border-poe-border text-poe-muted">{s.name}</span>
          ))}
        </div>
      ) : (
        <p className="text-poe-subtle text-xs">No support gems</p>
      )}
    </div>
  )
}

export default function BuildCompareTab() {
  const [buildA, setBuildA] = useState<{ raw: string; name: string } | null>(null)
  const [buildB, setBuildB] = useState<{ raw: string; name: string } | null>(null)
  const [result, setResult] = useState<BuildCompareResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [catOpen, setCatOpen] = useState<Set<string>>(new Set(['Ascendancy', 'Keystone', 'Jewel Socket']))
  const [sharedPassivesOpen, setSharedPassivesOpen] = useState(true)
  const [sharedSkillsOpen, setSharedSkillsOpen] = useState(true)
  const inputRefA = useRef<HTMLInputElement>(null)
  const inputRefB = useRef<HTMLInputElement>(null)

  function handleFile(index: 0 | 1) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = () => {
        const raw = reader.result as string
        if (index === 0) setBuildA({ raw, name: file.name })
        else setBuildB({ raw, name: file.name })
        setResult(null)
        setError(null)
      }
      reader.readAsText(file)
    }
  }

  function handleCompare() {
    setError(null)
    setResult(null)
    if (!buildA || !buildB) { setError('Select two build files to compare.'); return }
    try {
      const parsedA = parsePoeNinjaBuild(buildA.raw, buildA.name)
      const parsedB = parsePoeNinjaBuild(buildB.raw, buildB.name)
      setResult(compareBuilds(parsedA, parsedB))
    } catch (err) {
      setError(`Failed to parse build file: ${err instanceof Error ? err.message : 'Invalid JSON'}`)
    }
  }

  function toggleCat(cat: string) {
    setCatOpen(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat); else next.add(cat)
      return next
    })
  }

  const allCats = result
    ? [...new Set([...Object.keys(result.passivesByCategory), 'Ascendancy', 'Keystone', 'Jewel Socket', 'Other'].filter(c => c && result.passivesByCategory[c]))]
    : []

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <GitCompare className="w-6 h-6 text-poe-gold" />
          <div className="absolute -inset-1 bg-poe-gold/10 rounded-full blur-sm" />
        </div>
        <div>
          <h2 className="text-poe-gold font-display text-lg tracking-wide">Build Comparator</h2>
          <p className="text-poe-muted text-xs mt-0.5">Compare two poe.ninja .build files side-by-side</p>
        </div>
      </div>

      {/* File pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {([0, 1] as const).map((idx) => {
          const build = idx === 0 ? buildA : buildB
          const setter = idx === 0 ? setBuildA : setBuildB
          const ref = idx === 0 ? inputRefA : inputRefB
          return (
            <div key={idx} className="card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-poe-crimson/20 text-red-300 border border-poe-crimson/30' : 'bg-blue-900/20 text-blue-300 border border-blue-700/30'}`}>
                  {idx === 0 ? 'A' : 'B'}
                </div>
                <h3 className="text-sm font-display tracking-wide text-poe-text">
                  Build {idx === 0 ? 'A' : 'B'}
                </h3>
              </div>
              <input
                ref={ref}
                type="file"
                accept=".build,.json"
                className="hidden"
                onChange={handleFile(idx)}
              />
              {build ? (
                <div className="flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className={`w-4 h-4 shrink-0 ${idx === 0 ? 'text-red-400' : 'text-blue-400'}`} />
                    <span className="text-sm text-poe-text truncate">{build.name}</span>
                  </div>
                  <button
                    onClick={() => { setter(null); setResult(null); setError(null) }}
                    className="btn-ghost p-1 text-poe-muted hover:text-poe-crimson-bright"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => ref.current?.click()}
                  className="btn-secondary w-full flex items-center justify-center gap-2 py-8 border-dashed border-poe-border text-poe-muted hover:text-poe-text"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-sm">Select .build file</span>
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Compare button */}
      <button
        onClick={handleCompare}
        disabled={!buildA || !buildB}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 disabled:opacity-50 text-base"
      >
        <GitCompare className="w-5 h-5" />
        Compare Builds
      </button>

      {error && (
        <div className="card border-poe-crimson/50 p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-poe-crimson-bright shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Build info - 3 column layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4 border-poe-crimson/30">
              <p className="text-xs text-poe-muted mb-1 flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-poe-crimson inline-block" />
                Build A
              </p>
              <p className="text-poe-text font-medium text-base">{result.buildA.name}</p>
              <p className="text-poe-subtle text-xs mt-0.5">
                <Shield className="w-3 h-3 inline mr-0.5" />
                {result.buildA.ascendancy}
              </p>
              <p className="text-poe-subtle text-xs">by {result.buildA.author}</p>
              <div className="mt-2 flex gap-3 text-xs">
                <span className="text-poe-muted"><Layers className="w-3 h-3 inline mr-0.5" />{result.summary.totalPassivesA} passives</span>
                <span className="text-poe-muted"><Zap className="w-3 h-3 inline mr-0.5" />{result.summary.totalSkillsA} skills</span>
              </div>
            </div>

            <div className="card p-4 border-poe-gold/30 flex flex-col items-center justify-center text-center">
              <p className="text-xs text-poe-muted mb-1">Shared</p>
              <p className="text-3xl font-bold text-poe-gold font-display">{result.summary.sharedPassives}</p>
              <p className="text-poe-muted text-xs">passives in common</p>
              <div className="mt-2 h-2 w-full rounded-full bg-poe-elevated overflow-hidden">
                <div
                  className="h-full rounded-full bg-poe-gold/70 transition-all"
                  style={{ width: `${result.summary.totalPassivesA > 0 ? (result.summary.sharedPassives / Math.max(result.summary.totalPassivesA, result.summary.totalPassivesB) * 100) : 0}%` }}
                />
              </div>
              <div className="mt-2 flex gap-3 text-xs">
                <span className="text-poe-success">{result.summary.sharedSkills} shared skills</span>
              </div>
            </div>

            <div className="card p-4 border-blue-700/30">
              <p className="text-xs text-poe-muted mb-1 flex items-center gap-1">
                <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
                Build B
              </p>
              <p className="text-poe-text font-medium text-base">{result.buildB.name}</p>
              <p className="text-poe-subtle text-xs mt-0.5">
                <Shield className="w-3 h-3 inline mr-0.5" />
                {result.buildB.ascendancy}
              </p>
              <p className="text-poe-subtle text-xs">by {result.buildB.author}</p>
              <div className="mt-2 flex gap-3 text-xs">
                <span className="text-poe-muted"><Layers className="w-3 h-3 inline mr-0.5" />{result.summary.totalPassivesB} passives</span>
                <span className="text-poe-muted"><Zap className="w-3 h-3 inline mr-0.5" />{result.summary.totalSkillsB} skills</span>
              </div>
            </div>
          </div>

          {/* SHARED SECTION */}
          <div className="card p-4 border-poe-gold/20 space-y-4">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-poe-gold" />
              <h3 className="text-poe-gold font-display text-base tracking-wide">Shared — In Common</h3>
            </div>

            {/* Shared Passives by category */}
            <div className="border border-poe-border rounded-lg overflow-hidden">
              <button
                onClick={() => setSharedPassivesOpen(!sharedPassivesOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-poe-elevated hover:bg-poe-border/30 transition-colors"
              >
                <span className="text-sm font-medium text-poe-text">
                  <Layers className="w-4 h-4 inline mr-2 text-poe-gold" />
                  Shared Passives
                  <span className="text-poe-subtle text-xs ml-2 font-normal">({result.summary.sharedPassives})</span>
                </span>
                {sharedPassivesOpen ? <ChevronUp className="w-4 h-4 text-poe-muted" /> : <ChevronDown className="w-4 h-4 text-poe-muted" />}
              </button>
              {sharedPassivesOpen && (
                <div className="p-4 space-y-3">
                  {allCats.filter(cat => {
                    const s = result.passivesByCategory[cat]
                    return s && s.shared.length > 0
                  }).length === 0 && (
                    <p className="text-poe-subtle text-xs">No shared passives in any category.</p>
                  )}
                  {allCats.map(cat => {
                    const section = result.passivesByCategory[cat]
                    if (!section || section.shared.length === 0) return null
                    const open = catOpen.has(cat)
                    return (
                      <div key={cat} className="border border-poe-border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleCat(cat)}
                          className="w-full flex items-center justify-between px-3 py-2 bg-poe-surface hover:bg-poe-elevated transition-colors text-sm"
                        >
                          <span className="font-medium text-poe-text">{cat}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-poe-success text-xs font-mono">+{section.shared.length}</span>
                            {open ? <ChevronUp className="w-3.5 h-3.5 text-poe-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-poe-muted" />}
                          </div>
                        </button>
                        {open && (
                          <div className="p-3 bg-poe-bg/50">
                            <PassiveList items={section.shared} empty="No shared passives" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Shared Skills */}
            {result.skills.shared.length > 0 && (
              <div className="border border-poe-border rounded-lg overflow-hidden">
                <button
                  onClick={() => setSharedSkillsOpen(!sharedSkillsOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-poe-elevated hover:bg-poe-border/30 transition-colors"
                >
                  <span className="text-sm font-medium text-poe-text">
                    <BookOpen className="w-4 h-4 inline mr-2 text-poe-gold" />
                    Shared Skills
                    <span className="text-poe-subtle text-xs ml-2 font-normal">({result.skills.shared.length})</span>
                  </span>
                  {sharedSkillsOpen ? <ChevronUp className="w-4 h-4 text-poe-muted" /> : <ChevronDown className="w-4 h-4 text-poe-muted" />}
                </button>
                {sharedSkillsOpen && (
                  <div className="p-4 space-y-4">
                    {result.skills.shared.map((skill, i) => (
                      <div key={i} className="border border-poe-border rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Check className="w-4 h-4 text-poe-success" />
                          <span className="text-sm font-medium text-poe-text">{skill.name}</span>
                          <span className="text-poe-subtle text-xs">(shared)</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div>
                            <p className="text-poe-success mb-2 font-sans text-xs font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" /> Supports in both ({skill.supports.shared.length})
                            </p>
                            {skill.supports.shared.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {skill.supports.shared.map((s, j) => (
                                  <span key={j} className="px-2 py-1 rounded bg-poe-success/10 text-poe-success border border-poe-success/20">{s}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-poe-subtle">None shared</span>
                            )}
                          </div>
                          <div>
                            <p className="text-poe-crimson-bright mb-2 font-sans text-xs font-medium">Only in A ({skill.supports.onlyA.length})</p>
                            {skill.supports.onlyA.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {skill.supports.onlyA.map((s, j) => (
                                  <span key={j} className="px-2 py-1 rounded bg-poe-crimson/10 text-red-300 border border-poe-crimson/20">{s}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-poe-subtle">None</span>
                            )}
                          </div>
                          <div>
                            <p className="text-blue-400 mb-2 font-sans text-xs font-medium">Only in B ({skill.supports.onlyB.length})</p>
                            {skill.supports.onlyB.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {skill.supports.onlyB.map((s, j) => (
                                  <span key={j} className="px-2 py-1 rounded bg-blue-900/20 text-blue-300 border border-blue-700/20">{s}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-poe-subtle">None</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* DIFFERENCES SECTION - Side by Side */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sword className="w-5 h-5 text-poe-crimson-bright" />
              <h3 className="text-poe-text font-display text-base tracking-wide">Differences</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Only in A */}
              <div className="card p-4 border-poe-crimson/30 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-poe-crimson/20 flex items-center justify-center text-xs font-bold text-red-300 border border-poe-crimson/30">A</div>
                  <h4 className="text-sm font-display text-poe-text">Only in Build A</h4>
                  <span className="text-poe-subtle text-xs">({result.summary.uniquePassivesA} passives · {result.summary.uniqueSkillsA} skills)</span>
                </div>

                {/* Unique passives by category */}
                {allCats.filter(cat => {
                  const s = result.passivesByCategory[cat]
                  return s && s.onlyA.length > 0
                }).map(cat => {
                  const section = result.passivesByCategory[cat]
                  const open = catOpen.has('a_' + cat)
                  return (
                    <div key={'a_' + cat} className="border border-poe-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCat('a_' + cat)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-poe-elevated hover:bg-poe-border/30 transition-colors text-sm"
                      >
                        <span className="font-medium text-poe-text">{cat}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-red-300 text-xs font-mono">{section.onlyA.length}</span>
                          {open ? <ChevronUp className="w-3.5 h-3.5 text-poe-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-poe-muted" />}
                        </div>
                      </button>
                      {open && (
                        <div className="p-3 bg-poe-bg/50">
                          <PassiveList items={section.onlyA} empty="None" />
                        </div>
                      )}
                    </div>
                  )
                })}
                {allCats.filter(cat => result.passivesByCategory[cat]?.onlyA.length > 0).length === 0 && (
                  <p className="text-poe-subtle text-xs">No unique passives</p>
                )}

                {/* Unique skills A */}
                {result.skills.onlyA.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-poe-muted uppercase tracking-wider">Skills</h5>
                    {result.skills.onlyA.map((s, i) => (
                      <SkillCard key={i} skill={s} icon={<Zap className="w-4 h-4 text-red-400" />} />
                    ))}
                  </div>
                )}
              </div>

              {/* Only in B */}
              <div className="card p-4 border-blue-700/30 space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-900/20 flex items-center justify-center text-xs font-bold text-blue-300 border border-blue-700/30">B</div>
                  <h4 className="text-sm font-display text-poe-text">Only in Build B</h4>
                  <span className="text-poe-subtle text-xs">({result.summary.uniquePassivesB} passives · {result.summary.uniqueSkillsB} skills)</span>
                </div>

                {/* Unique passives by category */}
                {allCats.filter(cat => {
                  const s = result.passivesByCategory[cat]
                  return s && s.onlyB.length > 0
                }).map(cat => {
                  const section = result.passivesByCategory[cat]
                  const open = catOpen.has('b_' + cat)
                  return (
                    <div key={'b_' + cat} className="border border-poe-border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleCat('b_' + cat)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-poe-elevated hover:bg-poe-border/30 transition-colors text-sm"
                      >
                        <span className="font-medium text-poe-text">{cat}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-blue-300 text-xs font-mono">{section.onlyB.length}</span>
                          {open ? <ChevronUp className="w-3.5 h-3.5 text-poe-muted" /> : <ChevronDown className="w-3.5 h-3.5 text-poe-muted" />}
                        </div>
                      </button>
                      {open && (
                        <div className="p-3 bg-poe-bg/50">
                          <PassiveList items={section.onlyB} empty="None" />
                        </div>
                      )}
                    </div>
                  )
                })}
                {allCats.filter(cat => result.passivesByCategory[cat]?.onlyB.length > 0).length === 0 && (
                  <p className="text-poe-subtle text-xs">No unique passives</p>
                )}

                {/* Unique skills B */}
                {result.skills.onlyB.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-medium text-poe-muted uppercase tracking-wider">Skills</h5>
                    {result.skills.onlyB.map((s, i) => (
                      <SkillCard key={i} skill={s} icon={<Zap className="w-4 h-4 text-blue-400" />} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
