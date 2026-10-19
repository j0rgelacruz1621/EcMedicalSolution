import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LaboratoryCategory, LaboratoryTest, Prisma } from '@prisma/client';
import { CreateLaboratoryCategoryDto } from './dto/create-laboratory-category.dto';
import { CreateLaboratoryTestDto } from './dto/create-laboratory-test.dto';
import { QueryLaboratoryCategoriesDto } from './dto/query-laboratory-categories.dto';
import { UpdateLaboratoryCategoryDto } from './dto/update-laboratory-category.dto';
import { UpdateLaboratoryTestDto } from './dto/update-laboratory-test.dto';
import { LaboratoryCatalogRepository } from './laboratory-catalog.repository';

export function toTestResponse(test: LaboratoryTest) {
  return {
    test_id: Number(test.id),
    category_id: Number(test.categoryId),
    internal_code: test.internalCode,
    name: test.name,
    loinc_code: test.loincCode,
    is_active: test.isActive,
  };
}

function toCategoryResponse(
  category: LaboratoryCategory & { tests: LaboratoryTest[] },
) {
  return {
    category_id: Number(category.id),
    name: category.name,
    description: category.description,
    is_active: category.isActive,
    tests: category.tests.map(toTestResponse),
  };
}

// Carrera entre la validación previa y el INSERT/UPDATE: el índice único de la
// BD es la garantía final.
function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

@Injectable()
export class LaboratoryCatalogService {
  constructor(
    private readonly catalogRepository: LaboratoryCatalogRepository,
  ) {}

  async findCategories(query: QueryLaboratoryCategoriesDto) {
    const categories = await this.catalogRepository.findCategories(
      query.include_inactive ?? false,
    );
    return categories.map(toCategoryResponse);
  }

  private async assertCategoryNameAvailable(name: string, exceptId?: bigint) {
    const existing = await this.catalogRepository.findCategoryByName(name);

    if (existing && existing.id !== exceptId) {
      throw new ConflictException(
        `A laboratory category named "${name}" already exists.`,
      );
    }
  }

  async createCategory(payload: CreateLaboratoryCategoryDto) {
    await this.assertCategoryNameAvailable(payload.name);

    try {
      const category = await this.catalogRepository.createCategory({
        name: payload.name,
        description: payload.description || null,
        isActive: payload.is_active ?? true,
      });
      return toCategoryResponse(category);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `A laboratory category named "${payload.name}" already exists.`,
        );
      }
      throw error;
    }
  }

  async updateCategory(id: number, payload: UpdateLaboratoryCategoryDto) {
    if (Object.values(payload).every((value) => value === undefined)) {
      throw new BadRequestException('No fields to update were provided.');
    }

    const category = await this.catalogRepository.findCategoryById(BigInt(id));

    if (!category) {
      throw new NotFoundException('Laboratory category not found.');
    }

    if (payload.name !== undefined) {
      await this.assertCategoryNameAvailable(payload.name, category.id);
    }

    try {
      const updated = await this.catalogRepository.updateCategory(category.id, {
        name: payload.name,
        description:
          payload.description === undefined
            ? undefined
            : payload.description || null,
        isActive: payload.is_active,
      });
      return toCategoryResponse(updated);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          `A laboratory category named "${payload.name}" already exists.`,
        );
      }
      throw error;
    }
  }

  private async assertTestIsUnique(
    categoryId: bigint,
    name: string,
    internalCode: string | null,
    exceptId?: bigint,
  ) {
    const [sameCode, sameName] = await Promise.all([
      internalCode
        ? this.catalogRepository.findTestByInternalCode(internalCode)
        : Promise.resolve(null),
      this.catalogRepository.findTestByNameInCategory(categoryId, name),
    ]);

    if (sameCode && sameCode.id !== exceptId) {
      throw new ConflictException(
        `A laboratory test with internal_code "${internalCode}" already exists.`,
      );
    }

    if (sameName && sameName.id !== exceptId) {
      throw new ConflictException(
        `The category already has a laboratory test named "${name}".`,
      );
    }
  }

  private async getCategoryOrFail(id: bigint) {
    const category = await this.catalogRepository.findCategoryById(id);

    if (!category) {
      throw new BadRequestException('The provided category_id does not exist.');
    }

    return category;
  }

  async createTest(payload: CreateLaboratoryTestDto) {
    const category = await this.getCategoryOrFail(BigInt(payload.category_id));
    const internalCode = payload.internal_code ?? null;

    await this.assertTestIsUnique(category.id, payload.name, internalCode);

    try {
      const test = await this.catalogRepository.createTest({
        categoryId: category.id,
        internalCode,
        name: payload.name,
        loincCode: payload.loinc_code ?? null,
        isActive: payload.is_active ?? true,
      });
      return toTestResponse(test);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'A laboratory test with the same internal_code or name already exists.',
        );
      }
      throw error;
    }
  }

  async updateTest(id: number, payload: UpdateLaboratoryTestDto) {
    if (Object.values(payload).every((value) => value === undefined)) {
      throw new BadRequestException('No fields to update were provided.');
    }

    const test = await this.catalogRepository.findTestById(BigInt(id));

    if (!test) {
      throw new NotFoundException('Laboratory test not found.');
    }

    const categoryId =
      payload.category_id !== undefined
        ? (await this.getCategoryOrFail(BigInt(payload.category_id))).id
        : test.categoryId;
    const name = payload.name ?? test.name;
    const internalCode =
      payload.internal_code === undefined
        ? test.internalCode
        : payload.internal_code || null;

    await this.assertTestIsUnique(categoryId, name, internalCode, test.id);

    try {
      const updated = await this.catalogRepository.updateTest(test.id, {
        categoryId,
        name,
        internalCode,
        loincCode:
          payload.loinc_code === undefined
            ? undefined
            : payload.loinc_code || null,
        isActive: payload.is_active,
      });
      return toTestResponse(updated);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictException(
          'A laboratory test with the same internal_code or name already exists.',
        );
      }
      throw error;
    }
  }
}
