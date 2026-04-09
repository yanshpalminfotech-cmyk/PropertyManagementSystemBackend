import { Controller, Post, Patch, Get, Body, Param, UseGuards, Request, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VisitRequestsService } from './visit-requests.service';
import { VisitFeedbackService } from '../visit-feedback/visit-feedback.service';
import { CreateVisitRequestDto } from './dto/create-visit-request.dto';
import { CreateVisitFeedbackDto } from '../visit-feedback/dto/create-visit-feedback.dto';
import { UpdateVisitStatusDto } from './dto/update-visit-status.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/types';

@ApiTags('Visit Requests')
@Controller('visit-requests')
export class VisitRequestsController {
  constructor(
    private readonly visitRequestsService: VisitRequestsService,
    private readonly feedbackService: VisitFeedbackService,
  ) { }

  @Post()
  @Roles(UserRole.CUSTOMER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new visit request for a property' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Visit request created successfully' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: 'Time slot already booked, requested, or locked' })
  async create(
    @Body() dto: CreateVisitRequestDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const data = await this.visitRequestsService.create(dto, req.user);

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/confirm')
  @Roles(UserRole.CUSTOMER, UserRole.BROKER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm or Cancel a visit request' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Visit request status updated successfully' })
  async confirm(
    @Param('id') id: string,
    @Body() dto: UpdateVisitStatusDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const data = await this.visitRequestsService.updateStatus(id, dto, req.user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Patch(':id/complete')
  @Roles(UserRole.BROKER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark visit as completed' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Visit marked as completed' })
  async complete(
    @Param('id') id: string,
    @Body() dto: UpdateVisitStatusDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const data = await this.visitRequestsService.updateStatus(id, dto, req.user);
    return { success: true, data, timestamp: new Date().toISOString() };
  }

  @Get('my')
  @Roles(UserRole.CUSTOMER, UserRole.BROKER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all visit requests for the current user (Customer or Broker)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of visit requests retrieved successfully' })
  async findAllMy(@Request() req: AuthenticatedRequest) {
    const data = await this.visitRequestsService.findAllMy(req.user);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Patch(':id/feedback')
  @Roles(UserRole.CUSTOMER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit feedback for a completed visit' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Feedback submitted successfully' })
  async addFeedback(
    @Param('id') id: string,
    @Body() dto: CreateVisitFeedbackDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const data = await this.feedbackService.upsertFeedback(id, dto, req.user);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
