import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: mysql.Pool;

  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    this.pool = mysql.createPool({
      host: this.configService.get<string>('database.host'),
      port: this.configService.get<number>('database.port'),
      user: this.configService.get<string>('database.user'),
      password: this.configService.get<string>('database.password'),
      database: this.configService.get<string>('database.name'),
      connectionLimit: 10,
    });

    this.logger.log('Database pool initialized');
  }

  onModuleDestroy() {
    this.pool.end((err) => {
      if (err) this.logger.error('Error closing database pool', err);
      else this.logger.log('Database pool closed');
    });
  }

  /**
   * Execute a raw SQL query and return a promise.
   */
  async query<T>(sql: string, params: any[] = []): Promise<T> {
    return new Promise((resolve, reject) => {
      this.pool.query(sql, params, (error, results) => {
        if (error) {
          this.logger.error(`Query Error: ${sql}`, error.stack);
          return reject(error);
        }
        resolve(results as T);
      });
    });
  }

  /**
   * Execute a query within a transaction.
   */
  async transaction<T>(callback: (connection: mysql.PoolConnection) => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.pool.getConnection(async (err, connection) => {
        if (err) return reject(err);

        connection.beginTransaction(async (err) => {
          if (err) {
            connection.release();
            return reject(err);
          }

          try {
            const result = await callback(connection);
            connection.commit((err) => {
              if (err) {
                return connection.rollback(() => {
                  connection.release();
                  reject(err);
                });
              }
              connection.release();
              resolve(result);
            });
          } catch (error) {
            connection.rollback(() => {
              connection.release();
              reject(error);
            });
          }
        });
      });
    });
  }

  /**
   * Promisified query for a specific connection (used in transactions)
   */
  async execute<T>(connection: mysql.PoolConnection, sql: string, params: any[] = []): Promise<T> {
    return new Promise((resolve, reject) => {
      connection.query(sql, params, (error, results) => {
        if (error) return reject(error);
        resolve(results as T);
      });
    });
  }
}
