import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { Currency, Type as TransactionType } from '../enums';
import { Wallet } from '../../wallets/schemas';

export type TransactionDocument = HydratedDocument<Transaction>;

@Schema({ timestamps: true })
export class Transaction {
  @Prop({ type: Types.ObjectId, ref: Wallet.name, required: true })
  wallet: Types.ObjectId;

  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ required: true, enum: TransactionType, type: String })
  type: TransactionType;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: Currency, type: String })
  currency: Currency;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
