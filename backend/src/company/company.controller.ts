import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { IsArray, IsOptional, IsString, IsUrl, Matches, MinLength } from 'class-validator';
import { CompanyService } from './company.service';

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'slug must be lowercase alphanumeric with dashes' })
  slug!: string;

  @IsArray()
  @IsString({ each: true })
  allowedDomains!: string[];

  @IsOptional()
  @IsUrl({ require_protocol: true })
  logoUrl?: string;
}

@Controller('companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  @Get()
  list() {
    return this.companyService.list();
  }

  @Get(':slug')
  async getBySlug(@Param('slug') slug: string) {
    const company = await this.companyService.findBySlug(slug);
    if (!company) throw new NotFoundException(`Company ${slug} not found`);
    return company;
  }

  @Get(':slug/pulse')
  async getPulse(@Param('slug') slug: string) {
    return this.companyService.getPulse(slug);
  }

  @Post()
  create(@Body() dto: CreateCompanyDto) {
    return this.companyService.create(dto);
  }
}