'use server';

import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';

interface AnalyzedUser {
  id: string;
  name: string;
  phone: string;
  points: number;
  daysSinceLastVisit: number;
  visitCount: number;
  isNew: boolean;
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
  const userAnalysis: AnalyzedUser[] = profiles.map(user => {
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

  if (!apiKey) {
      console.warn('⚠️ Groq API Key missing. Using fallback rule-based engine.')
      return generateFallbackInsights(userAnalysis)
  }

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
    1. **Personalization:** ALWAYS start with the client's real Name (e.g., "¡Hola Juan!").
    2. **Tone:** Informal, cool, and confident (Rioplatense style).
    3. **Length:** Max 2 short sentences.
    4. **Visuals:** Use emojis (✂️, 💈, 👑, 🏆).

    **Message Logic (STRICT):**
    - **If Points == 0:** Generate a warm "Welcome / First cut" message. Encourage them to start.
    - **If Points > 0 AND Points < 1600:** Generate a motivational message.
      - Calculate points needed for next reward.
      - **Rewards Tiers:** 600 pts (Basic), 900 pts, 1200 pts, 1600 pts (Premium).
      - **Service Values:** Corte = 120 pts, Corte+Barba = 150 pts, Perfilado = 40 pts.
      - **CRITICAL:** You MUST suggest specific services to bridge the gap.
        - Example: "Te faltan 100 pts. ¡Con un Corte (120 pts) ya llegás!"
        - Example: "Estás a 40 pts de tu premio. ¡Vení por un Perfilado y listo!"
    - **If Points >= 1600:** Generate a VIP message. "¡Sos un crack! Tenés un premio mayor listo para canjear. ¡Te esperamos! 👑"

    Also provide a 'Global AI Summary' of the business health based on these stats.
    The summary must be in **Spanish**. It should mention total active clients, how many are at risk, and a specific strategy recommendation.
    Example: "Tienes 1 cliente en riesgo (Marcos). Sugerencia: Envíale una promoción de 'Corte + Barba' (+150 pts) para reactivarlo."

    Return ONLY valid JSON with this structure:
    {
      "summary": "Brief business health check in Spanish...",
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
    // Fallback if AI fails
    return generateFallbackInsights(userAnalysis);
  }
}

function generateFallbackInsights(users: AnalyzedUser[]): MarketingInsight {
    const loyal = users.filter(u => u.visitCount > 2 && u.daysSinceLastVisit < 30)
    const atRisk = users.filter(u => u.daysSinceLastVisit >= 21)
    
    // Generate Summary
    const atRiskNames = atRisk.slice(0, 3).map(u => u.name).join(', ')
    const remainingAtRisk = atRisk.length - 3
    
    let summary = `Análisis completado: Tienes ${users.length} clientes en total. `
    
    if (atRisk.length > 0) {
        summary += `¡Atención! Hay ${atRisk.length} cliente${atRisk.length > 1 ? 's' : ''} en riesgo (${atRiskNames}${remainingAtRisk > 0 ? ` y ${remainingAtRisk} más` : ''}). `
        summary += `Sugerencia: Envíales una promoción de 'Corte + Barba' para recuperar sus puntos.`
    } else {
        summary += `Tu base de clientes se ve saludable. ¡Sigue así!`
    }

    // Generate Customers
    const customers = users.map(u => {
        let status: 'Loyal' | 'At Risk' | 'New' = 'New'
        
        // Status Logic (Behavioral)
        if (u.visitCount > 2 && u.daysSinceLastVisit < 30) {
            status = 'Loyal'
        } else if (u.daysSinceLastVisit >= 21) {
            status = 'At Risk'
        } else {
            status = 'New'
        }

        // Message Logic (Points-based as requested)
        let message = ''
        const points = u.points || 0

        if (points === 0) {
            message = `¡Hola ${u.name.split(' ')[0]}! 👋 Bienvenido a Tulook. Vení a conocer tu nueva barbería favorita. ¡Te esperamos!`
        } else if (points < 600) {
            const needed = 600 - points
            message = `¡Hola ${u.name.split(' ')[0]}! Estás a solo ${needed} pts de tu primer premio. Con unos cortes más llegás. 💈`
        } else if (points < 1600) {
            const needed = 1600 - points
            message = `¡Grande ${u.name.split(' ')[0]}! Te faltan ${needed} pts para el premio mayor. ¡Metele que falta poco! 🔥`
        } else {
            message = `¡${u.name.split(' ')[0]}, sos un VIP! 👑 Ya tenés puntos para canjear lo que quieras. ¡Vení cuando quieras!`
        }

        return {
            id: u.id,
            name: u.name,
            phone: u.phone,
            status,
            message,
            points,
            lastVisitDays: u.daysSinceLastVisit
        }
    })

    return {
        summary,
        customers
    }
}

export async function getLatestCustomerData(customerId: string) {
  const supabase = await createClient();
  
  // Fetch profile
  const { data: user } = await supabase
    .from('profiles')
    .select('id, points, full_name, created_at')
    .eq('id', customerId)
    .single();

  if (!user) return null;

  // Fetch last transaction for visit data
  const { data: transactions } = await supabase
    .from('transactions')
    .select('created_at')
    .eq('user_id', customerId)
    .eq('type', 'earn')
    .order('created_at', { ascending: false })
    .limit(1);

  const now = new Date();
  const lastVisit = transactions && transactions.length > 0 
    ? new Date(transactions[0].created_at) 
    : new Date(user.created_at);
  
  const daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 3600 * 24));
  const visitCount = transactions ? transactions.length : 0; // Approximate if we only fetch 1, but for status we need logic.
  
  // To get accurate visit count we might need count query, but for 'At Risk' vs 'New' vs 'Loyal'
  // logic used in fallback:
  // Loyal: visitCount > 2 && days < 30
  // At Risk: days >= 21
  // New: else
  
  // Let's get full count for consistency if needed, or just rely on days for At Risk.
  const { count } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', customerId)
    .eq('type', 'earn');
    
  const totalVisits = count || 0;

  let status: 'Loyal' | 'At Risk' | 'New' = 'New';
  
  if (daysSinceLastVisit >= 21) {
      status = 'At Risk';
  } else if (totalVisits > 2 && daysSinceLastVisit < 30) {
      status = 'Loyal';
  } else {
      status = 'New';
  }
  
  return {
    points: user.points,
    status
  };
}

export async function regenerateClientMessage(
  customerId: string,
  currentMessage: string
): Promise<{ message: string, points: number, status: 'Loyal' | 'At Risk' | 'New' }> {
  const supabase = await createClient();
  const apiKey = process.env.GROQ_API_KEY;

  // 1. Fetch fresh data including transactions for status logic
  const { data: user } = await supabase
    .from('profiles')
    .select('id, full_name, points, created_at')
    .eq('id', customerId)
    .single();

  if (!user) throw new Error('Usuario no encontrado');

  // Calculate Status Correctly (Mirroring Logic)
  const { data: transactions } = await supabase
    .from('transactions')
    .select('created_at')
    .eq('user_id', customerId)
    .eq('type', 'earn')
    .order('created_at', { ascending: false });

  const now = new Date();
  const lastVisit = transactions && transactions.length > 0 
    ? new Date(transactions[0].created_at) 
    : new Date(user.created_at);
  
  const daysSinceLastVisit = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 3600 * 24));
  const visitCount = transactions ? transactions.length : 0;

  let status: 'Loyal' | 'At Risk' | 'New' = 'New';
  
  if (daysSinceLastVisit >= 21) {
      status = 'At Risk';
  } else if (visitCount > 2 && daysSinceLastVisit < 30) {
      status = 'Loyal';
  } else {
      status = 'New';
  }

  const name = user.full_name || 'Cliente';
  const points = user.points || 0;

  // Calculate milestones for prompt context
  let nextMilestone = 1600;
  if (points < 600) nextMilestone = 600;
  else if (points < 900) nextMilestone = 900;
  else if (points < 1200) nextMilestone = 1200;
  
  const pointsNeeded = nextMilestone - points;
  
  const groq = createOpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: apiKey || '',
  });

  if (!apiKey) {
    return {
        message: generateFallbackMessage(name, points, status),
        points,
        status
    };
  }

  const prompt = `
    You are a growth hacker for a barber shop.
    Regenerate a WhatsApp marketing message for a client named "${name}".
    
    Context:
    - Points: ${points}
    - Next Reward Tier: ${nextMilestone} points
    - Points Needed: ${pointsNeeded}
    - Current Message: "${currentMessage}" (Make the new one DIFFERENT but keeping the same intent)
    - Service Values: Corte=120, Corte+Barba=150, Perfilado=40.

    **Rules:**
    1. **Personalization:** Start with "${name}" but vary the greeting.
    2. **Tone:** Informal, cool, Rioplatense Spanish.
    3. **Length:** Max 2 sentences.
    4. **Content Logic (STRICT):**
       - If Points == 0: Welcome / First cut invitation.
       - If Points < 1600: MUST calculate how many services are needed. 
         - E.g. If 200 pts needed: "Te faltan 200 pts. ¡Con 2 Cortes (240 pts) ya llegás sobrado!"
         - E.g. If 40 pts needed: "Estás a solo 40 pts. ¡Vení por un Perfilado y llevate el premio!"
       - If Points >= 1600: VIP / Reward ready.
    
    Return ONLY the raw string of the new message. No quotes, no JSON.
  `;

  try {
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: prompt,
      temperature: 0.8,
    });
    
    return {
        message: text.trim().replace(/^"|"$/g, ''),
        points,
        status
    };

  } catch (error) {
    console.error('Error regenerating message:', error);
    return {
        message: generateFallbackMessage(name, points, status),
        points,
        status
    };
  }
}

function generateFallbackMessage(name: string, points: number, status: string): string {
  const templates = [];

  if (points === 0) {
      templates.push(
          `¡Hola ${name}! 💈 ¿Cuándo venís por tu primer corte? Empezá a sumar puntos hoy. ✂️`,
          `¡Che ${name}! 🪒 Te estamos esperando para tu cambio de look. ¡Sumá puntos con tu visita! 💈`,
          `¡Bienvenido ${name}! ✂️ Tu primer corte te acerca a premios increíbles. ¡Reservá ahora! 💈`
      );
  } else if (points >= 15) {
      templates.push(
          `¡Grande ${name}! 👑 Tenés ${points} puntos. ¡El premio es tuyo, vení a buscarlo! 💈`,
          `¡${name}, sos un crack! 🏆 Llegaste al objetivo con ${points} puntos. ¡Canjeá tu premio ya! ✂️`,
          `¡Atención ${name}! 🚨 Tenés un premio desbloqueado por tus ${points} puntos. ¡Te esperamos! 👑`
      );
  } else {
      let nextMilestone = 15;
      if (points < 5) nextMilestone = 5;
      else if (points < 10) nextMilestone = 10;
      const missing = nextMilestone - points;

      templates.push(
          `¡Vamos ${name}! 🚀 Solo ${missing} puntos más y llegás al objetivo de ${nextMilestone}. 🏆`,
          `¡Estás cerca ${name}! 💈 Te faltan ${missing} puntos para tu próximo premio. ¡No aflojes! ✂️`,
          `¡Seguí así ${name}! 🔥 Con ${missing} puntos más desbloqueás el nivel ${nextMilestone}. 🪒`
      );
  }

  // Return a random template
  return templates[Math.floor(Math.random() * templates.length)];
}
