import { SetMetadata } from '@nestjs/common';
import { CapabilityType } from '@prisma/client';

export const CAPABILITIES_KEY = 'capabilities';
export const RequireCapabilities = (...capabilities: CapabilityType[]) =>
  SetMetadata(CAPABILITIES_KEY, capabilities);
