import { CardDocument } from '../types/card';
import { isTcgPlayerIdEmpty } from './cardUtils';

export interface IndexedCard {
  card: CardDocument;
  searchString: string;
  hasEmptyTcg: boolean;
  variantCount: number;
}

/**
 * Constrói índice em memória para buscas ultra-rápidas (sub-10ms em 50.000+ cartas)
 */
export function buildCardIndex(cards: CardDocument[]): IndexedCard[] {
  const result: IndexedCard[] = new Array(cards.length);

  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const variants = Array.isArray(card.variants) ? card.variants : [];

    let hasEmptyTcg = variants.length === 0;
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
        tokens.push(String(variant.tcgplayerId).toLowerCase());
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
      variantCount: variants.length,
    };
  }

  return result;
}

/**
 * Filtra cartas pelo termo de busca e flag de TCGPlayer ID vazio
 */
export function filterIndexedCards(
  index: IndexedCard[],
  term: string,
  onlyMissingTcg: boolean,
  limit: number = 0 // 0 = sem limite
): CardDocument[] {
  const cleanTerm = term.trim().toLowerCase();
  const results: CardDocument[] = [];

  for (let i = 0; i < index.length; i++) {
    const item = index[i];

    if (onlyMissingTcg && !item.hasEmptyTcg) {
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
