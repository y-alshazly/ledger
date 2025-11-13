import { IsOptional, IsString } from 'class-validator';
import { PopulateOptions } from 'mongoose';

export class FindOneOptionsDto {
  @IsOptional()
  @IsString()
  fields?: string;
}

export interface FindOneOptions {
  fields?: string;
  populate?: PopulateOptions[];
}
