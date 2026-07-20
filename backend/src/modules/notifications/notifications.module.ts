import { Module } from '@nestjs/common';

/**
 * Notifications Module — STUB
 *
 * Sprint TBD — Will implement:
 * - Port interface: INotificationProvider
 * - Adapters: FCM (Firebase), APNs, in-app
 * - Events: emitted via EventEmitter2 from domain events
 * - Triggers: listing published, capability approved, invitation received,
 *   inquiry received, workspace joined, vehicle status changed, etc.
 * - Delivery channels: push (mobile), in-app feed, SMS, email
 */
@Module({})
export class NotificationsModule {}
