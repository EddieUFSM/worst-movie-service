// test/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from '../src/movie/entities/movie.entity';
import { MovieModule } from '../src/movie/movie.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      entities: [Movie],
      synchronize: true,
    }),
    MovieModule,
  ],
})
export class AppModule {}
