import { Customer, Product } from '../types';

/**
 * Normalizes string by stripping accents/diacritics, trimming, and converting to lowercase.
 */
export function normalizeSearchText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Checks if a customer matches the given search query across all relevant fields:
 * Name, Phone, WhatsApp, CPF/CNPJ Document, Email, Address, City, Notes, and ID.
 * Supports accent-insensitive, multi-word, unmasked phone/document matching.
 */
export function matchCustomer(customer: Customer | null | undefined, search: string): boolean {
  if (!customer) return false;
  const rawQuery = (search || '').trim();
  if (!rawQuery) return true;

  const normQuery = normalizeSearchText(rawQuery);
  const queryWords = normQuery.split(/\s+/).filter(Boolean);
  const queryDigits = rawQuery.replace(/\D/g, '');

  const normName = normalizeSearchText(customer.name);
  const normEmail = normalizeSearchText(customer.email);
  const normAddress = normalizeSearchText(customer.address);
  const normCity = normalizeSearchText(customer.city);
  const normNotes = normalizeSearchText(customer.notes);
  const normDoc = normalizeSearchText(customer.document);
  const normPhone = normalizeSearchText(customer.phone);
  const normWhatsapp = normalizeSearchText(customer.whatsapp);
  const normId = normalizeSearchText(customer.id);

  // 1. Direct name match (starts with or contains)
  if (normName.includes(normQuery)) return true;

  // 2. Multi-word search (e.g. "joao silva" finds "Silva, João Carlos")
  const fullText = `${normName} ${normDoc} ${normPhone} ${normWhatsapp} ${normEmail} ${normAddress} ${normCity} ${normNotes} ${normId}`;
  if (queryWords.length > 0 && queryWords.every((word) => fullText.includes(word))) {
    return true;
  }

  // 3. Digit search (Phone / WhatsApp / CPF / CNPJ / ID without formatting)
  if (queryDigits.length >= 2) {
    const cleanPhone = (customer.phone || '').replace(/\D/g, '');
    const cleanWhatsapp = (customer.whatsapp || '').replace(/\D/g, '');
    const cleanDoc = (customer.document || '').replace(/\D/g, '');
    const cleanId = (customer.id || '').replace(/\D/g, '');

    if (
      cleanPhone.includes(queryDigits) ||
      cleanWhatsapp.includes(queryDigits) ||
      cleanDoc.includes(queryDigits) ||
      cleanId.includes(queryDigits)
    ) {
      return true;
    }
  }

  // 4. Formatted string search (e.g. searching "(11) 9")
  if (normPhone.includes(normQuery) || normWhatsapp.includes(normQuery) || normDoc.includes(normQuery)) {
    return true;
  }

  return false;
}

/**
 * Filters and sorts customer list with relevance priority:
 * 1. Name starts with search query
 * 2. Name contains search query
 * 3. Other fields match
 */
export function filterAndSortCustomers(
  customers: Customer[],
  search: string,
  limit: number = 30
): Customer[] {
  const rawQuery = (search || '').trim();
  if (!rawQuery) {
    // Return newest / alphabetical top list
    return [...customers]
      .sort((a, b) => {
        const dateA = a.createdAt || '';
        const dateB = b.createdAt || '';
        if (dateA && dateB && dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }
        return (a.name || '').localeCompare(b.name || '');
      })
      .slice(0, limit);
  }

  const normQuery = normalizeSearchText(rawQuery);

  return customers
    .filter((c) => matchCustomer(c, rawQuery))
    .sort((a, b) => {
      const aNorm = normalizeSearchText(a.name);
      const bNorm = normalizeSearchText(b.name);

      const aStarts = aNorm.startsWith(normQuery);
      const bStarts = bNorm.startsWith(normQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      const aContains = aNorm.includes(normQuery);
      const bContains = bNorm.includes(normQuery);
      if (aContains && !bContains) return -1;
      if (!aContains && bContains) return 1;

      return (a.name || '').localeCompare(b.name || '');
    })
    .slice(0, limit);
}
