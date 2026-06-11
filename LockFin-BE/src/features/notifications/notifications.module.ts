import { Global, Module } from '@nestjs/common';
import { OneSignalService } from './onesignal.service';

/**
 * Global so any feature can inject OneSignalService to emit push without
 * re-importing a module everywhere.
 */
@Global()
@Module({
  providers: [OneSignalService],
  exports: [OneSignalService],
})
export class NotificationsModule {}
