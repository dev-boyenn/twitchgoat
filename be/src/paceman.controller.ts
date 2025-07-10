import { Controller, Get, Query, Logger, Param } from '@nestjs/common';
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

  @Get('event/:eventId/liveruns')
  async getEventLiveRuns(@Param('eventId') eventId: string) {
    this.logger.log(`Getting live runs for event: ${eventId}`);

    if (!eventId) {
      return {
        error: 'Event ID is required',
      };
    }

    try {
      const liveRuns = await this.pacemanService.getEventLiveRuns(eventId);
      return liveRuns;
    } catch (error) {
      this.logger.error(`Error getting live runs for event ${eventId}:`, error);
      return {
        error: error.message || 'Unknown error',
      };
    }
  }
}
