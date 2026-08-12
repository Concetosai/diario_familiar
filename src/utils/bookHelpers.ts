import { BookEdition } from '../types';

export interface DynamicTitles {
  title: string;
  subtitle: string;
  editionLabel: string;
  protagonistsLabel: string;
  unboxingBadge: string;
}

export function getFormattedBookTitles(
  edition: BookEdition = 'doble_pareja',
  recipientName: string = 'Mamá',
  dadName: string = 'Papá'
): DynamicTitles {
  const mom = (recipientName || 'Mamá').trim();
  const dad = (dadName || 'Papá').trim();

  if (edition === 'mama') {
    return {
      title: `Historia de Vida: ${mom}`,
      subtitle: `Diario de Recuerdos, Historias y Sabiduría de Vida de ${mom}`,
      editionLabel: 'Edición Especial de Mamá',
      protagonistsLabel: mom,
      unboxingBadge: `🎁 Regalo Especial para ${mom}`,
    };
  }

  if (edition === 'papa') {
    const dadVal = (dadName || recipientName || 'Papá').trim();
    return {
      title: `Historia de Vida: ${dadVal}`,
      subtitle: `Diario de Recuerdos, Historias y Sabiduría de Vida de ${dadVal}`,
      editionLabel: 'Edición Especial de Papá',
      protagonistsLabel: dadVal,
      unboxingBadge: `🎁 Regalo Especial para ${dadVal}`,
    };
  }

  // Default: 'doble_pareja' (Familiar / Mamá y Papá)
  return {
    title: `Edición Legado Familiar: Historia de Nuestros Padres (${mom} y ${dad})`,
    subtitle: `Diario Doble de Recuerdos, Historias y Sabiduría de Vida de Nuestros Padres (${mom} y ${dad})`,
    editionLabel: 'Edición Legado Familiar (Mamá y Papá)',
    protagonistsLabel: `${mom} y ${dad}`,
    unboxingBadge: `🎁 Regalo Especial para Nuestros Padres (${mom} y ${dad})`,
  };
}
