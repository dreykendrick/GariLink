import sys
import re

file_path = r"C:\Users\kibaj\.gemini\antigravity\scratch\GariLink\backend\src\modules\marketplace\marketplace.module.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add imports
imports = """
import { CreateListingUseCase } from './application/use-cases/create-listing.use-case';
import { SearchListingsUseCase } from './application/use-cases/search-listings.use-case';
import { ListingController as NewListingController } from './presentation/controllers/listing.controller';
import { PrismaListingRepository } from './infrastructure/repositories/prisma-listing.repository';
"""
content = content.replace("import { Inquiry } from './domain/entities/inquiry.entity';", "import { Inquiry } from './domain/entities/inquiry.entity';\n" + imports)

# 2. Remove DTOs
content = re.sub(r'class CreateListingDto \{.*?\n\}\n*', '', content, flags=re.DOTALL)
content = re.sub(r'class UpdateListingDto \{.*?\n\}\n*', '', content, flags=re.DOTALL)
content = re.sub(r'class SearchListingsDto \{.*?\n\}\n*', '', content, flags=re.DOTALL)

# 3. Remove methods from MarketplaceService
content = re.sub(r'  async createListing\(.*?\): Promise<Result<Listing, AppError>> \{.*?^\s*\}\n', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'  async updateListing\(.*?\): Promise<Result<Listing, AppError>> \{.*?^\s*\}\n', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'  async search\(.*?\): Promise<PaginatedResult<Listing & \{ vehicle\?: unknown \}\>> \{.*?^\s*\}\n', '', content, flags=re.MULTILINE | re.DOTALL)

# 4. Rename controller and remove routes
content = content.replace('export class ListingController {', 'export class LegacyListingController {')

content = re.sub(r'  @Post\(\)\n  @ApiOperation\(\{ summary: \'Create a listing \(starts as DRAFT\)\' \}\)\n  async create\(.*?\n  \}\n', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'  @Get\(\)\n  @ApiOperation\(\{ summary: \'Search public listings\' \}\)\n  async search\(.*?\n  \}\n', '', content, flags=re.MULTILINE | re.DOTALL)
content = re.sub(r'  @Patch\(\':id\'\)\n  @ApiOperation\(\{ summary: \'Update listing details\' \}\)\n  async update\(.*?\n  \}\n', '', content, flags=re.MULTILINE | re.DOTALL)

# 5. Update Module definition
content = content.replace('controllers: [ListingController, InquiryController],', 'controllers: [NewListingController, LegacyListingController, InquiryController],')
content = content.replace('providers: [MarketplaceService],', "providers: [\n    MarketplaceService,\n    CreateListingUseCase,\n    SearchListingsUseCase,\n    { provide: 'IListingRepository', useClass: PrismaListingRepository },\n  ],")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
print("Updated marketplace.module.ts")
