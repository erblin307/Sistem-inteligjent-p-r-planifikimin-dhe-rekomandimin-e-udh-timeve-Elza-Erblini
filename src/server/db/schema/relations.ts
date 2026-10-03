import { relations } from "drizzle-orm";

import {
  activities,
  activityCategories,
  activityOpeningHours,
  amenities,
  destinations,
  hotelAmenities,
  hotels,
} from "./catalog";
import { users, userPreferences } from "./identity";
import { budgetLines, itineraries, itineraryDays, itineraryItems, recommendations } from "./itineraries";
import { savedPlaces } from "./saved";
import { tripInterests, trips } from "./trips";

/* Relation metadata for Drizzle's relational query API (db.query.*). */

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences),
  trips: many(trips),
  savedPlaces: many(savedPlaces),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, { fields: [userPreferences.userId], references: [users.id] }),
}));

export const destinationsRelations = relations(destinations, ({ many }) => ({
  hotels: many(hotels),
  activities: many(activities),
  trips: many(trips),
}));

export const hotelsRelations = relations(hotels, ({ one, many }) => ({
  destination: one(destinations, { fields: [hotels.destinationId], references: [destinations.id] }),
  amenities: many(hotelAmenities),
}));

export const amenitiesRelations = relations(amenities, ({ many }) => ({
  hotels: many(hotelAmenities),
}));

export const hotelAmenitiesRelations = relations(hotelAmenities, ({ one }) => ({
  hotel: one(hotels, { fields: [hotelAmenities.hotelId], references: [hotels.id] }),
  amenity: one(amenities, { fields: [hotelAmenities.amenityId], references: [amenities.id] }),
}));

export const activityCategoriesRelations = relations(activityCategories, ({ many }) => ({
  activities: many(activities),
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  destination: one(destinations, {
    fields: [activities.destinationId],
    references: [destinations.id],
  }),
  category: one(activityCategories, {
    fields: [activities.categoryId],
    references: [activityCategories.id],
  }),
  openingHours: many(activityOpeningHours),
}));

export const activityOpeningHoursRelations = relations(activityOpeningHours, ({ one }) => ({
  activity: one(activities, {
    fields: [activityOpeningHours.activityId],
    references: [activities.id],
  }),
}));

export const tripsRelations = relations(trips, ({ one, many }) => ({
  user: one(users, { fields: [trips.userId], references: [users.id] }),
  destination: one(destinations, { fields: [trips.destinationId], references: [destinations.id] }),
  interests: many(tripInterests),
  itineraries: many(itineraries),
}));

export const tripInterestsRelations = relations(tripInterests, ({ one }) => ({
  trip: one(trips, { fields: [tripInterests.tripId], references: [trips.id] }),
  category: one(activityCategories, {
    fields: [tripInterests.categoryId],
    references: [activityCategories.id],
  }),
}));

export const itinerariesRelations = relations(itineraries, ({ one, many }) => ({
  trip: one(trips, { fields: [itineraries.tripId], references: [trips.id] }),
  hotel: one(hotels, { fields: [itineraries.hotelId], references: [hotels.id] }),
  days: many(itineraryDays),
  budgetLines: many(budgetLines),
  recommendations: many(recommendations),
}));

export const itineraryDaysRelations = relations(itineraryDays, ({ one, many }) => ({
  itinerary: one(itineraries, {
    fields: [itineraryDays.itineraryId],
    references: [itineraries.id],
  }),
  items: many(itineraryItems),
}));

export const itineraryItemsRelations = relations(itineraryItems, ({ one }) => ({
  day: one(itineraryDays, { fields: [itineraryItems.dayId], references: [itineraryDays.id] }),
  activity: one(activities, { fields: [itineraryItems.activityId], references: [activities.id] }),
  hotel: one(hotels, { fields: [itineraryItems.hotelId], references: [hotels.id] }),
}));

export const budgetLinesRelations = relations(budgetLines, ({ one }) => ({
  itinerary: one(itineraries, { fields: [budgetLines.itineraryId], references: [itineraries.id] }),
}));

export const recommendationsRelations = relations(recommendations, ({ one }) => ({
  itinerary: one(itineraries, {
    fields: [recommendations.itineraryId],
    references: [itineraries.id],
  }),
  hotel: one(hotels, { fields: [recommendations.hotelId], references: [hotels.id] }),
  activity: one(activities, { fields: [recommendations.activityId], references: [activities.id] }),
}));

export const savedPlacesRelations = relations(savedPlaces, ({ one }) => ({
  user: one(users, { fields: [savedPlaces.userId], references: [users.id] }),
  destination: one(destinations, {
    fields: [savedPlaces.destinationId],
    references: [destinations.id],
  }),
  hotel: one(hotels, { fields: [savedPlaces.hotelId], references: [hotels.id] }),
  activity: one(activities, { fields: [savedPlaces.activityId], references: [activities.id] }),
}));
