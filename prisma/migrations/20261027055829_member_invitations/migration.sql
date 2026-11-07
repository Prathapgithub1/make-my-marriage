-- CreateTable
CREATE TABLE "member_invitations" (
    "id" UUID NOT NULL,
    "wedding_id" UUID NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "role" "WeddingRole" NOT NULL DEFAULT 'MANAGER',
    "token_hash" VARCHAR(128) NOT NULL,
    "invited_by_user_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "accepted_at" TIMESTAMPTZ(6),
    "revoked_at" TIMESTAMPTZ(6),

    CONSTRAINT "member_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "member_invitations_token_hash_key" ON "member_invitations"("token_hash");

-- CreateIndex
CREATE INDEX "member_invitations_wedding_id_email_idx" ON "member_invitations"("wedding_id", "email");

-- CreateIndex
CREATE INDEX "member_invitations_expires_at_idx" ON "member_invitations"("expires_at");

-- AddForeignKey
ALTER TABLE "member_invitations" ADD CONSTRAINT "member_invitations_wedding_id_fkey" FOREIGN KEY ("wedding_id") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_invitations" ADD CONSTRAINT "member_invitations_invited_by_user_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
