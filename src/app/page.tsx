import { PobImportForm } from '@/components/pob-import-form';
import { RecentBuilds } from '@/components/recent-builds';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ROADMAP = [
  {
    version: 'v1.0 — MVP',
    items: [
      'Importador PoB/PoE Ninja (Base64 + Zlib + XML → JSON)',
      'Dashboard do personagem (DPS, mitigação, res cap, itens e gems)',
      'Calculadora de upgrades manual (equipado vs. desejado)',
    ],
    done: true,
  },
  {
    version: 'v1.5 — Trade & Otimizador',
    items: [
      'Busca na API oficial do Trade com base nos status faltantes',
      'Métrica de eficiência DPS/Orb',
      'Tablet & Map Analyzer com alerta de modificadores letais',
    ],
    done: false,
  },
  {
    version: 'v2.0 — Leveling & Ecossistema',
    items: [
      'Guia de atos dinâmico com checklist de passivas',
      'Localização de gems nos NPCs e gear barato de leveling',
      'Tropa Cloud: login via Discord e builds compartilhadas',
    ],
    done: false,
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="animate-fade-in text-center">
        <h1 className="heading-display text-3xl font-bold sm:text-4xl">
          TROPA <span className="text-gradient-gold">POE2</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-poe-muted sm:text-base">
          Otimização de builds, upgrades no Trade e guia de leveling em uma interface
          ultrafluida — feita para o segundo monitor.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <PobImportForm />

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Roadmap</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ROADMAP.map((phase) => (
              <div key={phase.version}>
                <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-poe-gold-dim">
                  {phase.version}
                  {phase.done ? (
                    <span className="badge-success">ativo</span>
                  ) : (
                    <span className="badge-muted">planejado</span>
                  )}
                </p>
                <ul className="space-y-1 text-xs text-poe-muted">
                  {phase.items.map((item) => (
                    <li key={item} className="flex gap-1.5">
                      <span aria-hidden>{phase.done ? '▪' : '▫'}</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="heading-display text-lg font-semibold">Builds recentes</h2>
        <RecentBuilds />
      </section>
    </div>
  );
}
