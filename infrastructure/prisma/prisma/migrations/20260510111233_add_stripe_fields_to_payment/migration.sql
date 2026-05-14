-- AlterTable
ALTER TABLE "invitations" ALTER COLUMN "token" SET DEFAULT gen_random_uuid()::text;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "stripe_checkout_session_id" TEXT,
ADD COLUMN     "stripe_payment_intent_id" TEXT;
