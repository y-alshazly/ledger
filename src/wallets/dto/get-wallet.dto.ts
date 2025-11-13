import { Expose, Transform } from 'class-transformer';
import { Types } from 'mongoose';

export class GetWalletDto {
  @Expose()
  @Transform(({ obj }: { obj: { _id: Types.ObjectId } }) => obj._id)
  _id?: string;

  @Expose()
  userId: string;

  @Expose()
  balance: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
