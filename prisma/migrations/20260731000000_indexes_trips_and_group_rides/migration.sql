-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "distanceM" INTEGER NOT NULL DEFAULT 0,
    "durationS" INTEGER NOT NULL DEFAULT 0,
    "avgSpeedKph" DOUBLE PRECISION,
    "maxSpeedKph" DOUBLE PRECISION,
    "maxLeanAngleDeg" DOUBLE PRECISION,
    "trackEncoded" TEXT,
    "samples" JSONB,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideGroup" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RideGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RideGroupMember" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "RideGroupMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friendship" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Trip_userId_startedAt_idx" ON "Trip"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "Trip_vehicleId_startedAt_idx" ON "Trip"("vehicleId", "startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RideGroup_code_key" ON "RideGroup"("code");

-- CreateIndex
CREATE INDEX "RideGroup_ownerId_idx" ON "RideGroup"("ownerId");

-- CreateIndex
CREATE INDEX "RideGroup_isActive_startedAt_idx" ON "RideGroup"("isActive", "startedAt");

-- CreateIndex
CREATE INDEX "RideGroupMember_userId_idx" ON "RideGroupMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "RideGroupMember_groupId_userId_key" ON "RideGroupMember"("groupId", "userId");

-- CreateIndex
CREATE INDEX "Friendship_addresseeId_status_idx" ON "Friendship"("addresseeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_requesterId_addresseeId_key" ON "Friendship"("requesterId", "addresseeId");

-- CreateIndex
CREATE INDEX "Vehicle_userId_idx" ON "Vehicle"("userId");

-- CreateIndex
CREATE INDEX "RefuelingLog_vehicleId_date_idx" ON "RefuelingLog"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "RefuelingLog_vehicleId_odometer_idx" ON "RefuelingLog"("vehicleId", "odometer");

-- CreateIndex
CREATE INDEX "MaintenanceLog_vehicleId_date_idx" ON "MaintenanceLog"("vehicleId", "date");

-- CreateIndex
CREATE INDEX "MaintenanceLog_vehicleId_odometer_idx" ON "MaintenanceLog"("vehicleId", "odometer");

-- CreateIndex
CREATE INDEX "Part_maintenanceLogId_idx" ON "Part"("maintenanceLogId");

-- CreateIndex
CREATE INDEX "PlannedMaintenance_vehicleId_isCompleted_idx" ON "PlannedMaintenance"("vehicleId", "isCompleted");

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideGroup" ADD CONSTRAINT "RideGroup_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideGroupMember" ADD CONSTRAINT "RideGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "RideGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RideGroupMember" ADD CONSTRAINT "RideGroupMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

