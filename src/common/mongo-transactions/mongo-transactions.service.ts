import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ClientSession, Connection } from 'mongoose';

@Injectable()
export class MongoTransactionsService {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  async runInTransaction<T>(fn: (session: ClientSession) => Promise<T>, existingSession?: ClientSession): Promise<T> {
    if (existingSession) {
      return fn(existingSession);
    }

    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}
