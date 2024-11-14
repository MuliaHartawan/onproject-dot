import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { AuthDTO } from '../../src/utils/auth/auth-decarator';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { UpdateUserDto } from '../../src/users/dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  const mockUser: AuthDTO = {
    sub: 1,
    email: 'test@example.com',
    name: 'testuser',
    avatar: 'avatar.jpg',
    role: 'admin',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findMe', () => {
    it('should return user data successfully', async () => {
      const mockUserData = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
      };

      mockUsersService.findOne.mockResolvedValue(mockUserData);

      await controller.findMe(mockUser, mockResponse as any);

      expect(usersService.findOne).toHaveBeenCalledWith(1);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.OK,
        message: 'Get user successfully',
        data: mockUserData,
      });
    });

    it('should handle errors when finding user', async () => {
      mockUsersService.findOne.mockRejectedValue(new Error('User not found'));

      await expect(
        controller.findMe(mockUser, mockResponse as any),
      ).rejects.toThrow('User not found');
    });
  });

  describe('updateMe', () => {
    it('should update user data successfully', async () => {
      const mockUpdateUserDto: UpdateUserDto = {
        fullName: 'newusername',
      };
      const mockUpdatedUser = {
        id: '1',
        username: 'testuser',
        email: 'newemail@example.com',
      };

      mockUsersService.update.mockResolvedValue(mockUpdatedUser);

      await controller.updateMe(
        mockUser,
        mockUpdateUserDto,
        mockResponse as any,
      );

      expect(usersService.update).toHaveBeenCalledWith(1, mockUpdateUserDto);
      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(mockResponse.json).toHaveBeenCalledWith({
        statusCode: HttpStatus.OK,
        message: 'Update user successfully',
        data: mockUpdatedUser,
      });
    });

    it('should handle errors when updating user', async () => {
      const mockUpdateUserDto: UpdateUserDto = { fullName: 'invalidemail' };

      mockUsersService.update.mockRejectedValue(new Error('Invalid email'));

      await expect(
        controller.updateMe(mockUser, mockUpdateUserDto, mockResponse as any),
      ).rejects.toThrow('Invalid email');
    });
  });
});
