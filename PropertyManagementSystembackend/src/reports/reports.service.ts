import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import {
  DAILY_SUMMARY_QUERY,
  PROPERTY_PERFORMANCE_QUERY,
  BROKER_PERFORMANCE_QUERY,
  CUSTOMER_ENGAGEMENT_QUERY,
} from './reports.queries';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly db: DatabaseService) { }

  async getDailySummary() {
    const rows = await this.db.query<any[]>(DAILY_SUMMARY_QUERY);
    const row = rows[0];
    
    // Parse top_inquired_properties if it's a string (MySQL sometimes returns JSON as string)
    if (row && typeof row.top_inquired_properties === 'string') {
      try {
        row.top_inquired_properties = JSON.parse(row.top_inquired_properties);
      } catch (e) {
        row.top_inquired_properties = [];
      }
    }

    return row;
  }

  async getPropertyPerformance() {
    return this.db.query(PROPERTY_PERFORMANCE_QUERY);
  }

  async getBrokerPerformance() {
    return this.db.query(BROKER_PERFORMANCE_QUERY);
  }

  async getCustomerEngagement() {
    return this.db.query(CUSTOMER_ENGAGEMENT_QUERY);
  }
}
