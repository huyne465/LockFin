import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { SupabaseModule } from './core/supabase/supabase.module';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { ProfilesModule } from './features/profiles/profiles.module';
import { CategoriesModule } from './features/categories/categories.module';
import { PostsModule } from './features/posts/posts.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    SupabaseModule,
    ProfilesModule,
    CategoriesModule,
    PostsModule,
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
