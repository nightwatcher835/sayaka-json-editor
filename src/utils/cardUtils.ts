import { CardDocument, CardVariant } from '../types/card';

/**
 * Converte qualquer valor para string (equivalente ao texto(valor) do Python)
 */
export function toText(valor: any): string {
  if (valor === null || valor === undefined) return '';
  return String(valor);
}

/**
 * Converte string para número (float ou inteiro, lidando com vírgula)
 * Equivalente ao numero(valor, inteiro) do Python
 */
export function toNumber(valor: any, isInteger: boolean = false): number | null {
  if (valor === null || valor === undefined) return null;
  const str = String(valor).trim().replace(',', '.');
  if (!str) return null;
  const num = isInteger ? parseInt(str, 10) : parseFloat(str);
  return isNaN(num) ? null : num;
}

/**
 * Gera um ID no formato Mongo ObjectId (24 caracteres hexadecimais)
 */
export function generateObjectId(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
  return (timestamp + random).substring(0, 24);
}

/**
 * Verifica se a variante tem tcgplayerId vazio/nulo
 */
export function isTcgPlayerIdEmpty(variant?: CardVariant | null): boolean {
  if (!variant) return true;
  const val = variant.tcgplayerId;
  if (val === null || val === undefined) return true;
  const str = String(val).trim();
  return str === '' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined';
}

/**
 * Verifica se o documento possui ao menos uma variante com tcgplayerId vazio
 * (Equivalente ao filtro missing_tcgplayer_filter do Python)
 */
export function hasMissingTcgPlayerId(card: CardDocument): boolean {
  if (!card.variants || !Array.isArray(card.variants) || card.variants.length === 0) {
    return true; // Sem variantes conta como necessitando revisão
  }
  return card.variants.some((v) => isTcgPlayerIdEmpty(v));
}

/**
 * Identifica e lê a chave de 'justname' ou 'juSTname' preservando a chave original
 */
export function getJustNameKey(variant: CardVariant): 'juSTname' | 'justname' {
  if (variant && 'juSTname' in variant) {
    return 'juSTname';
  }
  return 'justname';
}

export function getJustNameValue(variant: CardVariant): string {
  if (!variant) return '';
  const key = getJustNameKey(variant);
  return toText(variant[key]);
}

/**
 * Clona profundamente um documento de carta
 */
export function cloneCard(card: CardDocument): CardDocument {
  return JSON.parse(JSON.stringify(card));
}

/**
 * Formata bytes em tamanho legível (KB, MB, GB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Normaliza um documento bruto garantindo campos mínimos necessários
 */
export function normalizeCard(raw: any, index: number = 0): CardDocument {
  const card: CardDocument = {
    _id: raw._id ? String(raw._id?.$oid || raw._id) : generateObjectId(),
    id: raw.id !== undefined && raw.id !== null ? raw.id : `CARD-${index + 1}`,
    code: raw.code !== undefined && raw.code !== null ? String(raw.code) : '',
    name: raw.name !== undefined && raw.name !== null ? String(raw.name) : 'Sem nome',
    images: {
      small: raw.images?.small || raw.image_small || raw.small_image || '',
      large: raw.images?.large || raw.image_large || raw.large_image || '',
      ...(typeof raw.images === 'object' && raw.images !== null ? raw.images : {}),
    },
    variants: Array.isArray(raw.variants)
      ? raw.variants.map((v: any) => ({
          ...v,
          set: {
            groupId: v.set?.groupId ?? null,
            set_code: v.set?.set_code ?? '',
            name: v.set?.name ?? '',
            ...(typeof v.set === 'object' && v.set !== null ? v.set : {}),
          },
          tcgplayerId: v.tcgplayerId ?? null,
          printing: v.printing ?? '',
          marketPrice: v.marketPrice !== undefined && v.marketPrice !== null ? Number(v.marketPrice) : null,
          price: v.price !== undefined && v.price !== null ? Number(v.price) : null,
          ...(v.juSTname !== undefined ? { juSTname: String(v.juSTname) } : { justname: String(v.justname || '') }),
        }))
      : [],
    // Preserva quaisquer outros campos customizados que vierem no JSON
    ...raw,
  };

  // Garante que _id seja string limpa e variants seja array
  if (typeof card._id === 'object' && (card._id as any)?.$oid) {
    card._id = (card._id as any).$oid;
  }
  if (!Array.isArray(card.variants)) {
    card.variants = [];
  }

  return card;
}
