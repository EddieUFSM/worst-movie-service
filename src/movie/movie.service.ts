import { Injectable, OnModuleInit } from '@nestjs/common';
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
      .pipe(csv({ separator: ';' })) // Configurando o delimitador como ';'
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', async () => {
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
      order: { producers: 'ASC', year: 'ASC' },
    });
  }

  private groupMoviesByProducer(movies: Movie[]): Map<string, number[]> {
    const producerIntervals = new Map<string, number[]>();

    movies.forEach((movie) => {
      if (!producerIntervals.has(movie.producers)) {
        producerIntervals.set(movie.producers, []);
      }
      producerIntervals.get(movie.producers)!.push(movie.year);
    });

    return producerIntervals;
  }

  private calculateIntervals(
    producerIntervals: Map<string, number[]>,
  ): IntervalResult {
    let minInterval = Infinity;
    let maxInterval = -Infinity;
    const minIntervalProducers = new Set<string>();
    const maxIntervalProducers = new Set<string>();
    const intervalDetails: {
      [key: string]: IntervalDetail;
    } = {};

    producerIntervals.forEach((years, producer) => {
      for (let i = 0; i < years.length - 1; i++) {
        for (let j = i + 1; j < years.length; j++) {
          const interval = years[j] - years[i];

          if (interval > 0) {
            // Filtra intervalos zero
            // Atualiza o menor intervalo
            if (interval < minInterval) {
              minInterval = interval;
              minIntervalProducers.clear();
              minIntervalProducers.add(producer);
              intervalDetails[producer] = {
                interval,
                previousWin: years[i],
                followingWin: years[j],
              };
            } else if (interval === minInterval) {
              minIntervalProducers.add(producer);
              intervalDetails[producer] = {
                interval,
                previousWin: years[i],
                followingWin: years[j],
              };
            }

            // Atualiza o maior intervalo
            if (interval > maxInterval) {
              maxInterval = interval;
              maxIntervalProducers.clear();
              maxIntervalProducers.add(producer);
              intervalDetails[producer] = {
                interval,
                previousWin: years[i],
                followingWin: years[j],
              };
            } else if (interval === maxInterval) {
              maxIntervalProducers.add(producer);
              intervalDetails[producer] = {
                interval,
                previousWin: years[i],
                followingWin: years[j],
              };
            }
          }
        }
      }
    });

    return {
      minInterval,
      maxInterval,
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
