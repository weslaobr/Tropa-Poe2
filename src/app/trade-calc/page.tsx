'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ModRow {
  uid: string;
  label: string;
  value: string;
}

interface CompareRow {
  label: string;
  equipped: number | null;
  candidate: number | null;
  delta: number | null;
  pct: number | null;
  status: 'up' | 'down' | 'flat' | 'new';
}

function newModRow(): ModRow {
  return { uid: Math.random().toString(36).slice(2, 10), label: '', value: '' };
}

function toNumber(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

function compareItems(
  equipped: ModRow[],
  candidate: ModRow[],
): CompareRow[] {
  const equippedMap = new Map(
    equipped
      .filter((row) => row.label.trim())
      .map((row) => [row.label.trim(), toNumber(row.value)]),
  );
  const candidateMap = new Map(
    candidate
      .filter((row) => row.label.trim())
      .map((row) => [row.label.trim(), toNumber(row.value)]),
  );

  const labels = [
    ...new Set([...equippedMap.keys(), ...candidateMap.keys()]),
  ];

  return labels.map((label) => {
    const a = equippedMap.get(label) ?? null;
    const b = candidateMap.get(label) ?? null;

    if (a === null && b !== null) {
      return { label, equipped: a, candidate: b, delta: b, pct: null, status: 'new' };
    }

    const delta = a !== null && b !== null ? b - a : null;
    const pct = a !== null && b !== null && a !== 0 ? ((b - a) / Math.abs(a)) * 100 : null;

    let status: CompareRow['status'] = 'flat';
    if (delta !== null && delta > 0) status = 'up';
    else if (delta !== null && delta < 0) status = 'down';

    return { label, equipped: a, candidate: b, delta, pct, status };
  });
}

interface ItemEditorProps {
  title: string;
  rows: ModRow[];
  onChange: (rows: ModRow[]) => void;
}

function ItemEditor({ title, rows, onChange }: ItemEditorProps) {
  function update(uid: string, patch: Partial<ModRow>) {
    onChange(rows.map((row) => (row.uid === uid ? { ...row, ...patch } : row)));
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Informe os atributos que deseja comparar (ex.: Vida, Res. Fogo, DPS).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((row) => (
          <div key={row.uid} className="flex items-center gap-2">
            <input
              value={row.label}
              onChange={(event) => update(row.uid, { label: event.target.value })}
              placeholder="Atributo"
              className="input-poe flex-1"
            />
            <input
              value={row.value}
              onChange={(event) => update(row.uid, { value: event.target.value })}
              placeholder="Valor"
              inputMode="decimal"
              className="input-poe w-28 text-right font-mono"
            />
            <button
              type="button"
              aria-label={`Remover ${row.label || 'linha'}`}
              onClick={() => onChange(rows.filter((r) => r.uid !== row.uid))}
              className="rounded-lg px-2 py-1 text-poe-muted transition-colors hover:bg-poe-crimson/20 hover:text-red-300"
            >
              ×
            </button>
          </div>
        ))}
        <Button variant="secondary" onClick={() => onChange([...rows, newModRow()])}>
          + Atributo
        </Button>
      </CardContent>
    </Card>
  );
}

const STATUS_STYLES = {
  up: 'text-green-400',
  down: 'text-red-400',
  flat: 'text-poe-muted',
  new: 'text-poe-gold',
} as const;

export default function TradeCalcPage() {
  const [equipped, setEquipped] = useState<ModRow[]>([
    { ...newModRow(), label: 'Vida', value: '3800' },
    { ...newModRow(), label: 'Res. Fogo', value: '55' },
  ]);
  const [candidate, setCandidate] = useState<ModRow[]>([{ ...newModRow() }]);

  const rows = useMemo(() => compareItems(equipped, candidate), [equipped, candidate]);
  const ups = rows.filter((r) => r.status === 'up').length;
  const downs = rows.filter((r) => r.status === 'down').length;

  return (
    <div className="animate-fade-in space-y-6">
      <section>
        <h1 className="heading-display text-2xl font-bold">Calculadora de Upgrades</h1>
        <p className="mt-1 max-w-2xl text-sm text-poe-muted">
          Compare o item equipado com o desejado e veja a variação percentual de cada
          atributo. Na v1.5 esta tela passa a buscar candidatos automaticamente na API do
          Trade com métrica de eficiência DPS/Orb.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ItemEditor title="Item equipado" rows={equipped} onChange={setEquipped} />
        <ItemEditor title="Item desejado" rows={candidate} onChange={setCandidate} />
      </div>

      <Card className="card-gold">
        <CardHeader className="pb-2">
          <CardTitle>Resultado da comparação</CardTitle>
          <CardDescription>
            {ups > 0 || downs > 0
              ? `${ups} melhoria(s), ${downs} queda(s).`
              : 'Preencha os dois itens para comparar.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="text-sm text-poe-subtle">
              Nenhum atributo preenchido ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] text-sm">
                <thead>
                  <tr className="border-b border-poe-border text-left text-xs uppercase tracking-wider text-poe-muted">
                    <th className="py-2 pr-3 font-medium">Atributo</th>
                    <th className="py-2 pr-3 text-right font-medium">Equipado</th>
                    <th className="py-2 pr-3 text-right font-medium">Desejado</th>
                    <th className="py-2 pr-3 text-right font-medium">Δ</th>
                    <th className="py-2 text-right font-medium">Var. %</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {rows.map((row) => (
                    <tr key={row.label} className="border-b border-poe-border/40">
                      <td className="py-2 pr-3 font-sans">{row.label}</td>
                      <td className="py-2 pr-3 text-right">
                        {row.equipped ?? '—'}
                      </td>
                      <td className="py-2 pr-3 text-right">
                        {row.candidate ?? '—'}
                      </td>
                      <td className={`py-2 pr-3 text-right ${STATUS_STYLES[row.status]}`}>
                        {row.delta === null
                          ? 'novo'
                          : `${row.delta > 0 ? '+' : ''}${row.delta}`}
                      </td>
                      <td className={`py-2 text-right ${STATUS_STYLES[row.status]}`}>
                        {row.pct === null
                          ? '—'
                          : `${row.pct > 0 ? '+' : ''}${row.pct.toFixed(1)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
