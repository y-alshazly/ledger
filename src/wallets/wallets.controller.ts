import { Controller, Post, Body, Param, Patch } from '@nestjs/common';
import { Types } from 'mongoose';
import { ParseObjectIdPipe } from '@nestjs/mongoose';

import { WalletsService } from './wallets.service';
import { CreateWalletDto, UpdateWalletDto, GetWalletDto } from './dto';
import { InterceptRequestBody, InterceptResponseBody } from 'src/common/interceptors';

@Controller('/v1/wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @InterceptRequestBody()
  @InterceptResponseBody(GetWalletDto)
  @Post()
  async create(@Body() createWalletDto: CreateWalletDto) {
    return this.walletsService.create(createWalletDto);
  }

  @InterceptRequestBody()
  @InterceptResponseBody(GetWalletDto)
  @Patch(':id')
  async updateOne(@Param('id', ParseObjectIdPipe) id: Types.ObjectId, @Body() updateWalletDto: UpdateWalletDto) {
    return this.walletsService.updateOne(id, updateWalletDto);
  }
}
