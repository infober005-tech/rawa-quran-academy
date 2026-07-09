-- Restrict conversation_members INSERT to prevent self-joining arbitrary conversations
DROP POLICY IF EXISTS cmembers_insert_self_or_member ON public.conversation_members;

CREATE POLICY cmembers_insert_creator_or_member ON public.conversation_members
  FOR INSERT TO authenticated
  WITH CHECK (
    private.has_role(auth.uid(), 'director'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.created_by = auth.uid()
    )
    OR private.is_conversation_member(auth.uid(), conversation_id)
  );
