import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from './categories.repository';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly repo: CategoriesRepository) {}

  list(userId: string) {
    return this.repo.listForUser(userId);
  }

  create(userId: string, dto: CreateCategoryDto) {
    return this.repo.create(userId, dto);
  }

  remove(userId: string, id: string) {
    return this.repo.delete(userId, id);
  }
}
