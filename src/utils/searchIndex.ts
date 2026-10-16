import { CardDocument } from '../types/card';
import { isTcgPlayerIdEmpty } from './cardUtils';

export interface IndexedCard {
  card: CardDocument;
  searchString: string;
  hasEmptyTcg: boolean;
  hasDuplicateTcg: boolean;
  variantCount: number;
}

/**
 * Encontra todos os tcgplayerId que aparecem mais de uma vez em todo o conjunto de cartas
 */
export function findDuplicateTcgPlayerIds(cards: CardDocument[]): Set<string> {
  const counts = new Map<string, number>();

  for (let i = 0; i < cards.length; i++) {
    const variants = cards[i].variants;
    if (!variants || !Array.isArray(variants)) continue;

    for (let v = 0; v < variants.length; v++) {
      const raw = variants[v].tcgplayerId;
      if (raw !== null && raw !== undefined) {
        const str = String(raw).trim();
        // Não conta nulos ou vazios como duplicata entre si
        if (str && str.toLowerCase() !== 'null' && str.toLowerCase() !== 'undefined') {
          counts.set(str, (counts.get(str) || 0) + 1);
        }
      }
    }
  }

  const duplicates = new Set<string>();
  for (const [id, count] of counts.entries()) {
    if (count > 1) {
      duplicates.add(id);
    }
  }

  return duplicates;
}

/**
 * Constrói índice em memória para buscas ultra-rápidas (sub-10ms em 50.000+ cartas)
 */
export function buildCardIndex(
  cards: CardDocument[],
  duplicateTcgSet: Set<string> = new Set()
): IndexedCard[] {
  const result: IndexedCard[] = new Array(cards.length);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const variants = Array.isArray(card.variants) ? card.variants : [];

    let hasEmptyTcg = variants.length === 0;
    let hasDuplicateTcg = false;

    const tokens: string[] = [
      String(card.name || '').toLowerCase(),
      String(card.code || '').toLowerCase(),
      String(card.id || '').toLowerCase(),
      String(card._id || '').toLowerCase(),
    ];

    for (let v = 0; v < variants.length; v++) {
      const variant = variants[v];
      if (isTcgPlayerIdEmpty(variant)) {
        hasEmptyTcg = true;
      }
      if (variant.tcgplayerId) {
        const tcgStr = String(variant.tcgplayerId).trim();
        tokens.push(tcgStr.toLowerCase());

        if (duplicateTcgSet.has(tcgStr)) {
          hasDuplicateTcg = true;
        }
      }
      if (variant.variant_code) {
        tokens.push(String(variant.variant_code).toLowerCase());
      }
      if (variant.variant_external_id) {
        tokens.push(String(variant.variant_external_id).toLowerCase());
      }
      if (variant.set?.set_code) {
        tokens.push(String(variant.set.set_code).toLowerCase());
      }
      if (variant.set?.name) {
        tokens.push(String(variant.set.name).toLowerCase());
      }
    }

    result[i] = {
      card,
      searchString: tokens.join(' '),
      hasEmptyTcg,
      hasDuplicateTcg,
      variantCount: variants.length,
    };
  }

  return result;
}

/**
 * Filtra cartas pelo termo de busca, flag de TCGPlayer ID vazio e flag de TCGPlayer ID repetido
 */
export function filterIndexedCards(
  index: IndexedCard[],
  term: string,
  onlyMissingTcg: boolean,
  onlyDuplicateTcg: boolean,
  limit: number = 0 // 0 = sem limite
): CardDocument[] {
  const cleanTerm = term.trim().toLowerCase();
  const results: CardDocument[] = [];

  for (let i = 0; i < index.length; i++) {
    const item = index[i];

    if (onlyMissingTcg && !item.hasEmptyTcg) {
      continue;
    }

    if (onlyDuplicateTcg && !item.hasDuplicateTcg) {
      continue;
    }

    if (cleanTerm && !item.searchString.includes(cleanTerm)) {
      continue;
    }

    results.push(item.card);

    if (limit > 0 && results.length >= limit) {
      break;
    }
  }

  return results;
}
