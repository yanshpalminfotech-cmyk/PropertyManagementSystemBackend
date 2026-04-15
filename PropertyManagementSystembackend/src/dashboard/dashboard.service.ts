import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../common/database/database.service';
import { DASHBOARD_STATS_QUERY, BROKER_STATS_QUERY, CUSTOMER_STATS_QUERY } from './dashboard.queries';
import { UserRole } from '../user/entities/user.entity';
import { UserInfo } from '../common/types';

export interface IDashboardStats {
  // Admin stats
  totalProperties?: number;
  totalBrokers?: number;
  totalCustomers?: number;
  
  // Broker stats
  totalMyProperties?: number;
  pendingVisits?: number;
  confirmedVisits?: number;
  
  // Customer stats
  totalMyRequests?: number;
  completedVisits?: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly db: DatabaseService) {}

  async getStats(user: UserInfo): Promise<IDashboardStats> {
    // Return global stats for all roles as requested
    const rows = await this.db.query<IDashboardStats[]>(DASHBOARD_STATS_QUERY);
    const row = rows[0];
    
    return {
      totalProperties: Number(row?.totalProperties || 0),
      totalBrokers: Number(row?.totalBrokers || 0),
      totalCustomers: Number(row?.totalCustomers || 0),
    };
  }
}
