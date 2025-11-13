import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Types } from 'mongoose';

import { Currency, Type } from '../enums';

export class CreateTransactionDto {
  @IsMongoId()
  wallet: Types.ObjectId;

  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @IsEnum(Type)
  type: Type;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsEnum(Currency)
  currency: Currency;
}
