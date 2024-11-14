import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../src/models/user.entity';
import { InternalServerErrorException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../../src/users/users.service';
import { CreateUserDto } from '@/users/dto/create-user.dto';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  // let userRepository: Repository<User>;

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [{ id: 1, email: 'test@example.com' }];
      mockUserRepository.find.mockResolvedValue(mockUsers);

      const result = await service.findAll();
      expect(result).toEqual(mockUsers);
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should return undefined if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(undefined);

      const result = await service.findOne(999);
      expect(result).toBeUndefined();
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = { id: 1, email: 'test@example.com' };
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return undefined if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(undefined);

      const result = await service.findByEmail('nonexistent@example.com');
      expect(result).toBeUndefined();
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
      });
    });
  });

  describe('store', () => {
    it('should create a new user with hashed password', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        fullName: 'Test User',
        avatarUrl: 'http://example.com/avatar.jpg',
      };
      const hashedPassword = 'password123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.save.mockResolvedValue({
        id: 1,
        ...createUserDto,
        password: hashedPassword,
      });

      const result = await service.store(createUserDto);
      expect(result).toEqual({
        id: 1,
        ...createUserDto,
        password: hashedPassword,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
    });

    it('should throw InternalServerErrorException if save operation fails', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        fullName: 'Test User',
        avatarUrl: 'http://example.com/avatar.jpg',
      };
      mockUserRepository.save.mockRejectedValue(
        new InternalServerErrorException('Oops! something went wrong'),
      );

      await expect(service.store(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('update', () => {
    it('should update a user with hashed password', async () => {
      const id = 1;
      const updateUserDto: Partial<User> = {
        email: 'updated@example.com',
        password: 'hashed_new_password',
      };
      const hashedPassword = 'hashed_new_password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUserRepository.save.mockResolvedValue({
        id,
        ...updateUserDto,
        password: hashedPassword,
      });

      const result = await service.update(id, updateUserDto);
      expect(result).toEqual({
        id,
        ...updateUserDto,
        password: hashedPassword,
      });
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        id,
        ...updateUserDto,
        password: hashedPassword,
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(updateUserDto.password, 10);
    });

    it('should throw InternalServerErrorException if save operation fails', async () => {
      const id = 1;
      const updateUserDto: Partial<User> = {
        email: 'updated@example.com',
        password: 'new_password',
      };
      mockUserRepository.save.mockRejectedValue(new Error('Database error'));

      await expect(service.update(id, updateUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        id,
        ...updateUserDto,
      });
    });
  });
});
