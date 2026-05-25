import bcrypt from "bcryptjs";
import { Admin } from "./models/Admin";
import { logger } from "./lib/logger";

export async function seedAdmin() {
  try {
    const existing = await Admin.findOne({ username: "admin" });
    if (!existing) {
      const passwordHash = await bcrypt.hash("Admin@1234", 12);
      await Admin.create({ username: "admin", passwordHash });
      logger.info("Super admin seeded — username: admin, password: Admin@1234");
    }
  } catch (err) {
    logger.error({ err }, "Failed to seed admin");
  }
}
