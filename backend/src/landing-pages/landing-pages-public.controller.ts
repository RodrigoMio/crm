import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { LandingPagesService } from './landing-pages.service';
import { CaptureLeadDto } from './dto/capture-lead.dto';

@Controller('public/lp')
export class LandingPagesPublicController {
  constructor(private readonly landingPagesService: LandingPagesService) {}

  @Get(':slug')
  findBySlug(@Param('slug') slug: string) {
    return this.landingPagesService.findPublicBySlug(slug);
  }

  @Post('capture')
  captureLead(@Body() dto: CaptureLeadDto, @Req() req: any) {
    return this.landingPagesService.captureLead(dto, req);
  }
}

