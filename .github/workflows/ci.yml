name: CI

on:
  push:
    branches: ["main"]
  pull_request:
    branches: ["main"]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/testdb
          MAIN_HOST: localhost:3000
          AUTH_SECRET: secret
          CRON_SECRET: secret
      - run: npx tsc --noEmit
      - run: npm run test -- --run