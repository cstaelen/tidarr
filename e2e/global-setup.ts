import { execSync } from "child_process";
import path from "path";

/**
 * Global setup for Playwright E2E tests
 * Builds the Docker image once before all tests run
 */
export default function globalSetup() {
  console.log("\n🐳 Building Tidarr production Docker image...\n");

  const projectRoot = path.resolve(__dirname, "..");

  try {
    execSync(
      "docker build -t tidarr-prod --target production -f docker/Dockerfile .",
      {
        cwd: projectRoot,
        stdio: "inherit",
      },
    );

    console.log("\n✅ Docker image built successfully!\n");
  } catch (error) {
    console.error("\n❌ Failed to build Docker image:", error);
    throw error;
  }
}
