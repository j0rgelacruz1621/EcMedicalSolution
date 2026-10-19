import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const testOrderBy: Prisma.LaboratoryTestOrderByWithRelationInput[] = [
  { internalCode: 'asc' },
  { name: 'asc' },
];

@Injectable()
export class LaboratoryCatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCategories(includeInactive: boolean) {
    const activeOnly = includeInactive ? {} : { isActive: true };

    return this.prisma.laboratoryCategory.findMany({
      where: activeOnly,
      orderBy: { name: 'asc' },
      include: { tests: { where: activeOnly, orderBy: testOrderBy } },
    });
  }

  findCategoryById(id: bigint) {
    return this.prisma.laboratoryCategory.findUnique({
      where: { id },
      include: { tests: { orderBy: testOrderBy } },
    });
  }

  findCategoryByName(name: string) {
    return this.prisma.laboratoryCategory.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
  }

  createCategory(data: Prisma.LaboratoryCategoryCreateInput) {
    return this.prisma.laboratoryCategory.create({
      data,
      include: { tests: true },
    });
  }

  updateCategory(id: bigint, data: Prisma.LaboratoryCategoryUpdateInput) {
    return this.prisma.laboratoryCategory.update({
      where: { id },
      data,
      include: { tests: { orderBy: testOrderBy } },
    });
  }

  findTestById(id: bigint) {
    return this.prisma.laboratoryTest.findUnique({ where: { id } });
  }

  findTestByInternalCode(internalCode: string) {
    return this.prisma.laboratoryTest.findFirst({
      where: { internalCode: { equals: internalCode, mode: 'insensitive' } },
      select: { id: true },
    });
  }

  findTestByNameInCategory(categoryId: bigint, name: string) {
    return this.prisma.laboratoryTest.findFirst({
      where: { categoryId, name: { equals: name, mode: 'insensitive' } },
      select: { id: true },
    });
  }

  createTest(data: Prisma.LaboratoryTestUncheckedCreateInput) {
    return this.prisma.laboratoryTest.create({ data });
  }

  updateTest(id: bigint, data: Prisma.LaboratoryTestUncheckedUpdateInput) {
    return this.prisma.laboratoryTest.update({ where: { id }, data });
  }
}
