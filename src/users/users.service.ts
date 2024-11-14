import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../src/models/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async findOne(id: number): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | undefined> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async store(user: CreateUserDto): Promise<User> {
    user.password = user.password ? await bcrypt.hash(user.password, 10) : null;
    return this.usersRepository.save(user);
  }

  async update(id: number, user: Partial<User>): Promise<User> {
    try {
      if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
      }
      return await this.usersRepository.save({ id, ...user });
    } catch (error) {
      throw new InternalServerErrorException('Oops! something went wrong');
    }
  }
}
