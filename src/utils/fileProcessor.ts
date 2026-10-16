import { CardDocument, ExportFormat, FileMetadata } from '../types/card';
import { hasMissingTcgPlayerId, normalizeCard } from './cardUtils';

/**
 * Lê e analisa arquivo JSON / JSONL com suporte a grandes arquivos
 */
export async function parseJsonFile(
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<{ cards: CardDocument[]; meta: FileMetadata }> {
  onProgress?.(10, 'Lendo arquivo do disco...');

  const text = await readFileAsText(file, (p) => {
    onProgress?.(Math.round(10 + p * 0.4), `Lendo arquivo (${Math.round(p * 100)}%)...`);
  });

  onProgress?.(55, 'Processando estrutura de dados...');

  // Defer para permitir que o navegador redesenhe
  await new Promise((r) => setTimeout(r, 10));

  let rawList: any[] = [];
  const trimmed = text.trim();

  // Verifica se é NDJSON (Newline Delimited JSON / JSON Lines)
  if (!trimmed.startsWith('[') && trimmed.includes('\n') && trimmed.startsWith('{')) {
    onProgress?.(65, 'Detectado formato JSON Lines (NDJSON/MongoDB)...');
    const lines = trimmed.split('\n');
    rawList = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      try {
        rawList.push(JSON.parse(line));
      } catch (err) {
        // Ignora linha quebrada
      }
    }
  } else {
    // Tenta JSON padrão
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (typeof parsed === 'object' && parsed !== null) {
        // Verifica chaves comuns que envolvem arrays
        if (Array.isArray(parsed.cards)) rawList = parsed.cards;
        else if (Array.isArray(parsed.data)) rawList = parsed.data;
        else if (Array.isArray(parsed.documents)) rawList = parsed.documents;
        else if (Array.isArray(parsed.items)) rawList = parsed.items;
        else if (Array.isArray(parsed.games)) rawList = parsed.games;
        else {
          // É um único objeto, transforma em array de 1 item
          rawList = [parsed];
        }
      }
    } catch (parseError: any) {
      throw new Error(`Erro ao interpretar JSON: ${parseError.message}`);
    }
  }

  onProgress?.(80, `Normalizando ${rawList.length.toLocaleString()} cartas...`);
  await new Promise((r) => setTimeout(r, 10));

  let totalVariants = 0;
  let missingTcgCount = 0;
  const cards: CardDocument[] = new Array(rawList.length);

  for (let i = 0; i < rawList.length; i++) {
    const card = normalizeCard(rawList[i], i);
    cards[i] = card;
    totalVariants += card.variants?.length || 0;
    if (hasMissingTcgPlayerId(card)) {
      missingTcgCount++;
    }
  }

  onProgress?.(100, 'Concluído com sucesso!');

  const meta: FileMetadata = {
    fileName: file.name,
    fileSizeBytes: file.size,
    totalCards: cards.length,
    totalVariants,
    missingTcgCount,
    modifiedCount: 0,
    loadedAt: new Date(),
  };

  return { cards, meta };
}

/**
 * Leitor de arquivo em chunks com suporte a progresso
 */
function readFileAsText(
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(e.loaded / e.total);
      }
    };

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(new Error('Falha ao ler o arquivo selecionado.'));
    };

    reader.readAsText(file);
  });
}

/**
 * Exporta para download em Blob sem estourar limite de string em arquivos gigantes
 */
export async function downloadCardsJson(
  cards: CardDocument[],
  format: ExportFormat,
  originalFileName: string,
  dirtyIds?: Set<string>,
  onProgress?: (percent: number) => void
): Promise<void> {
  let targetCards = cards;

  if (format === 'modified-only' && dirtyIds && dirtyIds.size > 0) {
    targetCards = cards.filter((c) => dirtyIds.has(c._id));
    if (targetCards.length === 0) {
      throw new Error('Nenhuma carta foi modificada nesta sessão.');
    }
  }

  const baseName = originalFileName.replace(/\.(json|ndjson|jsonl|txt)$/i, '');
  let finalFileName = '';
  let mimeType = 'application/json';

  const chunks: (string | Blob)[] = [];
  const total = targetCards.length;
  const chunkSize = 500; // Processa em lotes para manter a UI responsiva

  if (format === 'ndjson-mongo') {
    finalFileName = `${baseName}_mongo_export.ndjson`;
    mimeType = 'application/x-ndjson';

    for (let i = 0; i < total; i += chunkSize) {
      const slice = targetCards.slice(i, i + chunkSize);
      const lines = slice.map((c) => JSON.stringify(c)).join('\n') + '\n';
      chunks.push(lines);

      if (onProgress && total > 2000) {
        onProgress(Math.round(((i + slice.length) / total) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }
    }
  } else if (format === 'json-minified') {
    finalFileName = `${baseName}_export_min.json`;
    chunks.push('[');

    for (let i = 0; i < total; i += chunkSize) {
      const slice = targetCards.slice(i, i + chunkSize);
      const part = slice.map((c) => JSON.stringify(c)).join(',');
      chunks.push((i > 0 ? ',' : '') + part);

      if (onProgress && total > 2000) {
        onProgress(Math.round(((i + slice.length) / total) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    chunks.push(']');
  } else {
    // json-pretty ou modified-only (bonito)
    finalFileName = format === 'modified-only'
      ? `${baseName}_modificados.json`
      : `${baseName}_editado.json`;

    chunks.push('[\n');

    for (let i = 0; i < total; i += chunkSize) {
      const slice = targetCards.slice(i, i + chunkSize);
      const parts = slice.map((c) => {
        return JSON.stringify(c, null, 2)
          .split('\n')
          .map((line) => '  ' + line)
          .join('\n');
      });

      chunks.push((i > 0 ? ',\n' : '') + parts.join(',\n'));

      if (onProgress && total > 1000) {
        onProgress(Math.round(((i + slice.length) / total) * 100));
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    chunks.push('\n]');
  }

  onProgress?.(100);

  // Cria o Blob final e aciona o download
  const blob = new Blob(chunks, { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = finalFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
