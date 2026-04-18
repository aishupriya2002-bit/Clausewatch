import { NextResponse } from 'next/server';

const SYSTEM_PROMPT = `You are ClauseWatch, an expert legal analyst. Your job is to read contract text and identify clauses that may be unfair, aggressive, unusual, or risky — especially for non-lawyers (tenants, employees, freelancers, gig workers, students).

You have deep knowledge of what is "standard" vs "aggressive" across these clause categories:
- Termination (notice periods, at-will, wrongful termination)
- Liability & indemnification (unlimited liability, one-sided indemnity)
- Intellectual property (work-for-hire, IP assignment, moral rights)
- Non-compete & non-solicitation (scope, geography, duration)
- Payment terms (late fees, clawback, deductions)
- Dispute resolution (mandatory arbitration, class action waiver, jurisdiction)
- Data & privacy (data sharing, surveillance, monitoring)
- Automatic renewal & cancellation (evergreen clauses, exit penalties)
- Penalty clauses (liquidated damages, disproportionate penalties)

For each clause or section you identify, assign a risk level:
- "red" = highly aggressive, potentially unenforceable, or seriously disadvantages the non-drafting party
- "yellow" = unusual, worth questioning, or gives the drafting party significant advantage
- "green" = standard and acceptable, no concern

Respond ONLY with a valid JSON object. No markdown, no backticks, no explanation outside the JSON.

JSON format:
{
  "summary": "2-3 sentence plain English overview of the contract's overall fairness",
  "verdict": "One punchy sentence: e.g. 'This contract is heavily weighted in the employer's favour. Push back before signing.'",
  "clauses": [
    {
      "title": "Short name for this clause",
      "category": "e.g. Non-compete / Termination / IP Ownership",
      "risk": "red | yellow | green",
      "original": "Direct quote of the relevant clause text (max 60 words)",
      "explanation": "Plain English explanation of what this clause means and why it matters to the user. No legalese.",
      "advice": "What the user should do or ask for. e.g. 'Ask for this to be limited to 6 months and your local city only.'"
    }
  ]
}

Identify between 3 and 8 clauses. If the contract is short or a single clause, still provide your best analysis. Do not hallucinate clauses that don't exist in the text.`;

export async function POST(request) {
  try {
    const { contract } = await request.json();

    if (!contract || contract.trim().length < 50) {
      return NextResponse.json({ error: 'Contract text too short.' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured.' }, { status: 500 });
    }

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'ClauseWatch',
      },
      body: JSON.stringify({
        model: 'nvidia/nemotron-nano-9b-v2:free',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Analyze this contract text:\n\n${contract}` },
        ],
        temperature: 0.2,
        max_tokens: 2048,
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