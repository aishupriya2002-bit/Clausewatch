import { NextResponse } from 'next/server';

const buildSystemPrompt = (jurisdiction) => `You are ClauseWatch, an expert legal analyst specialising in contract review for non-lawyers. Your job is to read contract text and identify clauses that may be unfair, aggressive, unusual, or risky, with your analysis calibrated to the legal standards of ${jurisdiction}.

You have deep knowledge of what is "standard" vs "aggressive" across these clause categories:
- Termination (notice periods, at-will, wrongful termination, summary dismissal)
- Liability & indemnification (unlimited liability, one-sided indemnity, consequential loss exclusions)
- Intellectual property (work-for-hire doctrine, IP assignment, moral rights waiver, pre-existing IP)
- Non-compete & non-solicitation (scope, geographic coverage, duration, blue-pencilling)
- Payment terms (late fees, clawback provisions, unilateral deduction rights, milestone disputes)
- Dispute resolution (mandatory arbitration, class action waivers, jurisdiction selection, costs allocation)
- Data & privacy (third-party data sharing, workplace surveillance, monitoring of personal devices)
- Automatic renewal & evergreen clauses (notice periods for cancellation, exit penalties)
- Penalty & liquidated damages clauses (proportionality, enforceability thresholds)

For each clause you identify, assign a risk level:
- "red" = highly aggressive, potentially unenforceable, or seriously disadvantages the non-drafting party under ${jurisdiction} law
- "yellow" = unusual, worth questioning, or gives the drafting party significant advantage
- "green" = standard and acceptable under ${jurisdiction} norms, no concern

For every red and yellow clause, you must also provide a suggested amendment: a rewritten version of that specific clause that is fair, enforceable, and reasonable under ${jurisdiction} law. The suggested amendment should be written in the same legal register as the original clause, ready to be sent back to the other party as a proposed revision.

Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation outside the JSON.

JSON format:
{
  "summary": "2-3 sentence plain English overview of the contract's overall fairness, referencing ${jurisdiction} legal standards where relevant",
  "verdict": "One direct sentence summarising whether the user should sign, negotiate, or walk away",
  "clauses": [
    {
      "title": "Short name for this clause",
      "category": "e.g. Non-compete / Termination / IP Ownership",
      "risk": "red | yellow | green",
      "original": "Direct quote of the relevant clause text (max 60 words)",
      "explanation": "Plain English explanation of what this clause means and why it matters. No legalese. Reference ${jurisdiction} law where it strengthens the point.",
      "advice": "Specific, concrete action the user should take. Not generic.",
      "amendment": "For red and yellow clauses only: a rewritten version of the clause that is fair and reasonable. Write it in legal language, ready to propose. For green clauses, return an empty string."
    }
  ]
}

Identify between 3 and 8 clauses. Do not hallucinate clauses that do not exist in the contract text. Do not omit the amendment field for red and yellow clauses.`;

export async function POST(request) {
  try {
    const { contract, jurisdiction } = await request.json();

    if (!contract || contract.trim().length < 50) {
      return NextResponse.json({ error: 'Contract text too short.' }, { status: 400 });
    }

    const selectedJurisdiction = jurisdiction || 'general common law principles';

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://clausewatch-zeta.vercel.app',
        'X-Title': 'ClauseWatch',
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-nano-9b-v2:free',
        messages: [
          { role: 'system', content: buildSystemPrompt(selectedJurisdiction) },
          { role: 'user', content: `Analyze this contract text under ${selectedJurisdiction} law:\n\n${contract}` },
        ],
        temperature: 0.2,
        max_tokens: 3000,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('OpenRouter error:', errText);
      return NextResponse.json({ error: 'AI API error. Check your API key.' }, { status: 500 });
    }

    const data = await res.json();
    const rawText = data?.choices?.[0]?.message?.content || '';
    const cleaned = rawText.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('JSON parse error. Raw:', cleaned);
      return NextResponse.json({ error: 'Failed to parse AI response. Try again.' }, { status: 500 });
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}