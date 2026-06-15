import { z } from "zod";
import { router, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { articles, facilities } from "../../drizzle/schema";
import { gte, eq, and, desc, sql } from "drizzle-orm";

/**
 * C4ISR Router - Command, Control, Communications, Computers, Intelligence, Surveillance, Reconnaissance
 */
export const c4isrRouter = router({
  getDashboardStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [intelCount] = await db.select({ count: sql<number>`count(*)` }).from(articles).where(gte(articles.publishedAt, since24h));
    const [criticalFacilities] = await db.select({ count: sql<number>`count(*)` }).from(facilities).where(eq(facilities.threatLevel, "critical"));

    return {
      activeMissions: 12, // Mocked
      intelAlerts24h: Number(intelCount?.count ?? 0),
      criticalInfrastructures: Number(criticalFacilities?.count ?? 0),
      commsStatus: "Optimal",
      systemHealth: "99.8%"
    };
  }),

  getLiveComms: publicProcedure.query(async () => {
    // Mocked communications feed
    return [
      { id: 1, type: "SIGINT", message: "Intercepted encrypted transmission in Sector 7G", timestamp: new Date(Date.now() - 5000).toISOString(), priority: "high" },
      { id: 2, type: "GEOINT", message: "Satellite imagery confirms troop movements at Border X", timestamp: new Date(Date.now() - 30000).toISOString(), priority: "critical" },
      { id: 3, type: "SYS", message: "External Neural Node #01 synchronization complete", timestamp: new Date(Date.now() - 60000).toISOString(), priority: "info" }
    ];
  })
});
