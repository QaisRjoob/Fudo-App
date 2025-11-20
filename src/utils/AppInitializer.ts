import DatabaseService from '../db/database';
import SeedData from '../db/seedData';
import StorageService from '../services/StorageService';

export class AppInitializer {
  private static instance: AppInitializer;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): AppInitializer {
    if (!AppInitializer.instance) {
      AppInitializer.instance = new AppInitializer();
    }
    return AppInitializer.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing Fudo App...');

      // Initialize database
      console.log('📦 Setting up database...');
      await DatabaseService.initializeDatabase();

      // Check if this is first launch
      const isFirstLaunch = !(await StorageService.getItem('app_initialized'));

      if (isFirstLaunch) {
        console.log('🌱 First launch detected, seeding database...');
        await SeedData.seed();
        await StorageService.setItem('app_initialized', 'true');
        await StorageService.setCurrentUserId('current-user');
      }

      // Set current user
      const currentUserId = await StorageService.getCurrentUserId();
      if (!currentUserId) {
        await StorageService.setCurrentUserId('current-user');
      }

      console.log('✅ App initialized successfully!');
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Error initializing app:', error);
      throw error;
    }
  }

  async reset(): Promise<void> {
    console.log('🔄 Resetting app data...');
    await SeedData.clearAndSeed();
    await StorageService.clear();
    await StorageService.setItem('app_initialized', 'true');
    await StorageService.setCurrentUserId('current-user');
    this.isInitialized = false;
    await this.initialize();
    console.log('✅ App reset complete!');
  }
}

export default AppInitializer.getInstance();
