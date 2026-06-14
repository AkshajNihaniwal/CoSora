-- Prevent UPDATE and DELETE on AuditLog (immutability)
CREATE OR REPLACE FUNCTION prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog entries are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_update ON "AuditLog";
CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

DROP TRIGGER IF EXISTS audit_log_no_delete ON "AuditLog";
CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

-- Ensure autoReplied is always false on EmailEvent
ALTER TABLE "EmailEvent" DROP CONSTRAINT IF EXISTS email_event_no_auto_reply;
ALTER TABLE "EmailEvent" ADD CONSTRAINT email_event_no_auto_reply CHECK ("autoReplied" = false);
