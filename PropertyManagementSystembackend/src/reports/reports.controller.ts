import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) { }

  @Get('summary')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get daily system-wide summary (Admin only)' })
  getSummary() {
    return this.reportsService.getDailySummary();
  }

  @Get('properties-performance')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get property performance metrics (Admin only)' })
  getPropertiesPerformance() {
    return this.reportsService.getPropertyPerformance();
  }

  @Get('brokers-performance')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get broker performance rankings (Admin only)' })
  getBrokersPerformance() {
    return this.reportsService.getBrokerPerformance();
  }

  @Get('customers-engagement')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get customer engagement stats (Admin only)' })
  getCustomersEngagement() {
    return this.reportsService.getCustomerEngagement();
  }
}
