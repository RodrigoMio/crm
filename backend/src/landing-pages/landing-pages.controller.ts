import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Query,
  Request,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LandingPagesService } from './landing-pages.service';
import { CreateLandingPageDto } from './dto/create-landing-page.dto';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';

@Controller('landing-pages')
@UseGuards(JwtAuthGuard)
export class LandingPagesController {
  constructor(private readonly landingPagesService: LandingPagesService) {}

  @Get()
  findAll(@Request() req) {
    return this.landingPagesService.findAll(req.user);
  }

  @Get('check-slug')
  checkSlug(@Query('slug') slug: string, @Query('exclude_id') excludeId?: string) {
    return this.landingPagesService.checkSlugAvailability(
      slug || '',
      excludeId ? Number(excludeId) : undefined,
    );
  }

  @Post()
  create(@Body() dto: CreateLandingPageDto, @Request() req) {
    return this.landingPagesService.create(dto, req.user);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLandingPageDto,
    @Request() req,
  ) {
    return this.landingPagesService.update(id, dto, req.user);
  }

  @Get(':id/produtos')
  getProdutos(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.landingPagesService.findProdutosByLandingPage(id, req.user);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.landingPagesService.toggleActive(id, req.user);
  }
}

