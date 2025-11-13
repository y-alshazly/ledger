import { Expose, Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';

import { Currency, Type as TypeEnum } from '../enums';
import { GetWalletDto } from '../../wallets/dto';

export class GetTransactionDto {
  @Expose()
  @Transform(({ obj }: { obj: { _id: Types.ObjectId } }) => obj._id)
  _id?: string;

  @Expose()
  @Type(() => GetWalletDto)
  wallet: GetWalletDto;

  @Expose()
  transactionId: string;

  @Expose()
  type: TypeEnum;

  @Expose()
  amount: number;

  @Expose()
  currency: Currency;

  @Expose()
  userId: string;

  @Expose()
  balance: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
