# Ledger - Wallet Transaction Service

A robust NestJS-based wallet transaction management system with support for multiple currencies, atomic transactions, and idempotency guarantees.

## Features

- 💰 **Multi-Currency Support**: Handle transactions in EGP, USD, EUR, and SAR with automatic conversion
- 🔒 **Atomic Transactions**: MongoDB transactions ensure data consistency
- 🔄 **Idempotent Operations**: Prevent duplicate transaction processing
- ✅ **Balance Validation**: Automatic insufficient funds checking
- 🧪 **Comprehensive Testing**: Full unit test coverage for transaction logic

## Tech Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose ODM
- **Language**: TypeScript
- **Testing**: Jest
- **Validation**: class-validator

## Project Structure

```
src/
├── transactions/
│   ├── dto/
│   │   └── create-transaction.dto.ts
│   ├── schemas/
│   │   └── transaction.schema.ts
│   ├── enums/
│   │   ├── currency.ts
│   │   └── type.ts
│   ├── transactions.service.ts
│   └── transactions.service.spec.ts
├── wallets/
│   ├── dto/
│   ├── schemas/
│   │   └── wallet.schema.ts
│   └── wallets.service.ts
└── common/
    └── mongo-transactions/
        └── mongo-transactions.service.ts
```

## Installation

```bash
# Install dependencies
yarn

# Set up environment variables
cp .env.example .env
```

## Environment Variables

```env
PORT=5001
URI=mongodb://localhost:27017/ledger-dev?replicaSet=rs0
```

## Running the Application

```bash
# Development
yarn start:dev

# Production
yarn build
yarn start:prod

# Watch mode
yarn start:dev
```

## Testing

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:cov

# Run specific test file
yarn test transactions.service.spec.ts
```

## API Overview

### Transaction Types

- **Deposit**: Add funds to a wallet
- **Withdrawal**: Remove funds from a wallet (with balance validation)

### Supported Currencies

| Currency       | Code | Exchange Rate to EGP |
| -------------- | ---- | -------------------- |
| Egyptian Pound | EGP  | 1.0                  |
| US Dollar      | USD  | 48.0                 |
| Euro           | EUR  | 52.0                 |
| Saudi Riyal    | SAR  | 12.8                 |

## Core Services

### TransactionsService

Handles all transaction operations with the following features:

- **Currency Conversion**: Automatic conversion to EGP base currency
- **Balance Management**: Updates wallet balances atomically
- **Duplicate Prevention**: Checks for existing `transactionId` to ensure idempotency
- **Transaction Wrapping**: All operations run within MongoDB transactions

#### Key Methods

```typescript
async create(createTransactionDto: CreateTransactionDto): Promise<Transaction>
```

Creates a new transaction and updates the associated wallet balance.

**Parameters:**

- `wallet`: MongoDB ObjectId of the wallet
- `transactionId`: Unique identifier for idempotency
- `type`: Transaction type (deposit/withdrawal)
- `amount`: Transaction amount
- `currency`: Currency code (EGP/USD/EUR/SAR)

**Throws:**

- `BadRequestException`: If transaction already exists or insufficient funds

### WalletsService

Manages wallet operations:

```typescript
async create(createWalletDto: CreateWalletDto): Promise<Wallet>
async getOne(id: Types.ObjectId): Promise<Wallet>
async updateOne(id: Types.ObjectId, updateWalletDto: UpdateWalletDto): Promise<Wallet>
```

### MongoTransactionsService

Provides transaction management utilities:

```typescript
async runInTransaction<T>(
  fn: (session: ClientSession) => Promise<T>,
  existingSession?: ClientSession
): Promise<T>
```

## Schemas

### Transaction Schema

```typescript
{
  wallet: ObjectId (ref: Wallet),
  transactionId: string (unique),
  type: 'deposit' | 'withdrawal',
  amount: number,
  currency: 'EGP' | 'USD' | 'EUR' | 'SAR',
  createdAt: Date,
  updatedAt: Date
}
```

### Wallet Schema

```typescript
{
  userId: string (unique),
  balance: number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

## Test Coverage

The project includes comprehensive unit tests covering:

- ✅ Deposit transactions increase balance
- ✅ Withdrawal transactions decrease balance
- ✅ Insufficient funds validation
- ✅ Currency conversion accuracy
- ✅ Idempotent transaction handling (duplicate prevention)
- ✅ Concurrent transaction consistency
- ✅ Edge cases (zero amounts, balance to zero)

### Running Tests

```bash
# Run all tests
yarn test

# Run with coverage report
yarn test:cov

# Run in watch mode
yarn test:watch
```

## Example Usage

### Creating a Deposit Transaction

```typescript
const transaction = await transactionsService.create({
  wallet: new Types.ObjectId('wallet_id'),
  transactionId: 'txn_001',
  type: Type.deposit,
  amount: 100,
  currency: Currency.USD,
});

// Wallet balance increases by 4800 EGP (100 USD * 48)
```

### Creating a Withdrawal Transaction

```typescript
const transaction = await transactionsService.create({
  wallet: new Types.ObjectId('wallet_id'),
  transactionId: 'txn_002',
  type: Type.withdrawal,
  amount: 50,
  currency: Currency.EGP,
});

// Wallet balance decreases by 50 EGP
// Throws BadRequestException if insufficient funds
```

## Error Handling

The service handles various error scenarios:

- **Duplicate Transaction**: `BadRequestException: "This transaction is processed Before"`
- **Insufficient Funds**: `BadRequestException: "Insufficient funds"`
- **Unsupported Currency**: `BadRequestException: "Unsupported currency: {currency}"`
- **Wallet Not Found**: `NotFoundException: "Wallet not found"`

## Transaction Safety

All transaction operations are wrapped in MongoDB transactions to ensure:

1. **Atomicity**: All changes succeed or fail together
2. **Consistency**: Balance updates are always correct
3. **Isolation**: Concurrent transactions don't interfere
4. **Durability**: Committed transactions are permanent

## Development

### Code Style

The project uses ESLint and Prettier for code formatting:

```bash
# Lint code
yarn lint

# Format code
yarn format
```

### Project Conventions

- Use TypeScript strict mode
- Follow NestJS architectural patterns
- Write tests for all business logic
- Use DTOs for data validation
- Implement proper error handling

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Author

Youssef Al-Shazly

## Acknowledgments

- Built with [NestJS](https://nestjs.com/)
- Database: [MongoDB](https://www.mongodb.com/)
- Testing: [Jest](https://jestjs.io/)
