import { Controller, Get, Post, Body, Param, Query, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { SiteSlotsService } from './site-slots.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { LockSlotDto } from './dto/lock-slot.dto';
import type { AuthenticatedRequest } from '../common/types';

@ApiTags('Site Slots')
@Controller('site-slots')
export class SiteSlotsController {
  constructor(private readonly siteSlotsService: SiteSlotsService) { }

  @ApiBearerAuth()
  @Get(':propertyId/available-slots')
  @ApiOperation({ summary: 'Get available visit slots for a property on a specific date' })
  @ApiParam({ name: 'propertyId', description: 'UUID of the property' })
  @ApiQuery({ name: 'date', description: 'Date in YYYY-MM-DD format', example: '2025-04-15' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Available time slots retrieved successfully' })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: 'Missing propertyId or date' })
  async getSlots(
    @Param('propertyId') propertyId: string,
    @Query('date') date: string,
  ) {
    const data = await this.siteSlotsService.getAvailableSlots(propertyId, date);

    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }

  @Post('lock')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lock a time slot for booking' })
  @ApiResponse({ status: 201, description: 'Slot locked successfully' })
  @ApiResponse({ status: 409, description: 'Slot already locked or booked' })
  async lockSlot(
    @Body() dto: LockSlotDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const slot = await this.siteSlotsService.lockSlot(dto, req.user.id);

    return {
      success: true,
      data: slot,
      timestamp: new Date().toISOString(),
    };
  }
}
