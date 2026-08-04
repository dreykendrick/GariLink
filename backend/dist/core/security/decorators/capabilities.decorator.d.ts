import { CapabilityType } from '@prisma/client';
export declare const CAPABILITIES_KEY = "capabilities";
export declare const RequireCapabilities: (...capabilities: CapabilityType[]) => import("@nestjs/common").CustomDecorator<string>;
