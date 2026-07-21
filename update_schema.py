import os

schema_path = "backend/prisma/schema.prisma"
with open(schema_path, "r", encoding="utf-8") as f:
    content = f.read()

# Add to the end of the file
rental_schema = """
// ─────────────────────────────────────────────
// RENTAL DOMAIN (Sprint 5)
// ─────────────────────────────────────────────

enum RentalStatus {
  REQUESTED
  UNDER_REVIEW
  APPROVED
  REJECTED
  CANCELLED
  EXPIRED
  READY_FOR_PICKUP
  ACTIVE
  COMPLETED
}

model RentalRequest {
  id              String        @id @default(cuid())
  customerId      String
  workspaceId     String      
  vehicleId       String
  listingId       String
  status          RentalStatus  @default(REQUESTED)
  
  // Dates
  startDate       DateTime
  endDate         DateTime
  
  // Pricing snapshot
  dailyRate       Decimal       @db.Decimal(12, 2)
  currency        Currency      @default(TZS)
  totalAmount     Decimal       @db.Decimal(12, 2)
  depositAmount   Decimal?      @db.Decimal(12, 2)
  
  // Notes
  pickupNotes     String?
  rejectionReason String?
  
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  customer        User          @relation("RentalCustomer", fields: [customerId], references: [id])
  workspace       Workspace     @relation(fields: [workspaceId], references: [id])
  vehicle         Vehicle       @relation(fields: [vehicleId], references: [id])
  listing         Listing       @relation(fields: [listingId], references: [id])
  statusHistory   RentalStatusHistory[]
  
  @@index([customerId])
  @@index([workspaceId])
  @@index([vehicleId])
  @@index([status])
  @@map("rental_requests")
}

model RentalStatusHistory {
  id              String        @id @default(cuid())
  rentalRequestId String
  status          RentalStatus
  changedById     String
  reason          String?
  createdAt       DateTime      @default(now())

  rentalRequest   RentalRequest @relation(fields: [rentalRequestId], references: [id], onDelete: Cascade)
  changedBy       User          @relation("StatusChanger", fields: [changedById], references: [id])

  @@index([rentalRequestId])
  @@index([createdAt])
  @@map("rental_status_history")
}
"""

if "RentalStatus" not in content:
    content += rental_schema

    # Add reverse relations to User
    user_insert_point = "  auditLogs AuditLog[] @relation(\"AuditActor\")"
    user_relations = """  auditLogs AuditLog[] @relation("AuditActor")

  // Rentals
  rentalRequestsMade RentalRequest[] @relation("RentalCustomer")
  rentalStatusChanges RentalStatusHistory[] @relation("StatusChanger")
"""
    content = content.replace(user_insert_point, user_relations)

    # Add reverse relations to Workspace
    workspace_insert_point = "  listings      Listing[]"
    workspace_relations = """  listings      Listing[]
  rentalRequests RentalRequest[]
"""
    content = content.replace(workspace_insert_point, workspace_relations)

    # Add reverse relations to Vehicle
    vehicle_insert_point = "  listings           Listing[]"
    vehicle_relations = """  listings           Listing[]
  rentalRequests     RentalRequest[]
"""
    content = content.replace(vehicle_insert_point, vehicle_relations)

    # Add reverse relations to Listing
    listing_insert_point = "  contactIntents ContactIntent[]"
    listing_relations = """  contactIntents ContactIntent[]
  rentalRequests RentalRequest[]
"""
    content = content.replace(listing_insert_point, listing_relations)

    with open(schema_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Schema updated successfully.")
else:
    print("Schema already contains RentalStatus.")
