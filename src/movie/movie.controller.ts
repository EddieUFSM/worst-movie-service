import { Controller, Get } from '@nestjs/common';
import { MovieService } from './movie.service';

@Controller('movies')
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get('prize-intervals')
  async getPrizeIntervals() {
    return this.movieService.getPrizeIntervals();
  }
}
