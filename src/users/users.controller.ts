import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Res,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthDTO, AuthUser } from '../../src/utils/auth/auth-decarator';
import { Response } from 'express';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/me')
  async findMe(@AuthUser() user: AuthDTO, @Res() res: Response) {
    const result = await this.usersService.findOne(user.sub);
    res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Get user successfully',
      data: result,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Patch('')
  async updateMe(
    @AuthUser() user: AuthDTO,
    @Body() updateUserDto: UpdateUserDto,
    @Res() res: Response,
  ) {
    const result = await this.usersService.update(user.sub, updateUserDto);
    res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: 'Update user successfully',
      data: result,
    });
  }
}
