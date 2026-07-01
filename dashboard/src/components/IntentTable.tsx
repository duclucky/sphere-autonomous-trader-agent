import type { MarketIntent } from "../../../src/storage/types";

export function IntentTable({ intents }: { intents: MarketIntent[] }) {
  return (
    <section>
      <h2>Discovered Intents</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Intent</th><th>Counterparty</th><th>Token</th><th>Amount</th><th>Price</th></tr></thead>
          <tbody>
            {intents.map((intent) => (
              <tr key={intent.id}>
                <td>{intent.id}</td>
                <td>{intent.counterparty}</td>
                <td>{intent.token}</td>
                <td>{intent.amount}</td>
                <td>{intent.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
