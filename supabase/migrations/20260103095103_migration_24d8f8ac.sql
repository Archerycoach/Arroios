-- Create function to update conversation's last_message_at and unread_count
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET 
    last_message_at = NEW.created_at,
    unread_count = unread_count + 1,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for conversation updates
DROP TRIGGER IF EXISTS trigger_update_conversation ON messages;
CREATE TRIGGER trigger_update_conversation
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();