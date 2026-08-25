import { NextResponse } from 'next/server';

import { resolveItemIcons } from '@/lib/poe-icons';

interface IconRequestBody {
  names?: unknown;
  bases?: unknown;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as IconRequestBody | null;

  const raw = Array.isArray(body?.names) ? body.names : body?.bases;
  if (!body || !Array.isArray(raw)) {
    return NextResponse.json(
      { error: 'Envie { names: string[] }.' },
      { status: 400 },
    );
  }

  const names = raw
    .filter((name): name is string => typeof name === 'string')
    .slice(0, 40);

  try {
    const icons = await resolveItemIcons(names);
    return NextResponse.json({ icons });
  } catch {
    return NextResponse.json(
      { error: 'Falha ao resolver ícones no poe2db.' },
      { status: 502 },
    );
  }
}
