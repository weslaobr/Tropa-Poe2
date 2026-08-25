'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { saveBuild } from '@/lib/build-store';
import type { ParsedBuild } from '@/types/poe2';

interface ImportResponse {
  id?: string;
  build?: ParsedBuild;
  error?: string;
}

export function PobImportForm() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim() || loading) return;

    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = (await response.json()) as ImportResponse;

      if (!response.ok || !data.id || !data.build) {
        setError(data.error ?? 'Não foi possível importar a build.');
        return;
      }

      saveBuild(code.trim(), data.build);
      router.push(`/build/${data.id}`);
    } catch {
      setError('Falha de rede ao contatar o servidor de importação.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setCode(text.trim());
    } catch {
      setError('O navegador bloqueou o acesso à área de transferência. Cole manualmente.');
    }
  }

  return (
    <Card className="card-gold animate-fade-in">
      <CardHeader>
        <CardTitle>Importar código PoB / PoE Ninja</CardTitle>
        <CardDescription>
          No Path of Building (PoE2), abra a build e use <em>Import/Export Build → Export
          code</em>. Cole o código Base64 abaixo — o parse acontece no servidor via Zlib +
          XML.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pob-code" className="label-field">
              Código de exportação
            </label>
            <textarea
              id="pob-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="eNrtXWt327ayS38_..."
              rows={6}
              spellCheck={false}
              className="input-poe resize-y font-mono text-xs leading-relaxed"
            />
          </div>

          {error && (
            <div role="alert" className="badge-danger w-full !rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={!code.trim() || loading}>
              {loading ? 'Processando…' : 'Importar build'}
            </Button>
            <Button type="button" variant="secondary" onClick={handlePaste}>
              Colar da área de transferência
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
