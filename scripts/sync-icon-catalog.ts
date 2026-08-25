import { syncIconCatalog } from '../src/lib/poe-icons';

async function main(): Promise<void> {
  const result = await syncIconCatalog();

  if (result.entries === 0) {
    console.error('Sincronizacao falhou: nenhuma entrada obtida do poe2db.');
    process.exit(1);
  }

  console.log(
    `Catalogo sincronizado: ${result.entries} itens/gems coletados de ${result.pages} paginas.`,
  );
  console.log('Salvo em .cache/poe2db-catalog.json');
}

main().catch((error) => {
  console.error('Erro:', error);
  process.exit(1);
});
