/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call*/

import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

import { TransactionsService } from './transactions.service';
import { Transaction } from './schemas/transaction.schema';
import { MongoTransactionsService } from '../common/mongo-transactions/mongo-transactions.service';
import { WalletsService } from '../wallets/wallets.service';
import { Currency, Type } from './enums';
import { CreateTransactionDto } from './dto/create-transaction.dto';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let walletsService: WalletsService;

  const mockSession = {
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    abortTransaction: jest.fn(),
    endSession: jest.fn(),
  };

  beforeEach(async () => {
    const mockTransactionModel = jest.fn().mockImplementation(dto => ({
      ...dto,
      _id: new Types.ObjectId(),
      save: jest.fn().mockResolvedValue(true),
    }));

    mockTransactionModel.findOne = jest.fn().mockReturnValue({
      session: jest.fn().mockResolvedValue(null),
    });

    mockTransactionModel.populate = jest.fn().mockImplementation(doc => Promise.resolve(doc));

    const mockMongoTransactionsService = {
      runInTransaction: jest.fn().mockImplementation(callback => callback(mockSession)),
    };

    const mockWalletsService = {
      getOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: getModelToken(Transaction.name), useValue: mockTransactionModel },
        { provide: MongoTransactionsService, useValue: mockMongoTransactionsService },
        { provide: WalletsService, useValue: mockWalletsService },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    walletsService = module.get<WalletsService>(WalletsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create - Deposit Transaction', () => {
    it('should increase balance on deposit', async () => {
      const walletId = new Types.ObjectId();
      const createTransactionDto: CreateTransactionDto = {
        wallet: walletId,
        transactionId: 'txn-001',
        type: Type.deposit,
        amount: 100,
        currency: Currency.EGP,
      };

      const mockWallet = {
        _id: walletId,
        userId: 'user-123',
        balance: 500,
        save: jest.fn().mockResolvedValue(true),
      };

      (walletsService.getOne as jest.Mock).mockResolvedValue(mockWallet);

      await service.create(createTransactionDto);

      expect(mockWallet.balance).toBe(600);
      expect(mockWallet.save).toHaveBeenCalledWith({ session: mockSession });
    });

    it('should convert USD to EGP on deposit', async () => {
      const walletId = new Types.ObjectId();
      const createTransactionDto: CreateTransactionDto = {
        wallet: walletId,
        transactionId: 'txn-002',
        type: Type.deposit,
        amount: 10,
        currency: Currency.USD,
      };

      const mockWallet = {
        _id: walletId,
        userId: 'user-123',
        balance: 100,
        save: jest.fn().mockResolvedValue(true),
      };

      (walletsService.getOne as jest.Mock).mockResolvedValue(mockWallet);

      await service.create(createTransactionDto);

      expect(mockWallet.balance).toBe(580);
    });
  });

  describe('create - Withdrawal Transaction', () => {
    it('should decrease balance on withdrawal', async () => {
      const walletId = new Types.ObjectId();
      const createTransactionDto: CreateTransactionDto = {
        wallet: walletId,
        transactionId: 'txn-003',
        type: Type.withdrawal,
        amount: 200,
        currency: Currency.EGP,
      };

      const mockWallet = {
        _id: walletId,
        userId: 'user-123',
        balance: 500,
        save: jest.fn().mockResolvedValue(true),
      };

      (walletsService.getOne as jest.Mock).mockResolvedValue(mockWallet);

      await service.create(createTransactionDto);

      expect(mockWallet.balance).toBe(300);
      expect(mockWallet.save).toHaveBeenCalledWith({ session: mockSession });
    });

    it('should fail withdrawal if balance is insufficient', async () => {
      const walletId = new Types.ObjectId();
      const createTransactionDto: CreateTransactionDto = {
        wallet: walletId,
        transactionId: 'txn-004',
        type: Type.withdrawal,
        amount: 600,
        currency: Currency.EGP,
      };

      const mockWallet = {
        _id: walletId,
        userId: 'user-123',
        balance: 500,
        save: jest.fn(),
      };

      (walletsService.getOne as jest.Mock).mockResolvedValue(mockWallet);

      await expect(service.create(createTransactionDto)).rejects.toThrow(new BadRequestException('Insufficient funds'));

      expect(mockWallet.save).not.toHaveBeenCalled();
    });

    it('should fail withdrawal if converted amount exceeds balance', async () => {
      const walletId = new Types.ObjectId();
      const createTransactionDto: CreateTransactionDto = {
        wallet: walletId,
        transactionId: 'txn-005',
        type: Type.withdrawal,
        amount: 20,
        currency: Currency.USD,
      };

      const mockWallet = {
        _id: walletId,
        userId: 'user-123',
        balance: 500,
        save: jest.fn(),
      };

      (walletsService.getOne as jest.Mock).mockResolvedValue(mockWallet);

      await expect(service.create(createTransactionDto)).rejects.toThrow(new BadRequestException('Insufficient funds'));
    });
  });

  describe('create - Idempotent Transactions', () => {
    it('should reject duplicate transaction IDs', async () => {
      const walletId = new Types.ObjectId();
      const createTransactionDto: CreateTransactionDto = {
        wallet: walletId,
        transactionId: 'txn-duplicate',
        type: Type.deposit,
        amount: 100,
        currency: Currency.EGP,
      };

      const existingTransaction = {
        _id: new Types.ObjectId(),
        ...createTransactionDto,
      };

      const mockTransactionModel = service['transactionModel'];
      mockTransactionModel.findOne = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(existingTransaction),
      });

      await expect(service.create(createTransactionDto)).rejects.toThrow(
        new BadRequestException('This transaction is processed Before'),
      );
    });

    it('should not modify balance for duplicate transaction', async () => {
      const walletId = new Types.ObjectId();
      const createTransactionDto: CreateTransactionDto = {
        wallet: walletId,
        transactionId: 'txn-duplicate-2',
        type: Type.deposit,
        amount: 100,
        currency: Currency.EGP,
      };

      const existingTransaction = {
        _id: new Types.ObjectId(),
        ...createTransactionDto,
      };

      const mockWallet = {
        _id: walletId,
        userId: 'user-123',
        balance: 500,
        save: jest.fn(),
      };

      const mockTransactionModel = service['transactionModel'];
      mockTransactionModel.findOne = jest.fn().mockReturnValue({
        session: jest.fn().mockResolvedValue(existingTransaction),
      });

      (walletsService.getOne as jest.Mock).mockResolvedValue(mockWallet);

      await expect(service.create(createTransactionDto)).rejects.toThrow(
        new BadRequestException('This transaction is processed Before'),
      );

      expect(mockWallet.save).not.toHaveBeenCalled();
      expect(mockWallet.balance).toBe(500);
    });
  });

  describe('create - Concurrent Transactions', () => {
    it('should handle multiple concurrent deposits correctly', async () => {
      const walletId = new Types.ObjectId();
      const initialBalance = 1000;

      const mockWallet = {
        _id: walletId,
        userId: 'user-123',
        balance: initialBalance,
        save: jest.fn().mockResolvedValue(true),
      };

      (walletsService.getOne as jest.Mock).mockResolvedValue(mockWallet);

      await service.create({
        wallet: walletId,
        transactionId: 'txn-concurrent-1',
        type: Type.deposit,
        amount: 100,
        currency: Currency.EGP,
      });

      await service.create({
        wallet: walletId,
        transactionId: 'txn-concurrent-2',
        type: Type.deposit,
        amount: 200,
        currency: Currency.EGP,
      });

      await service.create({
        wallet: walletId,
        transactionId: 'txn-concurrent-3',
        type: Type.deposit,
        amount: 150,
        currency: Currency.EGP,
      });

      expect(mockWallet.balance).toBe(1450);
      expect(mockWallet.save).toHaveBeenCalledTimes(3);
    });

    it('should maintain consistency with mixed deposits and withdrawals', async () => {
      const walletId = new Types.ObjectId();
      const initialBalance = 1000;

      const mockWallet = {
        _id: walletId,
        userId: 'user-123',
        balance: initialBalance,
        save: jest.fn().mockResolvedValue(true),
      };

      (walletsService.getOne as jest.Mock).mockResolvedValue(mockWallet);

      await service.create({
        wallet: walletId,
        transactionId: 'txn-mix-1',
        type: Type.deposit,
        amount: 500,
        currency: Currency.EGP,
      });
      expect(mockWallet.balance).toBe(1500);

      await service.create({
        wallet: walletId,
        transactionId: 'txn-mix-2',
        type: Type.withdrawal,
        amount: 300,
        currency: Currency.EGP,
      });
      expect(mockWallet.balance).toBe(1200);

      await service.create({
        wallet: walletId,
        transactionId: 'txn-mix-3',
        type: Type.deposit,
        amount: 200,
        currency: Currency.EGP,
      });
      expect(mockWallet.balance).toBe(1400);
    });
  });

  describe('convertToEGP', () => {
    it('should return the same amount for EGP', () => {
      const result = service['convertToEGP'](100, Currency.EGP);
      expect(result).toBe(100);
    });

    it('should convert USD to EGP correctly', () => {
      const result = service['convertToEGP'](10, Currency.USD);
      expect(result).toBe(480);
    });

    it('should convert EUR to EGP correctly', () => {
      const result = service['convertToEGP'](10, Currency.EUR);
      expect(result).toBe(520);
    });

    it('should convert SAR to EGP correctly', () => {
      const result = service['convertToEGP'](10, Currency.SAR);
      expect(result).toBe(128);
    });

    it('should throw error for unsupported currency', () => {
      expect(() => {
        service['convertToEGP'](100, 'INVALID' as Currency);
      }).toThrow(BadRequestException);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero amount deposit', async () => {
      const walletId = new Types.ObjectId();
      const createTransactionDto: CreateTransactionDto = {
        wallet: walletId,
        transactionId: 'txn-zero',
        type: Type.deposit,
        amount: 0,
        currency: Currency.EGP,
      };

      const mockWallet = {
        _id: walletId,
        userId: 'user-123',
        balance: 500,
        save: jest.fn().mockResolvedValue(true),
      };

      (walletsService.getOne as jest.Mock).mockResolvedValue(mockWallet);

      await service.create(createTransactionDto);

      expect(mockWallet.balance).toBe(500);
    });

    it('should handle withdrawal that brings balance to zero', async () => {
      const walletId = new Types.ObjectId();
      const createTransactionDto: CreateTransactionDto = {
        wallet: walletId,
        transactionId: 'txn-zero-balance',
        type: Type.withdrawal,
        amount: 500,
        currency: Currency.EGP,
      };

      const mockWallet = {
        _id: walletId,
        userId: 'user-123',
        balance: 500,
        save: jest.fn().mockResolvedValue(true),
      };

      (walletsService.getOne as jest.Mock).mockResolvedValue(mockWallet);

      await service.create(createTransactionDto);

      expect(mockWallet.balance).toBe(0);
    });
  });
});
