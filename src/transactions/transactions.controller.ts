import { Controller, Post, Body } from '@nestjs/common';
import { Types } from 'mongoose';

import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, GetTransactionDto } from './dto';
import { InterceptRequestBody, InterceptResponseBody } from 'src/common/interceptors';

@Controller('/v1/transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @InterceptRequestBody()
  @InterceptResponseBody(GetTransactionDto)
  @Post()
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create({
      ...createTransactionDto,
      wallet: new Types.ObjectId(createTransactionDto.wallet),
    });
  }
}
