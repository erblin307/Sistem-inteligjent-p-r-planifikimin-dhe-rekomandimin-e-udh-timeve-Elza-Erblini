CREATE TYPE "public"."accommodation_type" AS ENUM('hotel', 'apartment', 'hostel', 'guesthouse');--> statement-breakpoint
CREATE TYPE "public"."budget_category" AS ENUM('accommodation', 'transport', 'food', 'activities', 'local_transport', 'reserve');--> statement-breakpoint
CREATE TYPE "public"."dietary_requirement" AS ENUM('vegetarian', 'vegan', 'halal', 'kosher', 'gluten_free');--> statement-breakpoint
CREATE TYPE "public"."inbound_transport_mode" AS ENUM('flight', 'train', 'bus', 'car');--> statement-breakpoint
CREATE TYPE "public"."itinerary_day_kind" AS ENUM('arrival', 'full', 'departure');--> statement-breakpoint
CREATE TYPE "public"."itinerary_item_type" AS ENUM('activity', 'meal', 'hotel', 'free');--> statement-breakpoint
CREATE TYPE "public"."itinerary_status" AS ENUM('active', 'superseded');--> statement-breakpoint
CREATE TYPE "public"."local_transport_mode" AS ENUM('walk', 'public_transport', 'taxi', 'car', 'bike');--> statement-breakpoint
CREATE TYPE "public"."recommendation_kind" AS ENUM('hotel', 'activity');--> statement-breakpoint
CREATE TYPE "public"."travel_pace" AS ENUM('relaxed', 'moderate', 'packed');--> statement-breakpoint
CREATE TYPE "public"."travel_style" AS ENUM('budget', 'balanced', 'comfort', 'premium');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('draft', 'planned', 'archived');--> statement-breakpoint
CREATE TABLE "user_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"currency" char(3) DEFAULT 'EUR' NOT NULL,
	"travel_style" "travel_style",
	"pace" "travel_pace",
	"accommodation_type" "accommodation_type",
	"min_hotel_stars" smallint,
	"local_transport_modes" "local_transport_mode"[] DEFAULT '{}' NOT NULL,
	"dietary_requirements" "dietary_requirement"[] DEFAULT '{}' NOT NULL,
	"home_city" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_min_hotel_stars_range" CHECK ("user_preferences"."min_hotel_stars" BETWEEN 1 AND 5),
	CONSTRAINT "user_preferences_currency_format" CHECK ("user_preferences"."currency" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"email_verified" timestamp with time zone,
	"image" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"destination_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"address" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"rating" numeric(2, 1),
	"review_count" integer DEFAULT 0 NOT NULL,
	"duration_minutes" smallint NOT NULL,
	"adult_price_minor" integer,
	"child_price_minor" integer,
	"currency" char(3) NOT NULL,
	"min_age" smallint,
	"booking_required" boolean DEFAULT false NOT NULL,
	"image_url" text,
	"source" text NOT NULL,
	"external_id" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "activities_source_external_id_key" UNIQUE("source","external_id"),
	CONSTRAINT "activities_rating_range" CHECK ("activities"."rating" BETWEEN 0 AND 5),
	CONSTRAINT "activities_review_count_nonnegative" CHECK ("activities"."review_count" >= 0),
	CONSTRAINT "activities_duration_positive" CHECK ("activities"."duration_minutes" > 0),
	CONSTRAINT "activities_adult_price_nonnegative" CHECK ("activities"."adult_price_minor" >= 0),
	CONSTRAINT "activities_child_price_nonnegative" CHECK ("activities"."child_price_minor" >= 0),
	CONSTRAINT "activities_min_age_range" CHECK ("activities"."min_age" BETWEEN 0 AND 17),
	CONSTRAINT "activities_currency_format" CHECK ("activities"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "activities_latitude_range" CHECK ("activities"."latitude" BETWEEN -90 AND 90),
	CONSTRAINT "activities_longitude_range" CHECK ("activities"."longitude" BETWEEN -180 AND 180)
);
--> statement-breakpoint
CREATE TABLE "activity_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "activity_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "activity_opening_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"opens_at" time NOT NULL,
	"closes_at" time NOT NULL,
	CONSTRAINT "activity_opening_hours_weekday_range" CHECK ("activity_opening_hours"."weekday" BETWEEN 1 AND 7),
	CONSTRAINT "activity_opening_hours_order" CHECK ("activity_opening_hours"."closes_at" > "activity_opening_hours"."opens_at")
);
--> statement-breakpoint
CREATE TABLE "amenities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "amenities_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "destinations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"country_code" char(2) NOT NULL,
	"region" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"timezone" text NOT NULL,
	"currency" char(3) NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"source" text NOT NULL,
	"external_id" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "destinations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "destinations_source_external_id_key" UNIQUE("source","external_id"),
	CONSTRAINT "destinations_country_code_format" CHECK ("destinations"."country_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "destinations_currency_format" CHECK ("destinations"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "destinations_latitude_range" CHECK ("destinations"."latitude" BETWEEN -90 AND 90),
	CONSTRAINT "destinations_longitude_range" CHECK ("destinations"."longitude" BETWEEN -180 AND 180)
);
--> statement-breakpoint
CREATE TABLE "hotel_amenities" (
	"hotel_id" uuid NOT NULL,
	"amenity_id" uuid NOT NULL,
	CONSTRAINT "hotel_amenities_hotel_id_amenity_id_pk" PRIMARY KEY("hotel_id","amenity_id")
);
--> statement-breakpoint
CREATE TABLE "hotels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"destination_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"property_type" "accommodation_type" DEFAULT 'hotel' NOT NULL,
	"stars" smallint,
	"area" text,
	"address" text,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"rating" numeric(2, 1),
	"review_count" integer DEFAULT 0 NOT NULL,
	"nightly_price_minor" integer,
	"currency" char(3) NOT NULL,
	"max_occupancy" smallint DEFAULT 2 NOT NULL,
	"free_cancellation" boolean,
	"image_url" text,
	"source" text NOT NULL,
	"external_id" text,
	"last_synced_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hotels_source_external_id_key" UNIQUE("source","external_id"),
	CONSTRAINT "hotels_stars_range" CHECK ("hotels"."stars" BETWEEN 1 AND 5),
	CONSTRAINT "hotels_rating_range" CHECK ("hotels"."rating" BETWEEN 0 AND 5),
	CONSTRAINT "hotels_review_count_nonnegative" CHECK ("hotels"."review_count" >= 0),
	CONSTRAINT "hotels_nightly_price_nonnegative" CHECK ("hotels"."nightly_price_minor" >= 0),
	CONSTRAINT "hotels_max_occupancy_positive" CHECK ("hotels"."max_occupancy" >= 1),
	CONSTRAINT "hotels_currency_format" CHECK ("hotels"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "hotels_latitude_range" CHECK ("hotels"."latitude" BETWEEN -90 AND 90),
	CONSTRAINT "hotels_longitude_range" CHECK ("hotels"."longitude" BETWEEN -180 AND 180)
);
--> statement-breakpoint
CREATE TABLE "trip_interests" (
	"trip_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "trip_interests_trip_id_category_id_pk" PRIMARY KEY("trip_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"destination_id" uuid NOT NULL,
	"title" text,
	"status" "trip_status" DEFAULT 'draft' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"departure_city" text,
	"departure_latitude" double precision,
	"departure_longitude" double precision,
	"adults" smallint NOT NULL,
	"child_ages" smallint[] DEFAULT '{}' NOT NULL,
	"budget_minor" integer NOT NULL,
	"currency" char(3) NOT NULL,
	"budget_includes_transport" boolean DEFAULT true NOT NULL,
	"travel_style" "travel_style" NOT NULL,
	"pace" "travel_pace" DEFAULT 'moderate' NOT NULL,
	"accommodation_type" "accommodation_type",
	"min_hotel_stars" smallint,
	"local_transport_modes" "local_transport_mode"[] NOT NULL,
	"inbound_transport_mode" "inbound_transport_mode",
	"dietary_requirements" "dietary_requirement"[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trips_dates_order" CHECK ("trips"."end_date" >= "trips"."start_date"),
	CONSTRAINT "trips_adults_min" CHECK ("trips"."adults" >= 1),
	CONSTRAINT "trips_child_ages_range" CHECK (array_position("trips"."child_ages", NULL) IS NULL
        AND 0 <= ALL("trips"."child_ages") AND 17 >= ALL("trips"."child_ages")),
	CONSTRAINT "trips_party_size_max" CHECK ("trips"."adults" + cardinality("trips"."child_ages") <= 10),
	CONSTRAINT "trips_budget_nonnegative" CHECK ("trips"."budget_minor" >= 0),
	CONSTRAINT "trips_currency_format" CHECK ("trips"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "trips_min_hotel_stars_range" CHECK ("trips"."min_hotel_stars" BETWEEN 1 AND 5),
	CONSTRAINT "trips_local_transport_not_empty" CHECK (cardinality("trips"."local_transport_modes") >= 1
        AND array_position("trips"."local_transport_modes", NULL) IS NULL),
	CONSTRAINT "trips_departure_coordinates_pair" CHECK (("trips"."departure_latitude" IS NULL) = ("trips"."departure_longitude" IS NULL))
);
--> statement-breakpoint
CREATE TABLE "budget_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"itinerary_id" uuid NOT NULL,
	"category" "budget_category" NOT NULL,
	"planned_minor" integer NOT NULL,
	"low_minor" integer NOT NULL,
	"high_minor" integer NOT NULL,
	"basis" text,
	CONSTRAINT "budget_lines_itinerary_id_category_key" UNIQUE("itinerary_id","category"),
	CONSTRAINT "budget_lines_range_order" CHECK (0 <= "budget_lines"."low_minor" AND "budget_lines"."low_minor" <= "budget_lines"."planned_minor" AND "budget_lines"."planned_minor" <= "budget_lines"."high_minor")
);
--> statement-breakpoint
CREATE TABLE "itineraries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trip_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"status" "itinerary_status" DEFAULT 'active' NOT NULL,
	"hotel_id" uuid,
	"hotel_total_minor" integer,
	"currency" char(3) NOT NULL,
	"engine_version" text NOT NULL,
	"scoring_version" text NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "itineraries_trip_id_version_key" UNIQUE("trip_id","version"),
	CONSTRAINT "itineraries_version_positive" CHECK ("itineraries"."version" >= 1),
	CONSTRAINT "itineraries_hotel_total_nonnegative" CHECK ("itineraries"."hotel_total_minor" >= 0),
	CONSTRAINT "itineraries_currency_format" CHECK ("itineraries"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "itineraries_hotel_total_requires_hotel" CHECK ("itineraries"."hotel_total_minor" IS NULL OR "itineraries"."hotel_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "itinerary_days" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"itinerary_id" uuid NOT NULL,
	"day_number" smallint NOT NULL,
	"date" date NOT NULL,
	"kind" "itinerary_day_kind" DEFAULT 'full' NOT NULL,
	"notes" text,
	CONSTRAINT "itinerary_days_itinerary_id_day_number_key" UNIQUE("itinerary_id","day_number"),
	CONSTRAINT "itinerary_days_itinerary_id_date_key" UNIQUE("itinerary_id","date"),
	CONSTRAINT "itinerary_days_day_number_positive" CHECK ("itinerary_days"."day_number" >= 1)
);
--> statement-breakpoint
CREATE TABLE "itinerary_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"day_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"type" "itinerary_item_type" NOT NULL,
	"activity_id" uuid,
	"hotel_id" uuid,
	"title" text,
	"latitude" double precision,
	"longitude" double precision,
	"start_time" time NOT NULL,
	"duration_minutes" smallint NOT NULL,
	"estimated_cost_minor" integer DEFAULT 0 NOT NULL,
	"locked" boolean DEFAULT false NOT NULL,
	"notes" text,
	"travel_mode" "local_transport_mode",
	"travel_minutes" smallint,
	"travel_meters" integer,
	CONSTRAINT "itinerary_items_day_id_position_key" UNIQUE("day_id","position"),
	CONSTRAINT "itinerary_items_position_nonnegative" CHECK ("itinerary_items"."position" >= 0),
	CONSTRAINT "itinerary_items_duration_positive" CHECK ("itinerary_items"."duration_minutes" > 0),
	CONSTRAINT "itinerary_items_cost_nonnegative" CHECK ("itinerary_items"."estimated_cost_minor" >= 0),
	CONSTRAINT "itinerary_items_reference_matches_type" CHECK (CASE "itinerary_items"."type"
        WHEN 'activity' THEN "itinerary_items"."activity_id" IS NOT NULL AND "itinerary_items"."hotel_id" IS NULL
        WHEN 'hotel' THEN "itinerary_items"."hotel_id" IS NOT NULL AND "itinerary_items"."activity_id" IS NULL
        ELSE "itinerary_items"."activity_id" IS NULL AND "itinerary_items"."hotel_id" IS NULL AND "itinerary_items"."title" IS NOT NULL
      END),
	CONSTRAINT "itinerary_items_coordinates_pair" CHECK (("itinerary_items"."latitude" IS NULL) = ("itinerary_items"."longitude" IS NULL)),
	CONSTRAINT "itinerary_items_travel_complete" CHECK (("itinerary_items"."travel_mode" IS NULL) = ("itinerary_items"."travel_minutes" IS NULL)
        AND ("itinerary_items"."travel_minutes" IS NULL OR "itinerary_items"."travel_minutes" >= 0)
        AND ("itinerary_items"."travel_meters" IS NULL OR "itinerary_items"."travel_meters" >= 0))
);
--> statement-breakpoint
CREATE TABLE "recommendations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"itinerary_id" uuid NOT NULL,
	"kind" "recommendation_kind" NOT NULL,
	"hotel_id" uuid,
	"activity_id" uuid,
	"rank" smallint NOT NULL,
	"score" smallint NOT NULL,
	"breakdown" jsonb NOT NULL,
	"reasons" text[] DEFAULT '{}' NOT NULL,
	"price_minor" integer,
	CONSTRAINT "recommendations_itinerary_id_kind_rank_key" UNIQUE("itinerary_id","kind","rank"),
	CONSTRAINT "recommendations_score_range" CHECK ("recommendations"."score" BETWEEN 0 AND 100),
	CONSTRAINT "recommendations_rank_positive" CHECK ("recommendations"."rank" >= 1),
	CONSTRAINT "recommendations_price_nonnegative" CHECK ("recommendations"."price_minor" >= 0),
	CONSTRAINT "recommendations_reference_matches_kind" CHECK (CASE "recommendations"."kind"
        WHEN 'hotel' THEN "recommendations"."hotel_id" IS NOT NULL AND "recommendations"."activity_id" IS NULL
        WHEN 'activity' THEN "recommendations"."activity_id" IS NOT NULL AND "recommendations"."hotel_id" IS NULL
      END)
);
--> statement-breakpoint
CREATE TABLE "saved_places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"destination_id" uuid,
	"hotel_id" uuid,
	"activity_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "saved_places_exactly_one_target" CHECK (num_nonnulls("saved_places"."destination_id", "saved_places"."hotel_id", "saved_places"."activity_id") = 1)
);
--> statement-breakpoint
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_category_id_activity_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."activity_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_opening_hours" ADD CONSTRAINT "activity_opening_hours_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_amenities" ADD CONSTRAINT "hotel_amenities_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotel_amenities" ADD CONSTRAINT "hotel_amenities_amenity_id_amenities_id_fk" FOREIGN KEY ("amenity_id") REFERENCES "public"."amenities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_interests" ADD CONSTRAINT "trip_interests_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_interests" ADD CONSTRAINT "trip_interests_category_id_activity_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."activity_categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_lines" ADD CONSTRAINT "budget_lines_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_trip_id_trips_id_fk" FOREIGN KEY ("trip_id") REFERENCES "public"."trips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itineraries" ADD CONSTRAINT "itineraries_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_days" ADD CONSTRAINT "itinerary_days_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_day_id_itinerary_days_id_fk" FOREIGN KEY ("day_id") REFERENCES "public"."itinerary_days"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "itinerary_items" ADD CONSTRAINT "itinerary_items_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_itinerary_id_itineraries_id_fk" FOREIGN KEY ("itinerary_id") REFERENCES "public"."itineraries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_destination_id_destinations_id_fk" FOREIGN KEY ("destination_id") REFERENCES "public"."destinations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_hotel_id_hotels_id_fk" FOREIGN KEY ("hotel_id") REFERENCES "public"."hotels"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_places" ADD CONSTRAINT "saved_places_activity_id_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_destination_id_category_id_idx" ON "activities" USING btree ("destination_id","category_id");--> statement-breakpoint
CREATE INDEX "activity_opening_hours_activity_id_idx" ON "activity_opening_hours" USING btree ("activity_id");--> statement-breakpoint
CREATE INDEX "hotel_amenities_amenity_id_idx" ON "hotel_amenities" USING btree ("amenity_id");--> statement-breakpoint
CREATE INDEX "hotels_destination_id_idx" ON "hotels" USING btree ("destination_id");--> statement-breakpoint
CREATE INDEX "trips_user_id_start_date_idx" ON "trips" USING btree ("user_id","start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "itineraries_one_active_per_trip" ON "itineraries" USING btree ("trip_id") WHERE "itineraries"."status" = 'active';--> statement-breakpoint
CREATE UNIQUE INDEX "saved_places_user_destination_key" ON "saved_places" USING btree ("user_id","destination_id") WHERE "saved_places"."destination_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "saved_places_user_hotel_key" ON "saved_places" USING btree ("user_id","hotel_id") WHERE "saved_places"."hotel_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "saved_places_user_activity_key" ON "saved_places" USING btree ("user_id","activity_id") WHERE "saved_places"."activity_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "saved_places_user_id_created_at_idx" ON "saved_places" USING btree ("user_id","created_at" DESC NULLS LAST);