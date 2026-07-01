import type { NegotiationMessage } from "../../../src/storage/types";

export function NegotiationPanel({ negotiations }: { negotiations: NegotiationMessage[] }) {
  return (
    <section>
      <h2>Negotiations</h2>
      <div className="messages">
        {negotiations.map((message) => (
          <article key={message.id} className="message">
            <div><strong>{message.direction}</strong> <span>{message.counterparty}</span> <em>{message.status}</em></div>
            <pre>{message.body}</pre>
          </article>
        ))}
      </div>
    </section>
  );
}
