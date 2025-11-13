import { Expose, Type } from 'class-transformer';

import { GetWalletDto } from './get-wallet.dto';

export class GetWalletsDto {
  @Type(() => GetWalletDto)
  @Expose()
  data: GetWalletDto[];

  @Expose()
  total: number;
}
