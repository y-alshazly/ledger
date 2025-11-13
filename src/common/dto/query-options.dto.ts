import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class QueryOptionsDto {
  @IsOptional()
  @IsString()
  fields?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsNumberString()
  limit?: number;

  @IsOptional()
  @IsNumberString()
  skip?: number;

  @IsOptional()
  @IsString()
  match?: string;
}
