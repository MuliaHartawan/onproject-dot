import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import {
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthService } from '../../src/auth/auth.service';
import { UsersService } from '../../src/users/users.service';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { LoginDto } from '../../src/auth/dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  // let usersService: UsersService;
  // let jwtService: JwtService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    store: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    module.get<UsersService>(UsersService);
    module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
        fullName: 'Test User',
        avatarUrl: 'http://example.com/avatar.jpg',
      };
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.store.mockResolvedValue(undefined);

      await expect(service.register(createUserDto)).resolves.not.toThrow();
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(mockUsersService.store).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw NotFoundException if user already exists', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        fullName: 'Existing User',
        avatarUrl: 'http://example.com/avatar.jpg',
        username: 'existinguser',
      };
      mockUsersService.findByEmail.mockResolvedValue({
        id: 1,
        ...createUserDto,
      });

      await expect(service.register(createUserDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(mockUsersService.store).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if store operation fails', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        avatarUrl: 'http://example.com/avatar.jpg',
        username: 'testuser',
      };
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.store.mockRejectedValue(new Error('Database error'));

      await expect(service.register(createUserDto)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(mockUsersService.store).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('signIn', () => {
    it('should sign in a user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const user = {
        id: 1,
        email: 'test@example.com',
        fullname: 'Test User',
        avatarUrl: 'http://example.com/avatar.jpg',
        role: 'user',
      };
      const token = 'mocked.jwt.token';
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockJwtService.signAsync.mockResolvedValue(token);

      const result = await service.signIn(loginDto);

      expect(result).toEqual({ accessToken: token });
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          name: user.fullname,
          avatar: user.avatarUrl,
          role: user.role,
        },
        { expiresIn: '7d' },
      );
    });

    it('should throw NotFoundException if user is not found', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.signIn(loginDto)).rejects.toThrow(NotFoundException);
      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });
  });

  describe('googleLogin', () => {
    it('should login existing user with Google', async () => {
      const req = {
        user: {
          email: 'google@example.com',
          fullname: 'Google User',
          avatarUrl: 'http://example.com/google-avatar.jpg',
        },
      };
      const user = {
        id: 1,
        ...req.user,
        role: 'user',
      };
      const token = 'mocked.google.jwt.token';
      mockUsersService.findOne.mockResolvedValue(user);
      mockJwtService.signAsync.mockResolvedValue(token);

      const result = await service.googleLogin(req);

      expect(result).toEqual({ accessToken: token });
      expect(mockUsersService.findOne).toHaveBeenCalledWith(req.user.email);
      expect(mockUsersService.store).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          email: user.email,
          name: user.fullname,
          avatar: user.avatarUrl,
          role: user.role,
        },
        { expiresIn: '7d' },
      );
    });

    it('should create new user and login with Google', async () => {
      const req = {
        user: {
          email: 'newgoogle@example.com',
          fullname: 'New Google User',
          avatarUrl: 'http://example.com/new-google-avatar.jpg',
        },
      };
      const newUser = {
        id: 2,
        ...req.user,
        role: 'user',
      };
      const token = 'mocked.new.google.jwt.token';
      mockUsersService.findOne.mockResolvedValue(null);
      mockUsersService.store.mockResolvedValue(newUser);
      mockJwtService.signAsync.mockResolvedValue(token);

      const result = await service.googleLogin(req);

      expect(result).toEqual({ accessToken: token });
      expect(mockUsersService.findOne).toHaveBeenCalledWith(req.user.email);
      expect(mockUsersService.store).toHaveBeenCalledWith(req.user);
      expect(mockJwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: newUser.id,
          email: newUser.email,
          name: newUser.fullname,
          avatar: newUser.avatarUrl,
          role: newUser.role,
        },
        { expiresIn: '7d' },
      );
    });
  });
});
