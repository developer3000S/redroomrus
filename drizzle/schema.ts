import { pgTable, serial, integer, doublePrecision, varchar, text, timestamp, boolean, jsonb, bigint, index } from "drizzle-orm/pg-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: varchar("role", { length: 255, enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── News Agencies ────────────────────────────────────────────────────────────
export const newsAgencies = pgTable("news_agencies", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  country: varchar("country", { length: 100 }).notNull(),
  region: varchar("region", { length: 100 }).notNull().default("MENA"),
  website: varchar("website", { length: 500 }),
  rssFeeds: jsonb("rssFeeds").$type<string[]>(),
  apiEndpoint: varchar("apiEndpoint", { length: 500 }),
  language: varchar("language", { length: 50 }).default("en"),
  languages: jsonb("languages").$type<string[]>(),
  type: varchar("type", { length: 255, enum: ["state", "independent", "international", "digital", "broadcast", "wire"] }).default("independent"),
  bias: varchar("bias", { length: 255, enum: ["left", "center-left", "center", "center-right", "right", "state"] }).default("center"),
  reliability: integer("reliability").default(70),
  monthlyVisitors: bigint("monthlyVisitors", { mode: "number" }),
  founded: integer("founded"),
  logoUrl: varchar("logoUrl", { length: 500 }),
  description: text("description"),
  categories: jsonb("categories").$type<string[]>(),
  isActive: boolean("isActive").default(true),
  lastCrawled: timestamp("lastCrawled"),
  crawlFrequency: integer("crawlFrequency").default(30), // minutes
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_region").on(t.region),
  index("idx_country").on(t.country),
]);

export type NewsAgency = typeof newsAgencies.$inferSelect;
export type InsertNewsAgency = typeof newsAgencies.$inferInsert;

// ─── Facilities ───────────────────────────────────────────────────────────────
// Core facility registry. All fields must be sourced and verifiable.
// verificationStatus tracks whether the data has been cross-checked against
// authoritative non-Wikipedia sources (government filings, IAEA, satellite imagery, etc.)
export const facilities = pgTable("facilities", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  nameAlias: varchar("nameAlias", { length: 500 }), // comma-separated alternate names
  type: varchar("type", { length: 255, enum: [
    "data_center", "oil_gas", "nuclear", "military", "airport",
    "military_airport", "fighter", "ship",
    "embassy", "satellite", "company", "port", "power_plant",
    "refinery", "pipeline", "dam", "hospital", "government",
    "financial", "telecom", "research", "other"
  ] }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  region: varchar("region", { length: 100 }).default("MENA"),
  city: varchar("city", { length: 100 }),
  address: varchar("address", { length: 500 }),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  description: text("description"),
  operator: varchar("operator", { length: 255 }),
  owner: varchar("owner", { length: 255 }),
  capacity: varchar("capacity", { length: 100 }),
  area: varchar("area", { length: 100 }), // e.g. "450 km²", "12 hectares"
  personnel: varchar("personnel", { length: 100 }), // e.g. "~5,000 staff"
  operationalSince: varchar("operationalSince", { length: 50 }), // e.g. "1975", "March 2003"
  estimatedValue: varchar("estimatedValue", { length: 100 }), // e.g. "$4.2B", "classified"
  status: varchar("status", { length: 255, enum: ["active", "inactive", "under_construction", "decommissioned", "unknown"] }).default("active"),
  threatLevel: varchar("threatLevel", { length: 255, enum: ["low", "medium", "high", "critical"] }).default("low"),
  importance: integer("importance").default(5), // 1-10
  tags: jsonb("tags").$type<string[]>(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  externalIds: jsonb("externalIds").$type<Record<string, string>>(), // e.g. {"iaea": "IRI-001", "osm": "12345678"}
  // ─── Sourcing & Verification ──────────────────────────────────────────────
  // Primary source for this facility record
  primarySourceUrl: varchar("primarySourceUrl", { length: 1000 }),
  primarySourceName: varchar("primarySourceName", { length: 255 }),
  primarySourceType: varchar("primarySourceType", { length: 255, enum: [
    "government_filing", "iaea_report", "un_document", "satellite_imagery",
    "official_website", "regulatory_body", "academic_paper", "news_report",
    "ngo_report", "court_document", "manual_entry", "other"
  ] }).default("manual_entry"),
  verificationStatus: varchar("verificationStatus", { length: 255, enum: [
    "unverified", "pending_review", "verified", "disputed", "classified"
  ] }).default("unverified"),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: varchar("verifiedBy", { length: 255 }),
  verificationNotes: text("verificationNotes"),
  // ─── Audit Trail ─────────────────────────────────────────────────────────
  approvalStatus: varchar("approvalStatus", { length: 255, enum: [
    "draft", "pending_approval", "approved", "rejected"
  ] }).default("approved"), // existing facilities default to approved
  submittedBy: varchar("submittedBy", { length: 255 }),
  approvedBy: varchar("approvedBy", { length: 255 }),
  approvedAt: timestamp("approvedAt"),
  rejectionReason: text("rejectionReason"),
  notes: text("notes"), // internal analyst notes
  auditLog: text("auditLog"), // JSON array of {action, by, at, detail} entries
  // ─── Stats ───────────────────────────────────────────────────────────────
  lastIncident: timestamp("lastIncident"),
  newsCount: integer("newsCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_type").on(t.type),
  index("idx_country_fac").on(t.country),
  index("idx_region_fac").on(t.region),
  index("idx_fac_approval").on(t.approvalStatus),
  index("idx_fac_verification").on(t.verificationStatus),
]);

export type Facility = typeof facilities.$inferSelect;
export type InsertFacility = typeof facilities.$inferInsert;

// ─── Facility Sources ─────────────────────────────────────────────────────────
// Multi-source reference table: each facility can have multiple independent
// source citations. This supports cross-referencing and source quality scoring.
export const facilitySources = pgTable("facility_sources", {
  id: serial("id").primaryKey(),
  facilityId: integer("facilityId").notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1000 }).notNull(),
  sourceName: varchar("sourceName", { length: 255 }).notNull(),
  sourceType: varchar("sourceType", { length: 255, enum: [
    "government_filing", "iaea_report", "un_document", "satellite_imagery",
    "official_website", "regulatory_body", "academic_paper", "news_report",
    "ngo_report", "court_document", "manual_entry", "other"
  ] }).default("other"),
  // What this source confirms (comma-separated field names: "name,location,capacity")
  confirmsFields: varchar("confirmsFields", { length: 500 }),
  accessedAt: timestamp("accessedAt").defaultNow(),
  publicationDate: varchar("publicationDate", { length: 50 }),
  authorOrg: varchar("authorOrg", { length: 255 }),
  reliability: integer("reliability").default(70), // 0-100 reliability score
  notes: text("notes"),
  addedBy: varchar("addedBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_fac_src_facility").on(t.facilityId),
  index("idx_fac_src_type").on(t.sourceType),
]);

export type FacilitySource = typeof facilitySources.$inferSelect;
export type InsertFacilitySource = typeof facilitySources.$inferInsert;

// ─── Facility Candidates ──────────────────────────────────────────────────────
// Staging table for facilities discovered via online search or manual submission
// that have NOT yet been approved for the main registry.
// Approval workflow: submitted → pending_review → approved/rejected
// On approval: record is moved to facilities table and re-enrichment is triggered.
export const facilityCandidates = pgTable("facility_candidates", {
  id: serial("id").primaryKey(),
  // Proposed facility data (mirrors facilities table fields)
  name: varchar("name", { length: 255 }).notNull(),
  nameAr: varchar("nameAr", { length: 255 }),
  nameAlias: varchar("nameAlias", { length: 500 }),
  type: varchar("type", { length: 255, enum: [
    "data_center", "oil_gas", "nuclear", "military", "airport",
    "military_airport", "fighter", "ship",
    "embassy", "satellite", "company", "port", "power_plant",
    "refinery", "pipeline", "dam", "hospital", "government",
    "financial", "telecom", "research", "other"
  ] }).notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  region: varchar("region", { length: 100 }).default("MENA"),
  city: varchar("city", { length: 100 }),
  address: varchar("address", { length: 500 }),
  latitude: doublePrecision("latitude"),
  longitude: doublePrecision("longitude"),
  description: text("description"),
  operator: varchar("operator", { length: 255 }),
  owner: varchar("owner", { length: 255 }),
  capacity: varchar("capacity", { length: 100 }),
  area: varchar("area", { length: 100 }),
  personnel: varchar("personnel", { length: 100 }),
  operationalSince: varchar("operationalSince", { length: 50 }),
  estimatedValue: varchar("estimatedValue", { length: 100 }),
  status: varchar("status", { length: 255, enum: ["active", "inactive", "under_construction", "decommissioned", "unknown"] }).default("active"),
  threatLevel: varchar("threatLevel", { length: 255, enum: ["low", "medium", "high", "critical"] }).default("low"),
  importance: integer("importance").default(5),
  tags: jsonb("tags").$type<string[]>(),
  externalIds: jsonb("externalIds").$type<Record<string, string>>(),
  // ─── Source of this candidate ─────────────────────────────────────────────
  sourceUrl: varchar("sourceUrl", { length: 1000 }),
  sourceName: varchar("sourceName", { length: 255 }),
  sourceType: varchar("sourceType", { length: 255, enum: [
    "government_filing", "iaea_report", "un_document", "satellite_imagery",
    "official_website", "regulatory_body", "academic_paper", "news_report",
    "ngo_report", "court_document", "manual_entry", "other"
  ] }).default("manual_entry"),
  // ─── Discovery metadata ───────────────────────────────────────────────────
  discoveryMethod: varchar("discoveryMethod", { length: 255, enum: [
    "llm_search", "manual_entry", "rss_crawl", "import"
  ] }).default("manual_entry"),
  discoveryQuery: varchar("discoveryQuery", { length: 500 }), // search query that found this
  rawData: text("rawData"), // raw JSON from LLM/search result
  confidenceScore: doublePrecision("confidenceScore").default(0.5), // 0-1 LLM confidence
  // ─── Google Grounding validation ─────────────────────────────────────────
  groundingStatus: varchar("groundingStatus", { length: 255, enum: [
    "validated", "likely_accurate", "unverified", "disputed"
  ] }).default("unverified"),
  groundingNotes: text("groundingNotes"), // grounding validation notes from LLM
  // ─── Approval workflow ────────────────────────────────────────────────────
  reviewStatus: varchar("reviewStatus", { length: 255, enum: [
    "pending", "under_review", "approved", "rejected", "duplicate"
  ] }).default("pending"),
  submittedBy: varchar("submittedBy", { length: 255 }),
  reviewedBy: varchar("reviewedBy", { length: 255 }),
  reviewedAt: timestamp("reviewedAt"),
  reviewNotes: text("reviewNotes"),
  // If approved, this is the resulting facility ID
  approvedFacilityId: integer("approvedFacilityId"),
  // ─── Re-enrichment tracking ───────────────────────────────────────────────
  reenrichmentTriggered: boolean("reenrichmentTriggered").default(false),
  reenrichmentJobId: integer("reenrichmentJobId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_cand_review").on(t.reviewStatus),
  index("idx_cand_country").on(t.country),
  index("idx_cand_type").on(t.type),
  index("idx_cand_method").on(t.discoveryMethod),
]);

export type FacilityCandidate = typeof facilityCandidates.$inferSelect;
export type InsertFacilityCandidate = typeof facilityCandidates.$inferInsert;

// ─── Facility Enrichment Jobs ─────────────────────────────────────────────────
// Tracks re-enrichment runs triggered when a new facility is approved.
// Re-enrichment scans all existing articles for mentions of the new facility
// and creates article_facility_links accordingly.
export const facilityEnrichmentJobs = pgTable("facility_enrichment_jobs", {
  id: serial("id").primaryKey(),
  facilityId: integer("facilityId").notNull(),
  facilityName: varchar("facilityName", { length: 255 }).notNull(),
  status: varchar("status", { length: 255, enum: ["pending", "running", "completed", "failed"] }).default("pending"),
  articlesScanned: integer("articlesScanned").default(0),
  linksCreated: integer("linksCreated").default(0),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  triggeredBy: varchar("triggeredBy", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_enrich_facility").on(t.facilityId),
  index("idx_enrich_status").on(t.status),
]);

export type FacilityEnrichmentJob = typeof facilityEnrichmentJobs.$inferSelect;
export type InsertFacilityEnrichmentJob = typeof facilityEnrichmentJobs.$inferInsert;

// ─── Articles ─────────────────────────────────────────────────────────────────
export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  titleAr: varchar("titleAr", { length: 500 }),
  content: text("content"),
  summary: text("summary"),
  url: varchar("url", { length: 1000 }).notNull().unique(),
  imageUrl: varchar("imageUrl", { length: 1000 }),
  agencyId: integer("agencyId").notNull(),
  author: varchar("author", { length: 255 }),
  publishedAt: timestamp("publishedAt").notNull(),
  crawledAt: timestamp("crawledAt").defaultNow(),
  language: varchar("language", { length: 10 }).default("en"),
  country: varchar("country", { length: 100 }),
  region: varchar("region", { length: 100 }).default("MENA"),
  categories: jsonb("categories").$type<string[]>(),
  topics: jsonb("topics").$type<string[]>(),
  sentiment: varchar("sentiment", { length: 255, enum: ["positive", "neutral", "negative", "mixed"] }).default("neutral"),
  sentimentScore: doublePrecision("sentimentScore").default(0),
  importance: integer("importance").default(5),
  isBreaking: boolean("isBreaking").default(false),
  isTrending: boolean("isTrending").default(false),
  viewCount: integer("viewCount").default(0),
  shareCount: integer("shareCount").default(0),
  replicatedFrom: integer("replicatedFrom"),
  replicationCount: integer("replicationCount").default(0),
  keywords: jsonb("keywords").$type<string[]>(),
  entitiesJson: text("entitiesJson"),
  storageKey: varchar("storageKey", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_agency").on(t.agencyId),
  index("idx_published").on(t.publishedAt),
  index("idx_region_art").on(t.region),
  index("idx_breaking").on(t.isBreaking),
]);

export type Article = typeof articles.$inferSelect;
export type InsertArticle = typeof articles.$inferInsert;

// ─── Article-Facility Links ───────────────────────────────────────────────────
export const articleFacilityLinks = pgTable("article_facility_links", {
  id: serial("id").primaryKey(),
  articleId: integer("articleId").notNull(),
  facilityId: integer("facilityId").notNull(),
  mentionType: varchar("mentionType", { length: 255, enum: ["attack", "threat", "inspection", "construction", "closure", "general"] }).default("general"),
  confidence: doublePrecision("confidence").default(0.8),
  excerpt: text("excerpt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_article_link").on(t.articleId),
  index("idx_facility_link").on(t.facilityId),
]);

export type ArticleFacilityLink = typeof articleFacilityLinks.$inferSelect;

// ─── Crawl Jobs ───────────────────────────────────────────────────────────────
export const crawlJobs = pgTable("crawl_jobs", {
  id: serial("id").primaryKey(),
  agencyId: integer("agencyId").notNull(),
  status: varchar("status", { length: 255, enum: ["pending", "running", "completed", "failed"] }).default("pending"),
  startedAt: timestamp("startedAt"),
  completedAt: timestamp("completedAt"),
  articlesFound: integer("articlesFound").default(0),
  articlesNew: integer("articlesNew").default(0),
  errorMessage: text("errorMessage"),
  region: varchar("region", { length: 100 }).default("MENA"),
  topics: jsonb("topics").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_agency_job").on(t.agencyId),
  index("idx_status_job").on(t.status),
]);

export type CrawlJob = typeof crawlJobs.$inferSelect;

// ─── User Watchlists ──────────────────────────────────────────────────────────
export const watchlists = pgTable("watchlists", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  sessionId: varchar("sessionId", { length: 128 }),
  name: varchar("name", { length: 255 }).notNull(),
  regions: jsonb("regions").$type<string[]>(),
  topics: jsonb("topics").$type<string[]>(),
  facilityTypes: jsonb("facilityTypes").$type<string[]>(),
  keywords: jsonb("keywords").$type<string[]>(),
  isActive: boolean("isActive").default(true),
  notifyOnCritical: boolean("notifyOnCritical").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Watchlist = typeof watchlists.$inferSelect;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  articleId: integer("articleId"),
  facilityId: integer("facilityId"),
  type: varchar("type", { length: 255, enum: ["breaking", "facility_attack", "critical_event", "trending", "system"] }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  message: text("message"),
  severity: varchar("severity", { length: 255, enum: ["info", "warning", "critical"] }).default("info"),
  region: varchar("region", { length: 100 }).default("MENA"),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_notif_type").on(t.type),
  index("idx_notif_read").on(t.isRead),
]);

export type Notification = typeof notifications.$inferSelect;

// ─── Saved Investigations ─────────────────────────────────────────────────────
export const investigations = pgTable("investigations", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  note: text("note"),
  query: varchar("query", { length: 500 }),
  region: varchar("region", { length: 100 }).default("MENA"),
  graphFilter: jsonb("graphFilter").$type<string[]>(),
  nodeCount: integer("nodeCount").default(0),
  edgeCount: integer("edgeCount").default(0),
  topEntities: jsonb("topEntities").$type<{ name: string; type: string; count: number }[]>(),
  topTopics: jsonb("topTopics").$type<{ topic: string; count: number }[]>(),
  topCountries: jsonb("topCountries").$type<{ country: string; count: number }[]>(),
  snapshotJson: text("snapshotJson"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_inv_created").on(t.createdAt),
]);
export type Investigation = typeof investigations.$inferSelect;
export type InsertInvestigation = typeof investigations.$inferInsert;

// ─── Verified Articles ────────────────────────────────────────────────────────
export const verifiedArticles = pgTable("verified_articles", {
  id: serial("id").primaryKey(),
  articleId: integer("articleId").notNull().unique(),
  verifiedAt: timestamp("verifiedAt").defaultNow().notNull(),
  verifiedBy: varchar("verifiedBy", { length: 255 }).default("analyst"),
  notes: text("notes"),
  layersData: text("layersData"), // JSON snapshot of all 6 layers at time of verification
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_verified_article").on(t.articleId),
  index("idx_verified_at").on(t.verifiedAt),
]);
export type VerifiedArticle = typeof verifiedArticles.$inferSelect;
export type InsertVerifiedArticle = typeof verifiedArticles.$inferInsert;

// ─── Crawl Missions ───────────────────────────────────────────────────────────
// Persistent scheduled acquisition missions. Each mission targets a set of
// sources (by ID, country, region, or type), runs on a cron schedule, and
// maintains its own execution history.
export const crawlMissions = pgTable("crawl_missions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  codename: varchar("codename", { length: 100 }),          // e.g. "OPERATION NIGHTWATCH"
  description: text("description"),
  // Target selection — any combination; empty = all active sources in region
  targetAgencyIds: jsonb("targetAgencyIds").$type<number[]>().default([]),
  targetCountries:  jsonb("targetCountries").$type<string[]>().default([]),
  targetRegions:    jsonb("targetRegions").$type<string[]>().default([]),
  targetTypes:      jsonb("targetTypes").$type<string[]>().default([]),
  targetTopics:     jsonb("targetTopics").$type<string[]>().default([]),
  // Schedule
  cronExpression: varchar("cronExpression", { length: 100 }).notNull(), // standard 5-field cron
  intervalMinutes: integer("intervalMinutes"),                  // derived from cron for display
  isRecurring: boolean("isRecurring").default(true),
  // Priority / classification
  priority: varchar("priority", { length: 255, enum: ["low", "normal", "high", "critical"] }).default("normal"),
  classification: varchar("classification", { length: 255, enum: ["UNCLASSIFIED", "CONFIDENTIAL", "SECRET", "TOP SECRET"] }).default("UNCLASSIFIED"),
  // State
  isActive: boolean("isActive").default(true),
  isRunning: boolean("isRunning").default(false),
  lastRunAt: timestamp("lastRunAt"),
  nextRunAt: timestamp("nextRunAt"),
  lastRunJobIds: jsonb("lastRunJobIds").$type<number[]>().default([]),
  totalRuns: integer("totalRuns").default(0),
  totalArticlesCollected: integer("totalArticlesCollected").default(0),
  minArticlesPerRun: integer("minArticlesPerRun").default(0), // alert if run yields fewer articles
  // Creator info (super-admin who created this mission)
  createdBy: varchar("createdBy", { length: 100 }),          // super-admin username
  createdByCredId: integer("createdByCredId"),                   // super_admin_credentials.id
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_mission_active").on(t.isActive),
  index("idx_mission_priority").on(t.priority),
]);
export type CrawlMission = typeof crawlMissions.$inferSelect;
export type InsertCrawlMission = typeof crawlMissions.$inferInsert;

// ─── Mission Execution Log ────────────────────────────────────────────────────
export const missionRuns = pgTable("mission_runs", {
  id: serial("id").primaryKey(),
  missionId: integer("missionId").notNull(),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  status: varchar("status", { length: 255, enum: ["running", "completed", "failed", "partial", "interrupted"] }).default("running"),
  agenciesCrawled: integer("agenciesCrawled").default(0),
  articlesFound: integer("articlesFound").default(0),
  articlesNew: integer("articlesNew").default(0),
  errorMessage: text("errorMessage"),
  jobIds: jsonb("jobIds").$type<number[]>().default([]),
  triggeredBy: varchar("triggeredBy", { length: 255, enum: ["scheduled", "manual"] }).default("scheduled"),
  triggeredByUser: varchar("triggeredByUser", { length: 100 }), // super-admin username if manual
}, (t) => [
  index("idx_run_mission").on(t.missionId),
  index("idx_run_started").on(t.startedAt),
]);
export type MissionRun = typeof missionRuns.$inferSelect;

// ─── Pipeline Stage Webhooks ──────────────────────────────────────────────────
// Configurable outbound webhooks fired when a pipeline stage threshold is met.
// Each row defines: which stage triggers it, the target URL, optional auth header,
// the threshold condition (event count per minute), and whether it is enabled.
export const pipelineWebhooks = pgTable("pipeline_webhooks", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),                 // human label
  stage: varchar("stage", { length: 64 }).notNull(),                // pipeline stage id: "source"|"fetch"|"parse"|"db"|"enrich"|"any"
  url: varchar("url", { length: 1000 }).notNull(),                  // POST target URL
  secret: varchar("secret", { length: 500 }),                       // optional Bearer / HMAC secret
  // Threshold: fire when eventCount >= threshold within windowSeconds
  threshold: integer("threshold").default(1).notNull(),                 // min events to trigger
  windowSeconds: integer("windowSeconds").default(60).notNull(),        // rolling window
  // Payload template (JSON string with {{stage}}, {{count}}, {{ts}} placeholders)
  payloadTemplate: text("payloadTemplate"),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  lastFiredAt: timestamp("lastFiredAt"),
  totalFired: integer("totalFired").default(0).notNull(),
  lastError: text("lastError"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_webhook_stage").on(t.stage),
  index("idx_webhook_enabled").on(t.isEnabled),
]);
export type PipelineWebhook = typeof pipelineWebhooks.$inferSelect;
export type InsertPipelineWebhook = typeof pipelineWebhooks.$inferInsert;

// ─── Country Intelligence Data ────────────────────────────────────────────────
// Stores structured, sourced intelligence per country from trusted sources
// (UN, CIA World Factbook, SIPRI, ACLED, World Bank, IAEA, US State Dept, etc.)
export const countryIntelData = pgTable("country_intel_data", {
  id: serial("id").primaryKey(),
  country: varchar("country", { length: 100 }).notNull().unique(),
  isoA3: varchar("isoA3", { length: 3 }),
  region: varchar("region", { length: 100 }),
  capital: varchar("capital", { length: 100 }),
  governmentType: varchar("governmentType", { length: 200 }),
  headOfState: varchar("headOfState", { length: 200 }),
  population: bigint("population", { mode: "number" }),
  gdpUsd: bigint("gdpUsd", { mode: "number" }),          // GDP in USD billions
  gdpPerCapita: integer("gdpPerCapita"),
  militaryBudgetUsd: bigint("militaryBudgetUsd", { mode: "number" }), // USD millions
  armedForcesSize: integer("armedForcesSize"),
  threatLevel: varchar("threatLevel", { length: 255, enum: ["LOW", "MODERATE", "HIGH", "CRITICAL", "EXTREME"] }).default("MODERATE"),
  nuclearStatus: varchar("nuclearStatus", { length: 255, enum: ["none", "civilian", "suspected", "confirmed", "treaty"] }).default("none"),
  sanctionsStatus: text("sanctionsStatus"),              // free-text summary of active sanctions
  unMemberStatus: varchar("unMemberStatus", { length: 100 }).default("Member"),
  keyLeaders: jsonb("keyLeaders").$type<Array<{ role: string; name: string; since?: string }>>(),
  alliances: jsonb("alliances").$type<string[]>(),
  activeConflicts: jsonb("activeConflicts").$type<Array<{ name: string; since: string; type: string; status: string }>>(),
  humanRightsIndex: doublePrecision("humanRightsIndex"),           // 0-10 scale (10 = best)
  pressFreedomIndex: integer("pressFreedomIndex"),           // RSF rank (lower = better)
  corruptionIndex: integer("corruptionIndex"),               // Transparency Intl CPI score (0-100)
  internetFreedom: varchar("internetFreedom", { length: 255, enum: ["free", "partly_free", "not_free"] }),
  keyIntelNotes: text("keyIntelNotes"),                  // analyst summary
  sources: jsonb("sources").$type<Array<{ name: string; url: string; date?: string }>>(),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_country_intel_country").on(t.country),
  index("idx_country_intel_region").on(t.region),
  index("idx_country_intel_threat").on(t.threatLevel),
]);

export type CountryIntelData = typeof countryIntelData.$inferSelect;
export type InsertCountryIntelData = typeof countryIntelData.$inferInsert;

// ─── SATELLITES ────────────────────────────────────────────────────────────────
export const satellites = pgTable("satellites", {
  id: serial("id").primaryKey(),
  noradId: integer("noradId").notNull().unique(),
  name: varchar("name", { length: 200 }).notNull(),
  intlDesignator: varchar("intlDesignator", { length: 20 }),
  tle1: varchar("tle1", { length: 100 }).notNull(),
  tle2: varchar("tle2", { length: 100 }).notNull(),
  epoch: timestamp("epoch"),
  // Classification
  objectType: varchar("objectType", { length: 255, enum: ["PAYLOAD", "ROCKET_BODY", "DEBRIS", "UNKNOWN"] }).default("PAYLOAD"),
  category: varchar("category", { length: 100 }),  // e.g. "Starlink", "GPS", "Weather", "ISS"
  // Mission info
  country: varchar("country", { length: 100 }),
  launchDate: varchar("launchDate", { length: 20 }),
  launchSite: varchar("launchSite", { length: 200 }),
  missionDescription: text("missionDescription"),
  operator: varchar("operator", { length: 200 }),
  // Orbital parameters (cached from last propagation)
  altitude: doublePrecision("altitude"),      // km
  inclination: doublePrecision("inclination"), // degrees
  period: doublePrecision("period"),          // minutes
  apogee: doublePrecision("apogee"),          // km
  perigee: doublePrecision("perigee"),        // km
  eccentricity: doublePrecision("eccentricity"),
  rcs: varchar("rcs", { length: 20 }), // radar cross section: SMALL/MEDIUM/LARGE
  // Metadata
  decayed: boolean("decayed").default(false),
  lastUpdated: timestamp("lastUpdated").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_satellites_norad").on(t.noradId),
  index("idx_satellites_category").on(t.category),
  index("idx_satellites_country").on(t.country),
]);

export type Satellite = typeof satellites.$inferSelect;
export type InsertSatellite = typeof satellites.$inferInsert;

// ─── SURVEILLANCE MISSIONS ────────────────────────────────────────────────────
export const surveillanceMissions = pgTable("surveillance_missions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  codename: varchar("codename", { length: 100 }),
  description: text("description"),
  status: varchar("status", { length: 255, enum: ["planning", "active", "paused", "completed", "archived"] }).default("planning").notNull(),
  priority: varchar("priority", { length: 255, enum: ["low", "medium", "high", "critical"] }).default("medium").notNull(),
  classification: varchar("classification", { length: 255, enum: ["unclassified", "confidential", "secret", "top_secret"] }).default("unclassified").notNull(),
  // Area of Interest
  aoiLat: doublePrecision("aoiLat"),
  aoiLon: doublePrecision("aoiLon"),
  aoiRadiusKm: doublePrecision("aoiRadiusKm"),
  aoiName: varchar("aoiName", { length: 255 }),
  // Assigned satellites (NORAD IDs as JSON array)
  assignedSatellites: jsonb("assignedSatellites").$type<number[]>().default([]),
  // Schedule
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  // Intelligence notes
  objectives: text("objectives"),
  notes: text("notes"),
  tags: jsonb("tags").$type<string[]>(),
  // Ownership
  createdBy: integer("createdBy"),
  passCount: integer("passCount").default(0),
  lastPassAt: timestamp("lastPassAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_missions_status").on(t.status),
  index("idx_missions_priority").on(t.priority),
  index("idx_missions_created_by").on(t.createdBy),
]);

export type SurveillanceMission = typeof surveillanceMissions.$inferSelect;
export type InsertSurveillanceMission = typeof surveillanceMissions.$inferInsert;

// ─── SIGINT Cameras ──────────────────────────────────────────────────────────
// Real verified CCTV/traffic cameras from OSINT sources.
// Every entry must have a verified working feed URL and precise real coordinates.
export const sigintCameras = pgTable("sigint_cameras", {
  id: serial("id").primaryKey(),
  externalId: varchar("externalId", { length: 255 }).notNull(), // Source-specific ID (e.g., TfL cam ID)
  name: varchar("name", { length: 500 }).notNull(),
  latitude: doublePrecision("latitude").notNull(),
  longitude: doublePrecision("longitude").notNull(),
  country: varchar("country", { length: 100 }).notNull(),
  countryCode: varchar("countryCode", { length: 10 }).notNull(),
  city: varchar("city", { length: 255 }),
  source: varchar("source", { length: 255 }).notNull(), // e.g., "TfL JamCam", "Singapore LTA", "Finland Digitraffic"
  sourceApi: varchar("sourceApi", { length: 1000 }).notNull(), // The API endpoint this camera was fetched from
  feedUrl: varchar("feedUrl", { length: 1000 }).notNull(), // Direct image/video URL
  feedType: varchar("feedType", { length: 255, enum: ["image", "video", "stream"] }).default("image"),
  direction: varchar("direction", { length: 100 }), // e.g., "Northbound", "East"
  road: varchar("road", { length: 255 }), // e.g., "A406", "I-110", "E18"
  isActive: boolean("isActive").default(true),
  lastVerified: timestamp("lastVerified"), // When the feed URL was last confirmed working
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_cam_country").on(t.countryCode),
  index("idx_cam_source").on(t.source),
  index("idx_cam_active").on(t.isActive),
]);

export type SigintCamera = typeof sigintCameras.$inferSelect;
export type InsertSigintCamera = typeof sigintCameras.$inferInsert;

// ─── Activity Log ────────────────────────────────────────────────────────────
// Tracks all significant actions for the Super Admin CMS audit trail
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),                                    // null for anonymous
  userEmail: varchar("userEmail", { length: 320 }),
  userRole: varchar("userRole", { length: 20 }),
  action: varchar("action", { length: 100 }).notNull(),    // e.g. "register", "login", "crawl.start", "article.verify"
  target: varchar("target", { length: 255 }),              // what was acted upon
  details: text("details"),                                 // JSON metadata
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_activity_user").on(t.userId),
  index("idx_activity_action").on(t.action),
  index("idx_activity_created").on(t.createdAt),
]);

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

// ─── Platform Settings ───────────────────────────────────────────────────────
// Key-value store for platform configuration (changeable from CMS)
export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  description: varchar("description", { length: 500 }),
  updatedBy: integer("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type PlatformSetting = typeof platformSettings.$inferSelect;

// ─── Admin Registration Requests (Pending Approval Queue) ───────────────────
// When someone uses the admin registration link, their request goes here for owner approval
export const adminRegistrationRequests = pgTable("admin_registration_requests", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull(),
  name: varchar("name", { length: 255 }),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending | approved | rejected
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  usedKey: varchar("usedKey", { length: 255 }),
  notes: text("notes"),                                                    // admin notes on rejection
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  reviewedBy: integer("reviewedBy"),                                           // admin user id who reviewed
}, (t) => [
  index("idx_admin_req_status").on(t.status),
  index("idx_admin_req_email").on(t.email),
]);

export type AdminRegistrationRequest = typeof adminRegistrationRequests.$inferSelect;
export type InsertAdminRegistrationRequest = typeof adminRegistrationRequests.$inferInsert;

// ─── LLM Quotas ──────────────────────────────────────────────────────────────
export const llmQuotas = pgTable("llm_quotas", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  dailyLimit: integer("dailyLimit").default(50).notNull(),
  monthlyLimit: integer("monthlyLimit").default(1000).notNull(),
  usedToday: integer("usedToday").default(0).notNull(),
  usedThisMonth: integer("usedThisMonth").default(0).notNull(),
  lastDailyReset: timestamp("lastDailyReset").defaultNow().notNull(),
  lastMonthlyReset: timestamp("lastMonthlyReset").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (table) => [
  index("llm_quotas_userId_idx").on(table.userId),
]);

export type LlmQuota = typeof llmQuotas.$inferSelect;
export type InsertLlmQuota = typeof llmQuotas.$inferInsert;

// ─── Super Admin Credentials (Layer 2 auth for CMS) ──────────────────────────
export const superAdminCredentials = pgTable("super_admin_credentials", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastLoginAt: timestamp("lastLoginAt"),
  failedAttempts: integer("failedAttempts").default(0).notNull(),
  lockedUntil: timestamp("lockedUntil"),
});
export type SuperAdminCredential = typeof superAdminCredentials.$inferSelect;
export type InsertSuperAdminCredential = typeof superAdminCredentials.$inferInsert;

// ─── Key History (tracks all generated keys) ─────────────────────────────────
export const keyHistory = pgTable("key_history", {
  id: serial("id").primaryKey(),
  keyValue: varchar("keyValue", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"),
  createdBy: varchar("createdBy", { length: 255 }), // "system" or admin username
  isActive: boolean("isActive").default(true).notNull(),
  registrationCount: integer("registrationCount").default(0).notNull(),
  label: varchar("label", { length: 255 }), // optional label for the key
}, (t) => [
  index("idx_key_history_active").on(t.isActive),
]);

export type KeyHistoryRecord = typeof keyHistory.$inferSelect;
export type InsertKeyHistoryRecord = typeof keyHistory.$inferInsert;

// ─── User Sessions (configurable session duration per user) ──────────────────
export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  sessionDurationMinutes: integer("sessionDurationMinutes").default(180).notNull(), // default 3 hours
  lastActivity: timestamp("lastActivity").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_user_sessions_userId").on(t.userId),
  index("idx_user_sessions_active").on(t.isActive),
]);

export type UserSession = typeof userSessions.$inferSelect;
export type InsertUserSession = typeof userSessions.$inferInsert;

// ─── Site Content (CMS-editable disclaimer, contribute, enroll) ───────────────
// Each row is a named content block. The `key` is a unique identifier like
// "disclaimer.tabs.howto.visible" or "enroll.hero.title".
// This allows granular control over every piece of content from the CMS.
export const siteContent = pgTable("site_content", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 200 }).notNull().unique(),
  value: text("value").notNull(),
  type: varchar("type", { length: 255, enum: ["text", "url", "boolean", "json"] }).default("text").notNull(),
  section: varchar("section", { length: 100 }).notNull(), // e.g. "disclaimer", "contribute", "enroll"
  label: varchar("label", { length: 255 }), // human-readable label for CMS UI
  description: varchar("description", { length: 500 }), // tooltip/hint for CMS
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  updatedBy: varchar("updatedBy", { length: 100 }),
}, (t) => [
  index("idx_site_content_section").on(t.section),
  index("idx_site_content_key").on(t.key),
]);

export type SiteContent = typeof siteContent.$inferSelect;
export type InsertSiteContent = typeof siteContent.$inferInsert;

// ─── Regions ──────────────────────────────────────────────────────────────────
// Single source of truth for all region definitions used across the platform.
export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
  shortLabel: varchar("shortLabel", { length: 50 }),
  description: text("description"),
  centerLat: doublePrecision("centerLat").notNull(),
  centerLon: doublePrecision("centerLon").notNull(),
  defaultZoom: integer("defaultZoom").default(4),
  // Google News geo params
  glCode: varchar("glCode", { length: 10 }), // e.g. "US", "EG"
  hlCode: varchar("hlCode", { length: 10 }), // e.g. "en", "ar"
  ceid: varchar("ceid", { length: 20 }),     // e.g. "US:en"
  // Globe display
  threatLevel: varchar("threatLevel", { length: 20 }).default("MODERATE"),
  color: varchar("color", { length: 20 }),   // hex color for globe
  sortOrder: integer("sortOrder").default(99),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type Region = typeof regions.$inferSelect;
export type InsertRegion = typeof regions.$inferInsert;

// ─── Countries ────────────────────────────────────────────────────────────────
// All world countries with their region assignment and geopolitical metadata.
export const countries = pgTable("countries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 150 }).notNull(),
  iso2: varchar("iso2", { length: 2 }).notNull().unique(),
  iso3: varchar("iso3", { length: 3 }).notNull().unique(),
  region: varchar("region", { length: 100 }).notNull(),
  subRegion: varchar("subRegion", { length: 100 }),
  capital: varchar("capital", { length: 150 }),
  lat: doublePrecision("lat"),
  lon: doublePrecision("lon"),
  flagEmoji: varchar("flagEmoji", { length: 10 }),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_countries_region").on(t.region),
  index("idx_countries_iso2").on(t.iso2),
]);
export type Country = typeof countries.$inferSelect;
export type InsertCountry = typeof countries.$inferInsert;

// ─── Topics ───────────────────────────────────────────────────────────────────
// Intelligence topics used for article classification and feed filtering.
export const topics = pgTable("topics", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  label: varchar("label", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }),
  icon: varchar("icon", { length: 50 }),
  sortOrder: integer("sortOrder").default(99),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Topic = typeof topics.$inferSelect;
export type InsertTopic = typeof topics.$inferInsert;

// ─── Google News Topics ───────────────────────────────────────────────────────
// Region-specific Google News search topics shown in the Data tab.
export const googleNewsTopics = pgTable("google_news_topics", {
  id: serial("id").primaryKey(),
  region: varchar("region", { length: 100 }).notNull(),
  label: varchar("label", { length: 150 }).notNull(),
  query: varchar("query", { length: 300 }).notNull(),
  category: varchar("category", { length: 100 }),
  sortOrder: integer("sortOrder").default(99),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_gnt_region").on(t.region),
]);
export type GoogleNewsTopic = typeof googleNewsTopics.$inferSelect;
export type InsertGoogleNewsTopic = typeof googleNewsTopics.$inferInsert;

// ─── Region Hotspots ─────────────────────────────────────────────────────────
// Conflict/activity hotspots shown on the 3D globe as glowing points.
export const regionHotspots = pgTable("region_hotspots", {
  id: serial("id").primaryKey(),
  region: varchar("region", { length: 100 }).notNull(),
  name: varchar("name", { length: 200 }),
  lat: doublePrecision("lat").notNull(),
  lon: doublePrecision("lon").notNull(),
  intensity: doublePrecision("intensity").default(0.8), // 0-1
  threatLevel: varchar("threatLevel", { length: 20 }).default("HIGH"),
  description: text("description"),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_hotspots_region").on(t.region),
]);
export type RegionHotspot = typeof regionHotspots.$inferSelect;
export type InsertRegionHotspot = typeof regionHotspots.$inferInsert;

// ─── Threat Levels ────────────────────────────────────────────────────────────
// Configurable threat level definitions (colors, labels, descriptions).
export const threatLevels = pgTable("threat_levels", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(), // CRITICAL, HIGH, ELEVATED, MODERATE, LOW
  label: varchar("label", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 20 }).notNull(),   // hex e.g. #ef4444
  hexInt: varchar("hexInt", { length: 20 }),            // e.g. 0xef4444
  bgClass: varchar("bgClass", { length: 50 }),          // tailwind bg class
  textClass: varchar("textClass", { length: 50 }),      // tailwind text class
  borderClass: varchar("borderClass", { length: 50 }),
  sortOrder: integer("sortOrder").default(99),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ThreatLevel = typeof threatLevels.$inferSelect;
export type InsertThreatLevel = typeof threatLevels.$inferInsert;

// ─── Population Data ──────────────────────────────────────────────────────────
// Country-level population, displacement, and humanitarian data.
// Sources: World Bank WDI 2024, UN DESA 2024, UNHCR 2024, UNDP HDR 2023/24.
export const populationData = pgTable("population_data", {
  id: serial("id").primaryKey(),
  country: varchar("country", { length: 150 }).notNull(),
  iso3: varchar("iso3", { length: 3 }),
  region: varchar("region", { length: 100 }).notNull(),
  population: bigint("population", { mode: "number" }).notNull(),
  displaced: bigint("displaced", { mode: "number" }).default(0),
  refugees: bigint("refugees", { mode: "number" }).default(0),
  idps: bigint("idps", { mode: "number" }).default(0),
  urbanPct: doublePrecision("urbanPct"),
  gdpPerCapita: doublePrecision("gdpPerCapita"),
  hdi: doublePrecision("hdi"),
  conflictLevel: varchar("conflictLevel", { length: 20 }).default("low"), // critical, high, medium, low
  dataYear: integer("dataYear").default(2024),
  sources: jsonb("sources").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_popdata_region").on(t.region),
  index("idx_popdata_country").on(t.country),
]);
export type PopulationData = typeof populationData.$inferSelect;
export type InsertPopulationData = typeof populationData.$inferInsert;

// ─── UN Sources ───────────────────────────────────────────────────────────────
// UN and international data sources shown in the Data tab.
export const unSources = pgTable("un_sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  url: varchar("url", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }),
  type: varchar("type", { length: 100 }),
  region: varchar("region", { length: 100 }).default("Global"),
  dataTypes: jsonb("dataTypes").$type<string[]>(),
  updateFreq: varchar("updateFreq", { length: 50 }),
  verified: boolean("verified").default(true),
  apiAvailable: boolean("apiAvailable").default(false),
  apiUrl: varchar("apiUrl", { length: 500 }),
  description: text("description"),
  sortOrder: integer("sortOrder").default(99),
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_unsources_region").on(t.region),
  index("idx_unsources_category").on(t.category),
]);
export type UnSource = typeof unSources.$inferSelect;
export type InsertUnSource = typeof unSources.$inferInsert;

// ─── Narratives ───────────────────────────────────────────────────────────────
// Intelligence-grade narrative tracking: coordinated messaging, disinformation
// campaigns, and information operations detected across monitored regions.
export const narratives = pgTable("narratives", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description").notNull(),
  region: varchar("region", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  status: varchar("status", { length: 50 }).default("active").notNull(),
  threatLevel: varchar("threatLevel", { length: 20 }).default("medium").notNull(),
  originCountry: varchar("originCountry", { length: 150 }),
  targetCountries: jsonb("targetCountries").$type<string[]>().default([]),
  linkedFacilityIds: jsonb("linkedFacilityIds").$type<number[]>().default([]),
  linkedAgencyIds: jsonb("linkedAgencyIds").$type<number[]>().default([]),
  knownAuthors: jsonb("knownAuthors").$type<string[]>().default([]),
  knownPublishers: jsonb("knownPublishers").$type<string[]>().default([]),
  firstDetected: timestamp("firstDetected").notNull(),
  lastSeen: timestamp("lastSeen").notNull(),
  articleCount: integer("articleCount").default(0),
  confidence: doublePrecision("confidence").default(0.5),
  tags: jsonb("tags").$type<string[]>().default([]),
  analystNotes: text("analystNotes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
}, (t) => [
  index("idx_narratives_region").on(t.region),
  index("idx_narratives_status").on(t.status),
  index("idx_narratives_category").on(t.category),
]);
export type Narrative = typeof narratives.$inferSelect;
export type InsertNarrative = typeof narratives.$inferInsert;

// ─── Upgrade Click Tracking ───────────────────────────────────────────────────
// Records each click on the "Upgrade to Enterprise" button across all portals.
export const upgradeClicks = pgTable("upgrade_clicks", {
  id: serial("id").primaryKey(),
  portal: varchar("portal", { length: 50 }).notNull(), // "intel" | "orbit" | "sigint" | "contribute"
  userAgent: text("userAgent"),
  referrer: varchar("referrer", { length: 500 }),
  clickedAt: timestamp("clickedAt").defaultNow().notNull(),
});
export type UpgradeClick = typeof upgradeClicks.$inferSelect;


// ─── Narrative Investigations ─────────────────────────────────────────────────
// Persists hypothesis investigation results for each narrative.
export const narrativeInvestigations = pgTable("narrative_investigations", {
  id: serial("id").primaryKey(),
  narrativeId: integer("narrativeId").notNull(),
  hypothesis: text("hypothesis").notNull(),
  verdict: varchar("verdict", { length: 255, enum: ["SUPPORTED", "REFUTED", "INCONCLUSIVE"] }).notNull(),
  confidence: doublePrecision("confidence").notNull(),
  reasoning: text("reasoning"),
  supportingEvidence: jsonb("supportingEvidence").$type<string[]>(),
  counterEvidence: jsonb("counterEvidence").$type<string[]>(),
  attributes: jsonb("attributes").$type<Record<string, string>>(),
  analystId: varchar("analystId", { length: 255 }),
  analystName: varchar("analystName", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (t) => [
  index("idx_narr_inv_narrative").on(t.narrativeId),
  index("idx_narr_inv_created").on(t.createdAt),
]);
export type NarrativeInvestigation = typeof narrativeInvestigations.$inferSelect;
export type InsertNarrativeInvestigation = typeof narrativeInvestigations.$inferInsert;

// ─── Header Prefs ─────────────────────────────────────────────────────────────
// Stores header layout preferences (visibility, order, style overrides) per page.
// One row per page (intel, orbit, sigint). The `prefs` JSON column holds the full
// HeaderItem[] array. This replaces the old localStorage approach.
export const headerPrefs = pgTable("header_prefs", {
  id: serial("id").primaryKey(),
  page: varchar("page", { length: 50 }).notNull().unique(), // "intel" | "orbit" | "sigint"
  prefs: jsonb("prefs").notNull().$type<unknown[]>(), // HeaderItem[] serialized
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  updatedBy: varchar("updatedBy", { length: 255 }),
});
export type HeaderPrefsRow = typeof headerPrefs.$inferSelect;
export type InsertHeaderPrefsRow = typeof headerPrefs.$inferInsert;
