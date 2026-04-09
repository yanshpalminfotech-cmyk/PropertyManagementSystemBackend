import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PropertiesService } from './properties.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UpdatePropertyAvailabilityDto } from './dto/update-property-availability.dto';
import { PropertyQueryDto } from './dto/property-query.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../user/entities/user.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedRequest } from '../common/types';

@ApiTags('Properties')
@Controller('properties')
@UseInterceptors(ClassSerializerInterceptor)
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) { }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BROKER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new property listing' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Property created successfully' })
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.propertiesService.create(createPropertyDto, req.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all properties with filtering and pagination' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paginated list of properties. Default page size: 10, max: 100.',
    schema: {
      example: {
        items: [],
        total: 0,
        page: 1,
        lastPage: 1,
      },
    },
  })
  @ApiBearerAuth()
  async findAll(
    @Query() query: PropertyQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.propertiesService.findAll(query, req.user);
  }

  @Get('my')
  @Roles(UserRole.BROKER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get currently logged in broker's properties" })
  async findMyProperties(
    @Query() query: PropertyQueryDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.propertiesService.findMyProperties(query, req.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property details by ID or Property Code' })
  @ApiBearerAuth()
  async findOne(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.propertiesService.findOne(id, req.user);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BROKER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update property listing (Owner or Admin)' })
  async update(
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.propertiesService.update(id, updatePropertyDto, req.user);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.BROKER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete property listing (Owner or Admin)' })
  async remove(
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.propertiesService.remove(id, req.user);
  }

  @Patch(':id/availability-status')
  @Roles(UserRole.ADMIN, UserRole.BROKER)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update property availability status (Owner or Admin)' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Status updated successfully' })
  async updateAvailability(
    @Param('id') id: string,
    @Body() dto: UpdatePropertyAvailabilityDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.propertiesService.updateAvailabilityStatus(id, dto, req.user);
  }
}
