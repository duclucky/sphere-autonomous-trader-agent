import type { NegotiationMessage } from "../types";

function shortId(value: string) {
  return value.length <= 18 ? value : `${value.slice(0, 9)}…${value.slice(-6)}`;
}

export function NegotiationPanel({ negotiations }: { negotiations: NegotiationMessage[] }) {
  return (
    <section>
      <h2>Negotiations</h2>
      <div className="messages">
        {negotiations.map((message) => (
          <article key={message.id} className="message">
            <div>
              <strong>{message.direction}</strong>
              <span title={message.counterparty} className="mono-cell">{shortId(message.counterparty)}</span>
              <em>{message.status}</em>
            </div>
            <pre title={message.body}>{message.body}</pre>
          </article>
        ))}
      </div>
    </section>
  );
}
