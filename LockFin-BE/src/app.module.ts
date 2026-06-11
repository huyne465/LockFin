import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseModule } from './core/supabase/supabase.module';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { ProfilesModule } from './features/profiles/profiles.module';
import { CategoriesModule } from './features/categories/categories.module';
import { PostsModule } from './features/posts/posts.module';
import { FriendsModule } from './features/friends/friends.module';
import { BudgetsModule } from './features/budgets/budgets.module';
import { AlbumsModule } from './features/albums/albums.module';
import { ReactionsModule } from './features/reactions/reactions.module';
import { NotificationsModule } from './features/notifications/notifications.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    SupabaseModule,
    NotificationsModule,
    ProfilesModule,
    CategoriesModule,
    PostsModule,
    FriendsModule,
    BudgetsModule,
    AlbumsModule,
    ReactionsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: SupabaseAuthGuard,
    },
  ],
})
export class AppModule {}
