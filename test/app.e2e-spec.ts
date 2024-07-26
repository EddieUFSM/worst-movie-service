import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './app.module'; // O caminho pode variar
import { MovieService } from '../src/movie/movie.service';

describe('Movie Integration Test', () => {
  let app: INestApplication;
  let movieService: MovieService;

  // Mock da resposta esperada
  const mockGetPrizeIntervals = jest.fn().mockResolvedValue({
    min: [
      {
        producer: 'Wyck Godfrey, Stephenie Meyer and Karen Rosenfelt',
        interval: 1,
        previousWin: 2011,
        followingWin: 2012,
      },
      {
        producer: 'Yoram Globus and Menahem Golan',
        interval: 1,
        previousWin: 1986,
        followingWin: 1987,
      },
    ],
    max: [
      {
        producer: 'Jerry Weintraub',
        interval: 18,
        previousWin: 1980,
        followingWin: 1998,
      },
    ],
  });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    movieService = moduleFixture.get<MovieService>(MovieService);

    jest
      .spyOn(movieService, 'importMoviesFromCSV')
      .mockResolvedValue(undefined);

    jest
      .spyOn(movieService, 'getPrizeIntervals')
      .mockImplementation(mockGetPrizeIntervals);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/movies/prize-intervals (GET)', async () => {
    const response = await request(app.getHttpServer())
      .get('/movies/prize-intervals')
      .expect(200);

    expect(response.body).toEqual({
      min: [
        {
          producer: 'Wyck Godfrey, Stephenie Meyer and Karen Rosenfelt',
          interval: 1,
          previousWin: 2011,
          followingWin: 2012,
        },
        {
          producer: 'Yoram Globus and Menahem Golan',
          interval: 1,
          previousWin: 1986,
          followingWin: 1987,
        },
      ],
      max: [
        {
          producer: 'Jerry Weintraub',
          interval: 18,
          previousWin: 1980,
          followingWin: 1998,
        },
      ],
    });
  });
});
