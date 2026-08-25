export type DangerLevel = 'safe' | 'caution' | 'lethal';

export interface MapRiskFlag {
  mod: string;
  level: DangerLevel;
  reason: string;
}

export interface MapEvaluation {
  danger: DangerLevel;
  flags: MapRiskFlag[];
}

interface RiskPattern {
  pattern: RegExp;
  level: Exclude<DangerLevel, 'safe'>;
  reason: string;
}

const RISK_PATTERNS: RiskPattern[] = [
  {
    pattern: /reflect/i,
    level: 'lethal',
    reason: 'Dano refletido pode eliminar builds de baixa vida em um hit.',
  },
  {
    pattern: /-\d+% maximum (fire|cold|lightning|elemental) resistance/i,
    level: 'lethal',
    reason: 'Redução de resistência máxima quebra o cap defensivo.',
  },
  {
    pattern: /less recovery( rate)? of life and energy shield|reduced recovery/i,
    level: 'lethal',
    reason: 'Regeneração/sustain reduzido — builds de tank por regen sofrem.',
  },
  {
    pattern: /monsters cannot be stunned|are hexproof|cannot be slowed/i,
    level: 'caution',
    reason: 'Controle de crowd reduzido contra pacotes densos.',
  },
  {
    pattern: /additional arrow|extra projectile|monsters fire additional projectiles/i,
    level: 'caution',
    reason: 'Volume de projéteis inimigos aumentado.',
  },
  {
    pattern: /\+?\d+% increased (monster )?(damage|attack speed|cast speed)/i,
    level: 'caution',
    reason: 'Pacotes mais rápidos e com dano ampliado.',
  },
];

export function evaluateMapMods(mods: string[]): MapEvaluation {
  const flags = mods.flatMap((mod): MapRiskFlag[] => {
    const match = RISK_PATTERNS.find((risk) => risk.pattern.test(mod));
    if (!match) return [];
    return [{ mod, level: match.level, reason: match.reason }];
  });

  const danger: DangerLevel = flags.some((f) => f.level === 'lethal')
    ? 'lethal'
    : flags.length > 0
      ? 'caution'
      : 'safe';

  return { danger, flags };
}
