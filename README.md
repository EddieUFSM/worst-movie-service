<p align="center">Esta aplicação foi feita com o framework NestJs</p>
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

## Description

 Este é um serviço RESTful desenvolvido com [NestJs](https://github.com/nestjs/nest) para gerenciar e analisar filmes premiados pelo Golden Raspberry Awards, especificamente na categoria "Pior Filme". O objetivo principal deste aplicativo é permitir a leitura de uma lista de filmes a partir de um arquivo CSV e fornecer informações sobre os produtores e os intervalos entre os prêmios.

## Funcionalidades

### Importação de Dados:

- Ao iniciar o aplicativo, ele lê um arquivo CSV contendo dados de filmes e insere essas informações em uma base de dados SQLite em memória. O arquivo CSV deve estar localizado no diretório src/seed e deve seguir o formato especificado.

### Obtenção de Intervalos de Prêmios:

- O serviço disponibiliza um endpoint para obter informações sobre os intervalos entre prêmios dos produtores. A resposta inclui: 
  - O produtor com o maior intervalo entre dois prêmios consecutivos.
  - O produtor que obteve dois prêmios consecutivos no menor intervalo de tempo.

## Estrutura do Projeto
- src/movie/movie.service.ts: Contém a lógica de negócios para importar filmes do CSV e calcular os intervalos entre prêmios.
- src/movie/entities/movie.entity.ts: Define a entidade Movie usada para interagir com a base de dados.
- src/app.module.ts: Configura os módulos da aplicação e a conexão com a base de dados.
- test/app.e2e-spec.ts: Testes de integração que verificam o funcionamento da API.

## Endpoints
<b> GET /movies/prize-intervals: </b> Retorna os produtores e os intervalos entre prêmios, conforme calculado a partir dos dados importados.

## Instalação

```bash
$ npm install
```

## Executar a Aplicação

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

```

## Test

```bash
# unit tests
$ npm run test:integration
```

## Requisitos
- Node.js
- NPM (ou Yarn)

## License

Nest is [MIT licensed](LICENSE).
