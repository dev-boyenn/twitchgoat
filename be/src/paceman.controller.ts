import { Controller, Get, Query, Logger } from '@nestjs/common';
import { PacemanService } from './paceman.service';

interface PbResponse {
  pb: number | null;
  username: string;
  error?: string;
}

@Controller('paceman')
export class PacemanController {
  private readonly logger = new Logger(PacemanController.name);

  constructor(private readonly pacemanService: PacemanService) {}

  @Get('pb')
  async getPersonalBest(
    @Query('username') username: string,
  ): Promise<PbResponse> {
    this.logger.log(`Getting PB for ${username}`);

    if (!username) {
      return {
        pb: null,
        username: '',
        error: 'Username is required',
      };
    }

    try {
      const pb = await this.pacemanService.getPersonalBest(username);
      return {
        pb,
        username,
      };
    } catch (error) {
      this.logger.error(`Error getting PB for ${username}:`, error);
      return {
        pb: null,
        username,
        error: error.message || 'Unknown error',
      };
    }
  }
}
