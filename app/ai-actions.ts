'use server';

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';

interface UserVisitData {
  name: string;
  lastVisitDate: string; // ISO date string
  points?: number;
}

// New Types for Marketing Agent
export interface MarketingInsight {
  summary: string;
  customers: {
    id: string;
    name: string;
    phone: string;
    status: 'Loyal' | 'At Risk' | 'New';
    message: string;
    points: number;
    lastVisitDays: number;
  }[];
}

export async function generateMarketingInsights(): Promise<MarketingInsight> {
  const supabase = await createClient();
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) throw new Error('Groq API Key not configured');

  // 1. Fetch Data
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, whatsapp, points, created_at')
    .in('role', ['client', 'user']);

  const { data: transactions } = await supabase
    .from('transactions')
    .select('user_id, created_at')
    .eq('type', 'earn');

  if (!profiles) throw new Error('No profiles found');

  // 2. Process Data for AI
  const now = new Date();
  const userAnalysis = profiles.map(user => {
    const userTx = transactions?.filter(t => t.user_id === user.id) || [];
    // Sort desc
    userTx.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    const lastVisit = userTx.length > 0 ? new Date(userTx[0].created_at) : new Date(user.created_at);
    const daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 3600 * 24));
    
    return {
      id: user.id,
      name: user.full_name || 'Cliente',
      phone: user.whatsapp || '',
      points: user.points || 0,
      daysSinceLastVisit,
      visitCount: userTx.length,
      isNew: userTx.length === 0 && daysSinceLastVisit < 7
    };
  });

  const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: apiKey,
  });

  const prompt = `
    You are a growth hacker for a barber shop called "Tulook".
    Analyze the customer visit patterns below.
    
    Categorize them into: 
    - 'Loyal' (Frequent visits, low days since last visit)
    - 'At Risk' (Hasn't visited in 21+ days)
    - 'New' (0 visits or joined recently)

    For EACH customer, generate a WhatsApp marketing message in **Argentinian Spanish (Rioplatense)**.
    
    **Personality & Style Rules:**
    1. **Personalization (CRITICAL):** ALWAYS start the message with the client's real Name from the data (e.g., "¡Hola Juan!", "Che Carlos"). Do NOT use generic names like "Fiera" or "Capo" as the greeting anymore.
    2. **Tone:** Informal, cool, and confident (Rioplatense style).
    3. **Length:** Extremely punchy. **Max 2 short sentences.** No fluff.
    4. **Content:** ALWAYS mention their current points balance as the hook.
    5. **Special Offer (CRITICAL):** If the customer is **'At Risk'**, you MUST offer a **15% OFF coupon** as a gift to get them back.
    6. **Goal:** Get them back in the shop.
    7. **Visuals:** Include barber-related emojis (✂️, 💈, 🪒) to make it look professional and stylish.
    
    **Examples:**
    - **Loyal:** "¡Hola [Name]! 💈 Tenés 12 puntos, te faltan nada para el corte gratis. ¿Te esperamos? ✂️"
    - **At Risk:** "¡Hola [Name]! ✂️ Hace mucho no te vemos. Te regalamos un 15% OFF en tu próximo corte para que vuelvas a quedar flama. ¡Aprovechá tus {points} puntos! 💈"
    - **New:** "¡Bienvenido [Name]! 🪒 Empezá a sumar puntos con tu primer corte. ¡Te esperamos! 💈"

    Also provide a 'Global AI Summary' of the business health based on these stats.

    Return ONLY valid JSON with this structure:
    {
      "summary": "Brief business health check...",
      "customers": [
        {
          "id": "uuid",
          "name": "Name",
          "phone": "Phone",
          "status": "Loyal" | "At Risk" | "New",
          "message": "Message content...",
          "points": 10,
          "lastVisitDays": 5
        }
      ]
    }

    Customer Data:
    ${JSON.stringify(userAnalysis, null, 2)}
  `;

  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: prompt,
      temperature: 0.7, // Creative but structured
    });

    // Clean potential markdown code blocks
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText) as MarketingInsight;

  } catch (error) {
    console.error('Error generating insights:', error);
    throw new Error('Failed to generate marketing insights');
  }
}

export async function generateDiscountSuggestion(users: UserVisitData[]) {
  // Ensure the API key is available
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error('Groq API Key not configured');
  }

  const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: apiKey,
  });

  const prompt = `
    You are a marketing expert for a barber shop loyalty system.
    Analyze the following list of users and their last visit dates.
    
    Goal: Identify users who are at risk of churning (haven't visited in 30+ days) or are loyal customers due for a reward.
    
    Instructions:
    1. specific discount suggestions for users who haven't visited in over 30 days.
    2. Keep the tone professional but encouraging.
    3. Format the output as a clear list of actionable suggestions.
    
    Users Data:
    ${JSON.stringify(users, null, 2)}
  `;

  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: prompt,
    });

    return text;
  } catch (error) {
    console.error('Error generating discount suggestion:', error);
    throw new Error('Failed to generate suggestions from AI');
  }
}
