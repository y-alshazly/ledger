import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PopulateOptions, Types } from 'mongoose';

import { Wallet } from './schemas';
import { CreateWalletDto, UpdateWalletDto } from './dto';
import { FindOneOptions } from '../common/dto/find-one-options.dto';
import { exceptions } from '../core/exceptions/constants';

@Injectable()
export class WalletsService {
  constructor(@InjectModel(Wallet.name) private walletModel: Model<Wallet>) {}

  private readonly defaultPopulate: PopulateOptions[] = [];

  async create(createWalletDto: CreateWalletDto, populate?: PopulateOptions[]) {
    const wallet = new this.walletModel(createWalletDto);

    await wallet.save();

    return await this.walletModel.populate(wallet, populate ?? this.defaultPopulate);
  }

  async getOne(id: Types.ObjectId, options?: FindOneOptions) {
    const wallet = await this.walletModel.findOne(id, options);

    if (!wallet) {
      throw new NotFoundException(exceptions.notFound.wallet);
    }

    return wallet;
  }

  async updateOne(id: Types.ObjectId, updateWalletDto: UpdateWalletDto, options?: FindOneOptions) {
    const wallet = await this.getOne(id, options);

    Object.assign(wallet, updateWalletDto);

    await wallet.save();

    await wallet.populate(options?.populate ?? this.defaultPopulate);

    return wallet;
  }
}
