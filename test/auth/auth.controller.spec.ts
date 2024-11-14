import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { LoginDto } from '../../src/auth/dto/login.dto';
describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    signIn: jest.fn(),
    googleLogin: jest.fn(),
  };

  const mockResponse = () => {
    const res: any = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a user successfully', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        avatarUrl: 'http://example.com/avatar.jpg',
        username: 'testuser',
      };
      const mockResult = { accessToken: 'mock.jwt.token' };
      mockAuthService.register.mockResolvedValue(mockResult);
      const res = mockResponse();

      await controller.register(createUserDto, res);

      expect(authService.register).toHaveBeenCalledWith(createUserDto);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.CREATED);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.CREATED,
        message: 'User has been created successfully',
        ...mockResult,
      });
    });

    it('should handle registration failure', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        avatarUrl: 'http://example.com/avatar.jpg',
        username: 'testuser',
      };
      mockAuthService.register.mockRejectedValue(
        new Error('Registration failed'),
      );
      const res = mockResponse();

      await expect(controller.register(createUserDto, res)).rejects.toThrow(
        'Registration failed',
      );
    });
  });

  describe('signIn', () => {
    it('should sign in a user successfully', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const mockResult = { accessToken: 'mock.jwt.token' };
      mockAuthService.signIn.mockResolvedValue(mockResult);
      const res = mockResponse();

      await controller.signIn(loginDto, res);

      expect(authService.signIn).toHaveBeenCalledWith(loginDto);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.OK,
        message: 'User logged in successfully',
        ...mockResult,
      });
    });

    it('should handle sign in failure', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };
      mockAuthService.signIn.mockRejectedValue(
        new Error('Invalid credentials'),
      );
      const res = mockResponse();

      await expect(controller.signIn(loginDto, res)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('googleAuth', () => {
    it('should initiate Google authentication', async () => {
      const result = await controller.googleAuth();
      expect(result).toBeNull();
    });
  });

  describe('googleAuthRedirect', () => {
    it('should handle Google authentication callback successfully', async () => {
      const mockReq = { user: { email: 'google@example.com' } };
      const mockResult = { accessToken: 'mock.google.jwt.token' };
      mockAuthService.googleLogin.mockResolvedValue(mockResult);
      const res = mockResponse();

      await controller.googleAuthRedirect(mockReq, res);

      expect(authService.googleLogin).toHaveBeenCalledWith(mockReq);
      expect(res.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.OK,
        message: 'User logged in successfully',
        ...mockResult,
      });
    });

    it('should handle Google authentication callback failure', async () => {
      const mockReq = { user: { email: 'google@example.com' } };
      mockAuthService.googleLogin.mockRejectedValue(
        new Error('Google authentication failed'),
      );
      const res = mockResponse();

      await expect(controller.googleAuthRedirect(mockReq, res)).rejects.toThrow(
        'Google authentication failed',
      );
    });
  });
});
