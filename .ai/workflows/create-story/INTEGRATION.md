# Integration Contract

On explicit user confirmation:
1. Resolve Epic (3-step find-or-create):
   a. Check local `.ado-map.json` for a cached Evyasys ID → ADO ID mapping (no HTTP).
   b. If not cached, search Azure DevOps via WIQL for an existing Epic with that title.
   c. Only if not found in either source, create a new Epic work item in ADO.
   Save the resolved ADO ID to the local map after steps b or c.
2. Create User Story work item in ADO and link it to the resolved Epic.
3. Save Evyasys story ID → ADO numeric ID to the local map.
4. Move story to backlog.
5. Attach generated markdown artifact.
6. Notify Teams.
7. Save story under `.evyasys/board/epics/{epicId}/stories/{storyId}/` (or `.evyasys/board/stories/{storyId}/` if no epic).

Do not perform these actions before confirmation.
