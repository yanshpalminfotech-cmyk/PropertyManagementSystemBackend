import { Controller, Get, UseGuards, Request, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VisitFeedbackService } from './visit-feedback.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import type { AuthenticatedRequest } from '../common/types';

@ApiTags('Visit Feedback')
@Controller('visit-feedback')
export class VisitFeedbackController {
  constructor(private readonly feedbackService: VisitFeedbackService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BROKER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'List all visit feedback (Admin: all properties, Broker: own properties)',
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Feedback list retrieved successfully' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: 'Customers are not allowed' })
  async findAll(@Request() req: AuthenticatedRequest) {
    return this.feedbackService.findAll(req.user);
  }

  @Get('property/:id')
  @Roles(UserRole.ADMIN, UserRole.BROKER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get feedback history for a specific property' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Feedback list retrieved successfully' })
  async findByProperty(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest
  ) {
    return this.feedbackService.findByProperty(id, req.user);
  }

}

