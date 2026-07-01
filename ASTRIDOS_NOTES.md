# AstridOS Notes

This project does not include a native AstridOS manifest because no AstridOS repo or runtime contract was available in the workspace.

The app is designed to be portable:

- Backend: Node.js TypeScript service
- Frontend: Vite React dashboard
- State: local JSON file under `data/agent-state.json`
- Config: environment variables

Remaining AstridOS work:

- Confirm process model and service manifest format.
- Map environment variables into AstridOS secrets/config.
- Define persistent storage location for wallet and agent state.
- Expose the dashboard/API ports through the AstridOS runtime.
