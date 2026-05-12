/**
 * api.js — All Supabase data operations for EconoConnect
 * This file now delegates to specialized service modules.
 */
import { authService } from './services/authService';
import { productService } from './services/productService';
import { requestService } from './services/requestService';
import { messagingService } from './services/messagingService';
import { orderService } from './services/orderService';
import { inventoryService } from './services/inventoryService';
import { companyService } from './services/companyService';
import { feedService } from './services/feedService';

// Re-export services for direct use if preferred
export {
  authService,
  productService,
  requestService,
  messagingService,
  orderService,
  inventoryService,
  companyService,
  feedService
};

// ─────────────────────────────────────────────
// PROFILES (Delegated)
// ─────────────────────────────────────────────
export const getProfile = (userId) => authService.getProfile(userId);
export const updateProfile = (userId, updates) => authService.updateProfile(userId, updates);
export const setAccountType = (userId, accountType) => authService.setAccountType(userId, accountType);
export const uploadImage = (file, bucket) => authService.uploadImage(file, bucket);

// ─────────────────────────────────────────────
// PRODUCTS / LISTINGS (Delegated)
// ─────────────────────────────────────────────
export const getProducts = (params) => productService.getProducts(params);
export const getUserProducts = (userId) => productService.getUserProducts(userId);
export const createProduct = (userId, data) => productService.createProduct(userId, data);
export const updateProduct = (id, updates) => productService.updateProduct(id, updates);
export const deleteProduct = (id) => productService.deleteProduct(id);

// ─────────────────────────────────────────────
// REQUESTS (Delegated)
// ─────────────────────────────────────────────
export const getRequests = (params) => requestService.getRequests(params);
export const getUserRequests = (userId) => requestService.getUserRequests(userId);
export const createRequest = (userId, data) => requestService.createRequest(userId, data);
export const updateRequestStatus = (id, status) => requestService.updateRequestStatus(id, status);

// ─────────────────────────────────────────────
// OFFERS (Delegated)
// ─────────────────────────────────────────────
export const getOffersForRequest = (id) => requestService.getOffersForRequest(id);
export const createOffer = (supplierId, data) => requestService.createOffer(supplierId, data);
export const updateOfferStatus = (id, status) => requestService.updateOfferStatus(id, status);

// ─────────────────────────────────────────────
// CONVERSATIONS & MESSAGES (Delegated)
// ─────────────────────────────────────────────
export const getConversations = (userId) => messagingService.getConversations(userId);
export const getOrCreateConversation = (u1, u2, meta) => messagingService.getOrCreateConversation(u1, u2, meta);
export const getMessages = (id) => messagingService.getMessages(id);
export const sendMessage = (cid, sid, content) => messagingService.sendMessage(cid, sid, content);
export const markMessagesRead = (cid, uid) => messagingService.markMessagesRead(cid, uid);

// ─────────────────────────────────────────────
// ORDERS (Delegated)
// ─────────────────────────────────────────────
export const getOrders = (userId) => orderService.getOrders(userId);
export const createOrder = (data) => orderService.createOrder(data);
export const updateOrderStatus = (id, status) => orderService.updateOrderStatus(id, status);

// ─────────────────────────────────────────────
// INVENTORY (Delegated)
// ─────────────────────────────────────────────
export const getInventory = (userId, companyId) => inventoryService.getInventory(userId, companyId);
export const createInventoryItem = (userId, item) => inventoryService.createInventoryItem(userId, item);
export const updateInventoryItem = (id, updates) => inventoryService.updateInventoryItem(id, updates);
export const deleteInventoryItem = (id) => inventoryService.deleteInventoryItem(id);

// ─────────────────────────────────────────────
// FEED (Delegated)
// ─────────────────────────────────────────────
export const getFeed = (params) => feedService.getFeed(params);
