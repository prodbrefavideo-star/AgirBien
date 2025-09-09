import React, { useState, useEffect, useRef } from "react";

export default function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "system",
      text:
        "Bienvenue — cette IA donne des conseils basés sur le Coran, la Sunna et la sagesse. Pour les cas complexes, consultez un savant.",
      meta: { source: "disclaimer" },
    },
  ]);
  const [input, setInput] = useState("");
  const [intentOpen, setIntentOpen] = useState(false);
  const [pendingIntent, setPendingIntent] = useState(null);
  const [lastId, setLastId] = useState(2);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof Notification !== "undefined") {
      if (Notification.permission === "default") {
        Notification.requestPermission();
      }
    }
  }, []);

  function generateAdvice(userQuestion, intent) {
    const q = userQuestion.trim().toLowerCase();
    const inferred = intent || null;

    const ruleMatches = [
      {
        test: (t) => /alcool|boire|soirée/.test(t),
        good:
          "✅ Bien : Cherche des rassemblements et des amis dans des cadres halal — cela apporte paix et bénédiction.",
        bad:
          "❌ Mal : Être présent dans un endroit où l'alcool est servi peut te mettre en position de complicité et de tentation. Le Prophète ﷺ déconseille de s'asseoir autour d'alcool.",
        cite: "Hadith: prox. – règle générale (consultez un savant pour les détails).",
        advice: "👉 Conseil : Privilégie une alternative halal et souviens-toi qu'Allah aide ceux qui choisissent le bien.",
      },
      {
        test: (t) => /mensonge|mentir/.test(t),
        good: "✅ Bien : Dire la vérité construit la confiance et est aimé d'Allah.",
        bad: "❌ Mal : Le mensonge mène à la rupture des relations et à des conséquences morales et sociales.",
        cite: "Coran: nombreux versets exhortant à la vérité; Sunna: louange de la véracité.",
        advice: "👉 Conseil : Cherche à être honnête en gardant la bienveillance ; parfois choisir de ne pas répondre vaut mieux que mentir.",
      },
    ];

    const match = ruleMatches.find((r) => r.test(q));

    if (match) {
      return {
        outcome_good: match.good,
        outcome_bad: match.bad,
        explanation: `Explication logique : ${match.advice}`,
        citation: match.cite,
        tone: "encourageant",
      };
    }

    if (!intent) {
      return {
        needs_intent: true,
        prompt:
          "Je voudrais mieux comprendre ton intention avant de répondre : pourquoi veux-tu faire cela ? Pour plaire à Allah, pour plaire aux gens, par curiosité, ou autre ?",
      };
    }

    return {
      outcome_good:
        "✅ Bien : Si l'intention est pure et qu'il n'y a pas de préjudice, l'action peut être acceptable dans certains cadres.",
      outcome_bad:
        "❌ Mal : Si l'action cause du tort, mène au péché, ou nuit à ta relation avec Allah, il faut l'éviter.",
      explanation:
        "Explication logique : Analyse l'intention, les conséquences publiques/privées, et cherche une alternative vertueuse.",
      citation: "Rappel : Consulte un savant pour les cas juridiques ou ambigus.",
      tone: "positif",
    };
  }

  function handleSend() {
    if (!input.trim()) return;
    const userMsg = { id: lastId, role: "user", text: input };
    setLastId((s) => s + 1);
    setMessages((m) => [...m, userMsg]);

    const result = generateAdvice(input, pendingIntent);

    if (result.needs_intent) {
      const sys = {
        id: lastId + 1,
        role: "assistant",
        text: result.prompt,
        meta: { followup: "ask_intent" },
      };
      setLastId((s) => s + 2);
      setMessages((m) => [...m, sys]);
      setIntentOpen(true);
    } else {
      const assistantMsg = {
        id: lastId + 1,
        role: "assistant",
        text:
          `${result.outcome_good}\n\n${result.outcome_bad}\n\n${result.explanation}\n\n${result.citation}`,
        meta: { tone: result.tone || "neutre" },
      };
      setLastId((s) => s + 1);
      setMessages((m) => [...m, assistantMsg]);
    }

    setInput("");
    setPendingIntent(null);
  }

  function handleIntentSubmit(intentText) {
    setIntentOpen(false);
    setPendingIntent(intentText);

    const lastUser = [...messages].reverse().find((x) => x.role === "user");
    if (lastUser) {
      const res = generateAdvice(lastUser.text, intentText);
      if (res.needs_intent) {
        const sys = {
          id: lastId + 1,
          role: "assistant",
          text: res.prompt,
        };
        setLastId((s) => s + 1);
        setMessages((m) => [...m, sys]);
      } else {
        const assistantMsg = {
          id: lastId + 1,
          role: "assistant",
          text:
            `${res.outcome_good}\n\n${res.outcome_bad}\n\n${res.explanation}\n\n${res.citation}`,
        };
        setLastId((s) => s + 1);
        setMessages((m) => [...m, assistantMsg]);
      }
    }
  }

  function addReminder(type) {
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "granted") {
      Notification.requestPermission();
    }
    new Notification("Rappel spirituel", {
      body: type === "prayer"
        ? "C'est l'heure de la prière — prends un moment pour te rapprocher d'Allah."
        : "Rappel : Fais une bonne action aujourd'hui — sourie, aide, donne du temps.",
    });
  }

  function exportConversation() {
    const text = messages
      .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
      .join('\n\n');
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "conversation.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold">AI-Musulmane — Conseiller spirituel</h1>
            <p className="text-sm text-gray-600 mt-1">Conseils basés sur le Coran, la Sunna et la logique.</p>
          </div>
          <div className="space-x-2">
            <button
              onClick={() => { /* toggle placeholder */ }}
              className="px-3 py-1 rounded-md border"
            >
              Rappels OFF
            </button>
            <button onClick={exportConversation} className="px-3 py-1 rounded-md border">Exporter</button>
          </div>
        </header>

        <main className="bg-gray-50 rounded-2xl p-6 shadow-sm h-[60vh] overflow-y-auto">
          <div className="space-y-4">
            {messages.map((m) => (
              <div key={m.id} className={m.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block p-3 rounded-xl max-w-[80%] whitespace-pre-wrap ${
                    m.role === "user" ? "bg-white border" : "bg-white/90 border"
                  }`}
                >
                  <div className="text-sm text-gray-800">{m.text}</div>
                  {m.meta?.source === "disclaimer" && (
                    <div className="mt-2 text-xs text-gray-500 italic">Ceci est un conseil général. Consultez un savant pour les cas complexes.</div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="mt-6 flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder="Pose ta question... Exemple: 'Puis-je aller à une soirée avec de l'alcool même si je ne bois pas ?'"
            className="flex-1 border rounded-lg p-3"
          />
          <button onClick={handleSend} className="px-4 py-2 rounded-lg bg-slate-900 text-white">Envoyer</button>
          <button
            onClick={() => setIntentOpen(true)}
            className="px-3 py-2 rounded-lg border"
            title="Préciser intention"
          >
            Intention
          </button>
          <button
            onClick={() => addReminder("prayer")}
            className="px-3 py-2 rounded-lg border"
            title="Envoyer un rappel spirituel immédiat"
          >
            Rappel
          </button>
        </footer>

        {intentOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
            <div className="bg-white p-6 rounded-xl w-full max-w-md">
              <h3 className="text-lg font-semibold">Précise ton intention</h3>
              <p className="text-sm text-gray-600 mt-1">Pourquoi veux-tu faire cette action ?</p>
              <div className="mt-4 space-y-3">
                <button
                  onClick={() => handleIntentSubmit("plaire_allah")}
                  className="w-full p-3 rounded-md border"
                >
                  Pour plaire à Allah / Ibadah
                </button>
                <button
                  onClick={() => handleIntentSubmit("plaire_aux_autres")}
                  className="w-full p-3 rounded-md border"
                >
                  Pour plaire aux gens / réputation
                </button>
                <button
                  onClick={() => handleIntentSubmit("curiosite")}
                  className="w-full p-3 rounded-md border"
                >
                  Curiosité / Expérience
                </button>
                <button
                  onClick={() => { setIntentOpen(false); }}
                  className="w-full p-3 rounded-md mt-2 text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        <section className="mt-8 text-sm text-gray-700">
          <h4 className="font-semibold">🔒 Sécurité islamique</h4>
          <p className="mt-2">Ceci est un conseil basé sur des règles générales extraites du Coran et de la Sunna et d'une logique morale. Pour des cas spécifiques ou des questions juridiques, il est recommandé de consulter un savant qualifié.</p>
        </section>

      </div>
    </div>
  );
}
