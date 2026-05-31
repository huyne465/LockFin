# 🚀 LockFin Backend - NestJS Implementation Guide for AI Agent

## 🎯 Context
You are an expert Backend Engineer. Your task is to initialize and build the backend for **LockFin**, a FinTech + Social mobile-first web app. 
The backend is built with **NestJS** and uses **Supabase (PostgreSQL)** as the database. 

Follow strict **Clean Architecture** principles. The codebase must be highly modular, separating controllers, services, and repository/database layers.

---

## 📦 1. Project Initialization & Dependencies
1. Initialize a new NestJS project: `nest new lockfin-backend --strict`
2. Install required dependencies:
   ```bash
   npm install @nestjs/config @supabase/supabase-js @nestjs/passport passport passport-jwt
   npm install class-validator class-transformer


🏗️ 2. Core Architecture & Module Structure
Generate the following modules using Nest CLI. Do not put all logic in app.module.

SupabaseModule: Global module to provide the Supabase client instance.

ProfilesModule: Handles user profile data and streak updates.

CategoriesModule: CRUD for default and user-specific categories.

PostsModule: The core module handling uploads, transactions, and feed aggregation.

Directory Structure Goal:


src/
 ├── app.module.ts
 ├── core/
 │    └── supabase/ (Supabase Provider & Client)
 ├── modules/
 │    ├── profiles/ (Controller, Service, DTOs)
 │    ├── categories/ (Controller, Service, DTOs)
 │    └── posts/ (Controller, Service, DTOs)
 └── common/
      ├── guards/ (Auth Guard verifying Supabase JWT)
      └── decorators/ (Custom decorators like @CurrentUser)




⚙️ 4. Feature Implementation Details
A. Posts & Transactions (Tab 2 - Upload)
Module: PostsModule

Endpoint: POST /posts

Payload: { category_id, photo_url, amount, note, is_private }

Logic:

Validate payload using class-validator.

Insert record into the posts table via Supabase client.

Crucial: After successful insert, call ProfilesService.updateStreak(user_id) to handle gamification logic.

B. Gamification: Streak Logic (Tab 1 - Feed)
Module: ProfilesModule -> ProfilesService

Method: updateStreak(userId: string)

Logic (Execute via SQL or Supabase RPC for atomicity):

Fetch current_streak, highest_streak, and last_post_date from profiles.

Define today and yesterday.

Rules:

If last_post_date == yesterday: current_streak += 1.

If last_post_date == today: Do nothing (streak already maintained).

If last_post_date < yesterday: current_streak = 1 (streak broken, reset).

Update highest_streak if current_streak > highest_streak.

Update last_post_date to today.

C. Statistics Aggregation (Tab 3 - Profile)
Module: PostsModule -> PostsController

Endpoint: GET /posts/stats?month=YYYY-MM

Logic: * Do NOT return raw rows.

Use Supabase RPC or raw query to run:
SELECT category_id, SUM(amount) FROM posts WHERE user_id = {id} AND DATE_TRUNC('month', created_at) = {month} GROUP BY category_id

Format the response as a clean JSON array ready for NextJS Recharts/Chart.js integration.

🚀 5. Execution Step for AI Agent
Setup the project and configure the global Supabase Module.

Implement the Auth Guard for route protection.

Generate the specific modules, starting with PostsModule and ProfilesModule.

Ensure all endpoints are documented (or use Swagger) and heavily validate DTOs.


nên chia theo feature base nhé