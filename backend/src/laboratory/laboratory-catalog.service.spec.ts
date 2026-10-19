import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LaboratoryCatalogService } from './laboratory-catalog.service';

describe('LaboratoryCatalogService', () => {
  let service: LaboratoryCatalogService;
  let repository: Record<string, jest.Mock>;

  const date = new Date('2026-10-01T00:00:00.000Z');
  const test = {
    id: 3n,
    categoryId: 1n,
    internalCode: 'HEM-01',
    name: 'Hematología Completa',
    loincCode: null,
    isActive: true,
    createdAt: date,
    updatedAt: date,
  };
  const category = {
    id: 1n,
    name: 'Hematología',
    description: null,
    isActive: true,
    createdAt: date,
    updatedAt: date,
    tests: [test],
  };

  beforeEach(() => {
    repository = {
      findCategories: jest.fn().mockResolvedValue([category]),
      findCategoryById: jest.fn().mockResolvedValue(category),
      findCategoryByName: jest.fn().mockResolvedValue(null),
      createCategory: jest.fn().mockResolvedValue({ ...category, tests: [] }),
      updateCategory: jest.fn().mockResolvedValue(category),
      findTestById: jest.fn().mockResolvedValue(test),
      findTestByInternalCode: jest.fn().mockResolvedValue(null),
      findTestByNameInCategory: jest.fn().mockResolvedValue(null),
      createTest: jest.fn().mockResolvedValue(test),
      updateTest: jest.fn().mockResolvedValue(test),
    };
    service = new LaboratoryCatalogService(repository as never);
  });

  it('lists active categories with nested tests by default', async () => {
    const result = await service.findCategories({});

    expect(repository.findCategories).toHaveBeenCalledWith(false);
    expect(result).toEqual([
      {
        category_id: 1,
        name: 'Hematología',
        description: null,
        is_active: true,
        tests: [
          {
            test_id: 3,
            category_id: 1,
            internal_code: 'HEM-01',
            name: 'Hematología Completa',
            loinc_code: null,
            is_active: true,
          },
        ],
      },
    ]);
  });

  it('includes inactive entries on request', async () => {
    await service.findCategories({ include_inactive: true });
    expect(repository.findCategories).toHaveBeenCalledWith(true);
  });

  it('creates a category active by default', async () => {
    await service.createCategory({ name: 'Bioquímica' });
    expect(repository.createCategory).toHaveBeenCalledWith({
      name: 'Bioquímica',
      description: null,
      isActive: true,
    });
  });

  it('rejects a duplicated category name', async () => {
    repository.findCategoryByName.mockResolvedValue({ id: 9n });
    await expect(
      service.createCategory({ name: 'hematología' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('maps a unique violation race to 409', async () => {
    repository.createCategory.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('dup', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );
    await expect(
      service.createCategory({ name: 'Bioquímica' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('allows renaming a category to its own name', async () => {
    repository.findCategoryByName.mockResolvedValue({ id: 1n });
    await service.updateCategory(1, { name: 'Hematología', is_active: false });
    expect(repository.updateCategory).toHaveBeenCalledWith(1n, {
      name: 'Hematología',
      description: undefined,
      isActive: false,
    });
  });

  it('returns 404 when updating a missing category', async () => {
    repository.findCategoryById.mockResolvedValue(null);
    await expect(
      service.updateCategory(99, { is_active: false }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a test in an existing category', async () => {
    await service.createTest({
      category_id: 1,
      name: 'Velocidad de sedimentación',
      internal_code: 'HEM-02',
    });
    expect(repository.createTest).toHaveBeenCalledWith({
      categoryId: 1n,
      internalCode: 'HEM-02',
      name: 'Velocidad de sedimentación',
      loincCode: null,
      isActive: true,
    });
  });

  it('rejects a test for a missing category', async () => {
    repository.findCategoryById.mockResolvedValue(null);
    await expect(
      service.createTest({ category_id: 99, name: 'X' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a duplicated internal_code or name in the category', async () => {
    repository.findTestByInternalCode.mockResolvedValue({ id: 8n });
    await expect(
      service.createTest({
        category_id: 1,
        name: 'X',
        internal_code: 'HEM-01',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    repository.findTestByInternalCode.mockResolvedValue(null);
    repository.findTestByNameInCategory.mockResolvedValue({ id: 8n });
    await expect(
      service.createTest({ category_id: 1, name: 'Hematología completa' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('deactivates a test and clears its code with ""', async () => {
    repository.findTestByNameInCategory.mockResolvedValue({ id: 3n });
    await service.updateTest(3, { is_active: false, internal_code: '' });
    expect(repository.updateTest).toHaveBeenCalledWith(3n, {
      categoryId: 1n,
      name: 'Hematología Completa',
      internalCode: null,
      loincCode: undefined,
      isActive: false,
    });
  });

  it('rejects an empty update body', async () => {
    await expect(service.updateTest(3, {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
