import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movie } from './entities/movie.entity';
import * as fs from 'fs';
import * as csv from 'csv-parser';
import * as path from 'path';

interface IntervalDetail {
  interval: number;
  previousWin: number;
  followingWin: number;
}

interface IntervalResult {
  minInterval: number;
  maxInterval: number;
  minIntervalProducers: Set<string>;
  maxIntervalProducers: Set<string>;
  intervalDetails: {
    [key: string]: IntervalDetail;
  };
}

@Injectable()
export class MovieService implements OnModuleInit {
  constructor(
    @InjectRepository(Movie)
    private movieRepository: Repository<Movie>,
  ) {}

  async onModuleInit() {
    const csvFilePath = path.join(
      __dirname,
      '..',
      '..',
      'src',
      'seed',
      'movielist.csv',
    );
    await this.importMoviesFromCSV(csvFilePath);
  }

  async importMoviesFromCSV(filePath: string): Promise<void> {
    const results: any[] = [];

    fs.createReadStream(filePath)
      .pipe(csv({ separator: ';' })) // Configura o delimitador como ';'
      .on('data', (data) => {
        // Processa a string de produtores para uma array de strings
        const producersArray = data.producers
          ? data.producers.split(',').map((producer: string) => producer.trim())
          : [];

        // Verifica o valor do 'winner' e o transforma em um booleano
        const winner =
          data.winner && data.winner.trim().toLowerCase() === 'yes';

        results.push({
          ...data,
          producers: producersArray,
          winner,
        });
      })
      .on('end', async () => {
        Logger.debug(`Imported ${results.length} movies`, 'Debug');

        for (const row of results) {
          try {
            await this.movieRepository.save({
              title: row.title,
              year: parseInt(row.year, 10),
              studios: row.studios,
              producers: row.producers,
              winner: row.winner,
            });
          } catch (error) {
            console.error('Error saving movie:', row, error);
          }
        }
      });
  }

  async getPrizeIntervals(): Promise<any> {
    const movies = await this.getOrderedMovies();
    const producerIntervals = this.groupMoviesByProducer(movies);

    const { minIntervalProducers, maxIntervalProducers, intervalDetails } =
      this.calculateIntervals(producerIntervals);

    const minIntervalResults = this.formatResults(
      minIntervalProducers,
      intervalDetails,
    );
    const maxIntervalResults = this.formatResults(
      maxIntervalProducers,
      intervalDetails,
    );

    return {
      min: minIntervalResults,
      max: maxIntervalResults,
    };
  }

  private async getOrderedMovies(): Promise<Movie[]> {
    return this.movieRepository.find({
      order: { year: 'ASC' },
    });
  }

  private groupMoviesByProducer(movies: Movie[]): Map<string, number[]> {
    const producerIntervals = new Map<string, number[]>();

    movies.forEach((movie) => {
      movie.producers.forEach((producer) => {
        if (!producerIntervals.has(producer)) {
          producerIntervals.set(producer, []);
        }
        producerIntervals.get(producer)!.push(movie.year);
      });
    });

    return producerIntervals;
  }

  private calculateIntervals(
    producerIntervals: Map<string, number[]>,
  ): IntervalResult {
    let overallMinInterval = Infinity;
    let overallMaxInterval = -Infinity;
    const minIntervalProducers = new Set<string>();
    const maxIntervalProducers = new Set<string>();
    const intervalDetails: {
      [key: string]: IntervalDetail;
    } = {};

    producerIntervals.forEach((years, producer) => {
      if (years.length < 2) {
        // Não há intervalo se o produtor tem menos de dois prêmios
        return;
      }

      // Ordenar os anos
      years.sort((a, b) => a - b);

      let producerMinInterval = Infinity;
      let producerMaxInterval = -Infinity;
      let minIntervalDetail: IntervalDetail | undefined;
      let maxIntervalDetail: IntervalDetail | undefined;

      // Calcular intervalos entre anos consecutivos
      for (let i = 0; i < years.length - 1; i++) {
        const interval = years[i + 1] - years[i];

        if (interval > 0) {
          // Filtra intervalos zero
          // Atualiza o menor intervalo para este produtor
          if (interval < producerMinInterval) {
            producerMinInterval = interval;
            minIntervalDetail = {
              interval,
              previousWin: years[i],
              followingWin: years[i + 1],
            };
          }

          // Atualiza o maior intervalo para este produtor
          if (interval > producerMaxInterval) {
            producerMaxInterval = interval;
            maxIntervalDetail = {
              interval,
              previousWin: years[i],
              followingWin: years[i + 1],
            };
          }
        }
      }

      // Atualiza o menor e maior intervalo globalmente
      if (minIntervalDetail) {
        if (producerMinInterval < overallMinInterval) {
          overallMinInterval = producerMinInterval;
          minIntervalProducers.clear();
          minIntervalProducers.add(producer);
          intervalDetails[producer] = minIntervalDetail;
        } else if (producerMinInterval === overallMinInterval) {
          minIntervalProducers.add(producer);
          intervalDetails[producer] = minIntervalDetail;
        }
      }

      if (maxIntervalDetail) {
        if (producerMaxInterval > overallMaxInterval) {
          overallMaxInterval = producerMaxInterval;
          maxIntervalProducers.clear();
          maxIntervalProducers.add(producer);
          intervalDetails[producer] = maxIntervalDetail;
        } else if (producerMaxInterval === overallMaxInterval) {
          maxIntervalProducers.add(producer);
          intervalDetails[producer] = maxIntervalDetail;
        }
      }
    });

    return {
      minInterval: overallMinInterval,
      maxInterval: overallMaxInterval,
      minIntervalProducers,
      maxIntervalProducers,
      intervalDetails,
    };
  }

  private formatResults(
    producers: Set<string>,
    intervalDetails: {
      [key: string]: {
        interval: number;
        previousWin: number;
        followingWin: number;
      };
    },
  ): any[] {
    return Array.from(producers).map((producer) => ({
      producer,
      ...intervalDetails[producer],
    }));
  }
}
