/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as addresses from "../addresses.js";
import type * as adminattributes from "../adminattributes.js";
import type * as adminbanners from "../adminbanners.js";
import type * as adminbrands from "../adminbrands.js";
import type * as admincategories from "../admincategories.js";
import type * as admindashboard from "../admindashboard.js";
import type * as adminlocations from "../adminlocations.js";
import type * as adminorders from "../adminorders.js";
import type * as adminproductform from "../adminproductform.js";
import type * as adminproducts from "../adminproducts.js";
import type * as adminreviews from "../adminreviews.js";
import type * as adminseed from "../adminseed.js";
import type * as adminsettings from "../adminsettings.js";
import type * as adminstoreOrders from "../adminstoreOrders.js";
import type * as adminstores from "../adminstores.js";
import type * as adminteam from "../adminteam.js";
import type * as adminusers from "../adminusers.js";
import type * as adminvariants from "../adminvariants.js";
import type * as brands from "../brands.js";
import type * as cart from "../cart.js";
import type * as categories from "../categories.js";
import type * as colors from "../colors.js";
import type * as http from "../http.js";
import type * as neighborhoods from "../neighborhoods.js";
import type * as orders from "../orders.js";
import type * as payments from "../payments.js";
import type * as products from "../products.js";
import type * as reviews from "../reviews.js";
import type * as seed from "../seed.js";
import type * as settings from "../settings.js";
import type * as sizes from "../sizes.js";
import type * as slides from "../slides.js";
import type * as stores from "../stores.js";
import type * as users from "../users.js";
import type * as webhookHandler from "../webhookHandler.js";
import type * as wishlist from "../wishlist.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  addresses: typeof addresses;
  adminattributes: typeof adminattributes;
  adminbanners: typeof adminbanners;
  adminbrands: typeof adminbrands;
  admincategories: typeof admincategories;
  admindashboard: typeof admindashboard;
  adminlocations: typeof adminlocations;
  adminorders: typeof adminorders;
  adminproductform: typeof adminproductform;
  adminproducts: typeof adminproducts;
  adminreviews: typeof adminreviews;
  adminseed: typeof adminseed;
  adminsettings: typeof adminsettings;
  adminstoreOrders: typeof adminstoreOrders;
  adminstores: typeof adminstores;
  adminteam: typeof adminteam;
  adminusers: typeof adminusers;
  adminvariants: typeof adminvariants;
  brands: typeof brands;
  cart: typeof cart;
  categories: typeof categories;
  colors: typeof colors;
  http: typeof http;
  neighborhoods: typeof neighborhoods;
  orders: typeof orders;
  payments: typeof payments;
  products: typeof products;
  reviews: typeof reviews;
  seed: typeof seed;
  settings: typeof settings;
  sizes: typeof sizes;
  slides: typeof slides;
  stores: typeof stores;
  users: typeof users;
  webhookHandler: typeof webhookHandler;
  wishlist: typeof wishlist;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
