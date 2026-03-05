/**
 * Shared constants for socket events, statuses, etc.
 * Used by both server and client packages.
 */

// ─── Socket Events (Customer → Server) ──────────────────────────────────────
export const CUSTOMER_EVENTS = {
  JOIN_SESSION: 'join_session',
  SEND_MESSAGE: 'send_message',
  REQUEST_AGENT: 'request_agent',
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  BOOKING_ACTION: 'booking_action',
};

// ─── Socket Events (Agent → Server) ─────────────────────────────────────────
export const AGENT_EVENTS = {
  AGENT_LOGIN: 'agent_login',
  ACCEPT_CHAT: 'accept_chat',
  SEND_MESSAGE: 'send_message',
  RESOLVE_CHAT: 'resolve_chat',
  TRANSFER_CHAT: 'transfer_chat',
  TYPING_START: 'agent_typing_start',
  TYPING_STOP: 'agent_typing_stop',
};

// ─── Socket Events (Server → Client) ────────────────────────────────────────
export const SERVER_EVENTS = {
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_ACK: 'message_ack',
  SESSION_HISTORY: 'session_history',   // sent on reconnect with existing messages
  AGENT_JOINED: 'agent_joined',
  AGENT_TYPING: 'agent_typing',
  BOOKING_CONFIRMED: 'booking_confirmed',
  QUEUE_POSITION: 'queue_position',
  NEW_CONVERSATION: 'new_conversation',
  CUSTOMER_MESSAGE: 'customer_message',
  AGENT_STATUS_CHANGED: 'agent_status_changed',
  SESSION_RESOLVED: 'session_resolved',
  CHAT_TRANSFERRED: 'chat_transferred',
  ERROR: 'chat_error',
};



// ─── Session Statuses ────────────────────────────────────────────────────────
export const SESSION_STATUS = {
  BOT: 'bot',
  WAITING: 'waiting',
  LIVE: 'live',
  RESOLVED: 'resolved',
};

// ─── Booking Statuses ────────────────────────────────────────────────────────
export const BOOKING_STATUS = {
  CONFIRMED: 'confirmed',
  MODIFIED: 'modified',
  CANCELLED: 'cancelled',
};

// ─── Booking Actions (widget → server) ──────────────────────────────────────
export const BOOKING_ACTIONS = {
  CREATE: 'create',
  STATUS: 'status',
  MODIFY: 'modify',
  CANCEL: 'cancel',
};

// ─── Agent Statuses ──────────────────────────────────────────────────────────
export const AGENT_STATUS = {
  ONLINE: 'online',
  AWAY: 'away',
  OFFLINE: 'offline',
};

// ─── Message Sender Types ────────────────────────────────────────────────────
export const SENDER_TYPE = {
  BOT: 'bot',
  CUSTOMER: 'customer',
  AGENT: 'agent',
  SYSTEM: 'system',
};

// ─── Message Delivery Statuses ───────────────────────────────────────────────
export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
};

// ─── Socket Rooms ────────────────────────────────────────────────────────────
export const ROOM = {
  /** All agents of an org */
  org: (orgId) => `org_${orgId}`,
  /** Customer + assigned agent */
  session: (sessionId) => `session_${sessionId}`,
  /** Agent-specific notifications */
  agent: (agentId) => `agent_${agentId}`,
};

// ─── Services (selectable in booking flow) ───────────────────────────────────
export const SERVICES = [
  'Flight',
  'Hotel Reservation',
  'Car Rental',
  'Vacation Packages',
  'Support',
  'Other',
];


export const AIRLINE_COLORS = {
  EK: { from: "#C41E3A", to: "#8B0000" },
  AI: { from: "#FF6A00", to: "#c94f00" },
  LH: { from: "#05164D", to: "#0a2a7a" },
};