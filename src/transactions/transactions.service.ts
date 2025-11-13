import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PopulateOptions, ClientSession } from 'mongoose';

import { Transaction } from './schemas/transaction.schema';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { MongoTransactionsService } from '../common/mongo-transactions/mongo-transactions.service';
import { Currency, Type } from './enums';
import { WalletsService } from '../wallets/wallets.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction.name) private readonly transactionModel: Model<Transaction>,
    private readonly mongoTransactionsService: MongoTransactionsService,
    private readonly walletsService: WalletsService,
  ) {}

  private readonly defaultPopulate: PopulateOptions[] = [{ path: 'wallet', select: 'userId balance' }];

  async create(createTransactionDto: CreateTransactionDto, populate?: PopulateOptions[]) {
    return this.mongoTransactionsService.runInTransaction(async (session: ClientSession) => {
      const existingTransaction = await this.transactionModel
        .findOne({ transactionId: createTransactionDto.transactionId })
        .session(session);

      if (existingTransaction) {
        throw new BadRequestException('This transaction is processed Before');
      }

      const walletDoc = await this.walletsService.getOne(createTransactionDto.wallet);

      const amountInEGP = this.convertToEGP(createTransactionDto.amount, createTransactionDto.currency);

      let newBalance = walletDoc.balance;

      if (createTransactionDto.type === Type.deposit) {
        newBalance += amountInEGP;
      } else if (createTransactionDto.type === Type.withdrawal) {
        if (walletDoc.balance < amountInEGP) {
          throw new BadRequestException('Insufficient funds');
        }
        newBalance -= amountInEGP;
      }

      walletDoc.balance = newBalance;

      await walletDoc.save({ session });

      const transaction = new this.transactionModel(createTransactionDto);

      await transaction.save({ session });

      return await this.transactionModel.populate(transaction, populate ?? this.defaultPopulate);
    });
  }

  private convertToEGP(amount: number, currency: Currency): number {
    if (currency === Currency.EGP) return amount;

    const rates: Record<Currency, number> = {
      [Currency.EGP]: 1,
      [Currency.USD]: 48,
      [Currency.EUR]: 52,
      [Currency.SAR]: 12.8,
    };

    const rate = rates[currency];
    if (!rate) throw new BadRequestException(`Unsupported currency: ${currency}`);

    return amount * rate;
  }
}
