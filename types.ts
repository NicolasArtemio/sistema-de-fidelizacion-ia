export interface Profile {
    id: string
    full_name: string
    whatsapp: string
    points: number
    monthly_points?: number // Added for Monthly Competition
    total_points_accumulated?: number // Added for Lifetime Ranking
    role: string
    pin?: string
    avatar_url?: string | null
}

export interface Transaction {
    id: string
    user_id: string
    type: 'earn' | 'redeem'
    amount: number
    description: string
    created_at: string
}

export interface RedemptionRequest {
    id: string
    user_id: string
    reward_name: string
    cost: number
    status: string
    created_at: string
    profiles: {
        full_name: string
        points: number
    }
}
