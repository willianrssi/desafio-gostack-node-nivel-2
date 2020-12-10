// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    if (type !== 'income' && type !== 'outcome') {
      throw new AppError(
        'Invalid type please enter with income or outcome type',
        400,
      );
    }

    if (type === 'outcome') {
      const balance = await transactionRepository.getBalance();
      if (balance.total - value < 0) {
        throw new AppError(
          'Total in balance is less than outcome operation',
          400,
        );
      }
    }
    const categoryWithSameTitle = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    let category_id;
    if (!categoryWithSameTitle) {
      const categoryCreated = categoryRepository.create({ title: category });
      await categoryRepository.save(categoryCreated);
      category_id = categoryCreated.id;
    } else {
      category_id = categoryWithSameTitle.id;
    }
    const transaction = transactionRepository.create({
      title,
      value,
      type,
      category_id,
    });

    await transactionRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
