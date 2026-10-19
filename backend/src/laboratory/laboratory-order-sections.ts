import { LaboratoryOrderWithRelations } from './laboratory-orders.repository';

export const UNCATEGORIZED_SECTION = 'Otros exámenes';

export interface LaboratoryOrderSection {
  title: string;
  tests: { name: string; code: string | null }[];
}

// Agrupa los exámenes de la orden por categoría (criterio 3.2): primero las
// categorías del catálogo en el orden en que se pidieron, y los exámenes
// personalizados dentro de la sección cuyo nombre coincide con su
// category_name; si no hay coincidencia forman su propia sección, y los que no
// tienen categoría van al final en "Otros exámenes".
export function groupOrderTestsBySection(
  order: Pick<LaboratoryOrderWithRelations, 'catalogTests' | 'customTests'>,
): LaboratoryOrderSection[] {
  const sections = new Map<string, LaboratoryOrderSection>();

  const sectionFor = (title: string) => {
    const key = title.trim().toLocaleLowerCase('es');
    let section = sections.get(key);
    if (!section) {
      section = { title: title.trim(), tests: [] };
      sections.set(key, section);
    }
    return section;
  };

  for (const item of order.catalogTests) {
    sectionFor(item.category.name).tests.push({
      name: item.test.name,
      code: item.test.internalCode,
    });
  }

  const uncategorized: LaboratoryOrderSection['tests'] = [];

  for (const item of order.customTests) {
    const test = { name: item.testName, code: null };

    if (item.categoryName?.trim()) {
      sectionFor(item.categoryName).tests.push(test);
    } else {
      uncategorized.push(test);
    }
  }

  const result = [...sections.values()];

  if (uncategorized.length > 0) {
    const existing = sections.get(
      UNCATEGORIZED_SECTION.toLocaleLowerCase('es'),
    );
    if (existing) {
      existing.tests.push(...uncategorized);
    } else {
      result.push({ title: UNCATEGORIZED_SECTION, tests: uncategorized });
    }
  }

  return result;
}
