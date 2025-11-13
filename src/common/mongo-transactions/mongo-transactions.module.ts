import { Module } from '@nestjs/common';

import { MongoTransactionsService } from './mongo-transactions.service';

@Module({ providers: [MongoTransactionsService], exports: [MongoTransactionsService] })
export class MongoTransactionsModule {}
