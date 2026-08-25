'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { listStoredBuilds, removeBuild } from '@/lib/build-store';
import type { StoredBuild } from '@/types/poe2';

export function RecentBuilds() {
  const [builds, setBuilds] = useState<StoredBuild[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setBuilds(listStoredBuilds());
    setLoaded(true);
  }, []);

  if (!loaded) return null;

  if (builds.length === 0) {
    return (
      <p className="text-center text-sm text-poe-subtle">
        Nenhuma build salva ainda — importe seu primeiro código acima.
      </p>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {builds.map((stored) => (
        <Card key={stored.id} className="transition-colors hover:border-poe-gold/40">
          <CardHeader className="pb-2">
            <CardTitle className="truncate text-sm">
              {[stored.build.metadata.ascendClassName, stored.build.metadata.className]
                .filter(Boolean)
                .join(' ')}
            </CardTitle>
            <span className="text-xs text-poe-muted">
              Nível {stored.build.metadata.level ?? '?'} ·{' '}
              {new Date(stored.importedAt).toLocaleString('pt-BR')}
            </span>
          </CardHeader>
          <CardContent className="flex items-center gap-2 pt-1">
            <Link href={`/build/${stored.id}`} className="btn-secondary flex-1 !py-1.5 text-xs">
              Abrir dashboard
            </Link>
            <Button
              variant="ghost"
              className="!px-2 text-xs"
              onClick={() => {
                removeBuild(stored.id);
                setBuilds((current) => current.filter((b) => b.id !== stored.id));
              }}
            >
              Remover
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
