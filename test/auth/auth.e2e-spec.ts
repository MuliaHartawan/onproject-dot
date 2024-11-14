import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { CreateUserDto } from '../../src/users/dto/create-user.dto';
import { LoginDto } from '../../src/auth/dto/login.dto';
import { AuthModule } from '../../src/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from '../../config/typeorm.config';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  // jest.mock('googleapis', () => {
  //   const googleApisMock = {
  //     google: {
  //       auth: {
  //         OAuth2: jest.fn().mockImplementation(() => {
  //           return {
  //             getTokenInfo: jest.fn().mockResolvedValue({
  //               email: 'test@example.com',
  //             }),
  //           };
  //         }),
  //       },
  //     },
  //   };
  //   return googleApisMock;
  // });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AuthModule, TypeOrmModule.forRoot(typeOrmConfig)],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/auth/register (POST)', () => {
    const createUserDto: CreateUserDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
      avatarUrl: 'https://example.com/avatar.jpg',
    };

    return request(app.getHttpServer())
      .post('/auth/register')
      .send(createUserDto)
      .expect(201)
      .expect((res) => {
        expect(res.body.message).toBe('User has been created successfully');
        expect(res.body.statusCode).toBe(201);
      });
  });

  it('/auth/login (POST)', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    return request(app.getHttpServer())
      .post('/auth/login')
      .send(loginDto)
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe('User logged in successfully');
        expect(res.body.statusCode).toBe(200);
        expect(res.body.accessToken).toBeDefined();
      });
  });

  it('/auth/login/google (GET)', () => {
    return request(app.getHttpServer())
      .get('/auth/login/google')
      .expect(302)
      .expect('Location', /^https:\/\/accounts\.google\.com/);
  });

  it('/auth/google/callback (GET)', () => {
    return request(app.getHttpServer())
      .get('/auth/google/callback')
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toBe('User logged in successfully');
        expect(res.body.statusCode).toBe(302);
        expect(res.body.accessToken).toBeDefined();
      });
  });
});
