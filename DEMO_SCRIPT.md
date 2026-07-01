# Demo Script

## 2-Minute Recording

1. Install dependencies:

```bash
npm install
```

2. Run the autonomous dry-run demo:

```bash
npm run demo:dry
```

Reviewer should see the agent load a mock wallet, scan fixture intents, select profitable opportunities, send simulated negotiation messages, receive simulated acceptance, and produce dry-run execution records.

3. Start dashboard:

```bash
npm run dev
```

4. Open `http://127.0.0.1:5173`.

5. Press Start.

Reviewer should see:

- Mode badge: `mock dry-run`
- Agent identity and wallet status
- Discovered intents from fixtures
- `IGNORE`, `NEGOTIATE`, and `EXECUTE_DIRECTLY` decisions
- Negotiation transcript
- Dry-run execution rows with fake transaction IDs
- Live logs explaining why each action was selected or skipped

6. Press Stop.

End by stating that dry-run moved no real testnet value and that real mode uses verified Sphere SDK calls only.
