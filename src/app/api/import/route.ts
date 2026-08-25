import { NextResponse } from 'next/server';

import { computeBuildId } from '@/lib/build-id';
import { InvalidPobCodeError, parsePobCode } from '@/lib/pob-parser';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === 'string' ? body.code : '';

  try {
    const build = parsePobCode(code);
    return NextResponse.json({ id: computeBuildId(code), build });
  } catch (error) {
    if (error instanceof InvalidPobCodeError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Erro interno ao processar o código do PoB.' },
      { status: 500 },
    );
  }
}
