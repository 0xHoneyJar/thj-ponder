import type { Config } from "@ponder/core";

// Export a function to properly configure Ponder's server
export function getPonderConfig(): Partial<Config> {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 42069;
  const isRailway = !!process.env.RAILWAY_ENVIRONMENT;
  
  console.log("🔧 Ponder Configuration:");
  console.log(`   Port: ${port}`);
  console.log(`   Host: ${isRailway ? '0.0.0.0' : 'localhost'}`);
  console.log(`   Environment: ${isRailway ? 'Railway' : 'Local'}`);
  
  return {
    options: {
      port: port,
      hostname: isRailway ? '0.0.0.0' : 'localhost',
    }
  };
}