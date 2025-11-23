import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  MONGO_URI: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type Config = z.infer<typeof configSchema>;

class ConfigService {
  private static instance: ConfigService;
  public readonly env: Config;

  private constructor() {
    const result = configSchema.safeParse(process.env);
    
    if (!result.success) {
      console.error('❌ Invalid environment variables:', result.error.format());
      process.exit(1);
    }

    this.env = result.data;
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }
}

export const config = ConfigService.getInstance().env;
