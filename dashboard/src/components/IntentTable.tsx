import type { MarketIntent } from "../types";

function shortId(value: string) {
  return value.length <= 20 ? value : `${value.slice(0, 10)}…${value.slice(-6)}`;
}

function formatPrice(value: number) {
  return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}

export function IntentTable({ intents }: { intents: MarketIntent[] }) {
  return (
    <section>
      <h2>Discovered Intents</h2>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Intent</th><th>Counterparty</th><th>Token</th><th>Amount</th><th>Market Price</th></tr></thead>
          <tbody>
            {intents.map((intent) => (
              <tr key={intent.id}>
                <td title={intent.id} className="mono-cell">{shortId(intent.id)}</td>
                <td title={intent.counterparty} className="mono-cell">{shortId(intent.counterparty)}</td>
                <td>{intent.token}</td>
                <td>{intent.amount}</td>
                <td>{formatPrice(intent.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
