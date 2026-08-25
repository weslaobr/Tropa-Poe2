import type { Metadata } from 'next';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Leveling Assist',
};

const PLANNED_FEATURES = [
  {
    title: 'Guia de Atos Dinâmico',
    description:
      'Checklist de passivas por nível, pontos-chave da árvore por ato e rota otimizada de campanha.',
  },
  {
    title: 'Localização de Gems',
    description:
      'Quais gems cada NPC vende em cada ato, com destaque para os links de suporte essenciais da sua build.',
  },
  {
    title: 'Gear barato de leveling',
    description:
      'Sugestões de itens brancos/mágicos com bases corretas para acelerar a campanha sem gastar orbs.',
  },
  {
    title: 'Tropa Cloud',
    description:
      'Login via Discord para salvar builds, histórico de upgrades e compartilhar comparativos com a comunidade.',
  },
];

export default function LevelingPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <section>
        <h1 className="heading-display text-2xl font-bold">Leveling Assist</h1>
        <p className="mt-1 max-w-2xl text-sm text-poe-muted">
          Módulo previsto para a <span className="badge-gold align-middle">v2.0</span> do
          roadmap. Enquanto isso, aproveite o importador PoB e a calculadora de trade.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLANNED_FEATURES.map((feature) => (
          <Card key={feature.title}>
            <CardHeader className="pb-2">
              <CardTitle className="!text-base">{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
            <CardContent className="pt-1">
              <span className="badge-muted">em planejamento</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
