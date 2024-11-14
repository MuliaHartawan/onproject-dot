import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../../src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: CreateUserDto): Promise<any> {
    const user = await this.usersService.findByEmail(registerDto.email);
    if (user) {
      throw new NotFoundException('Oops! user already exist');
    }
    try {
      await this.usersService.store(registerDto);
    } catch (error) {
      throw new InternalServerErrorException('Oops! something went wrong');
    }
  }

  async signIn(signInDto: LoginDto): Promise<object> {
    const user = await this.usersService.findByEmail(signInDto.email);
    if (!user) {
      throw new NotFoundException('Oops! user not found');
    }
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.fullname,
      avatar: user.avatarUrl,
      role: user.role,
    };
    return {
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    };
  }

  async googleLogin(req: any) {
    let user = await this.usersService.findOne(req.user.email);
    if (!user) {
      user = await this.usersService.store(req.user);
    }

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.fullname,
      avatar: user.avatarUrl,
      role: user.role,
    };
    return {
      accessToken: await this.jwtService.signAsync(payload, {
        expiresIn: '7d',
      }),
    };
  }
}
