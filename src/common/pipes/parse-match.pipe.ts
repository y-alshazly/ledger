import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { FilterQuery, Document } from 'mongoose';

@Injectable()
export class ParseMatchPipe<T extends Document> implements PipeTransform<string, FilterQuery<T>> {
  transform(value: string): FilterQuery<T> {
    if (!value) {
      return {};
    }

    try {
      return JSON.parse(value) as FilterQuery<T>;
    } catch {
      throw new BadRequestException('Invalid match query JSON');
    }
  }
}
