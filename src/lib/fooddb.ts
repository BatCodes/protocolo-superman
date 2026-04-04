// ═══════════════════════════════════════════════════════════
// FOOD DATABASE — OpenFoodFacts (Free, Open Source, 3M+ products)
// ═══════════════════════════════════════════════════════════

export interface FoodItem {
  id: string
  name: string
  brand: string
  barcode?: string
  serving: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  image?: string
  source: 'openfoodfacts' | 'custom' | 'recent'
}

export interface DiaryEntry {
  food: FoodItem
  servings: number
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  date: string
  time: string
}

// Search OpenFoodFacts by text
export async function searchFoods(query: string, page = 1): Promise<FoodItem[]> {
  if (!query.trim()) return []

  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page=${page}&page_size=20&fields=code,product_name,brands,nutriments,serving_size,image_front_small_url`

    const res = await fetch(url)
    if (!res.ok) return []

    const data = await res.json()

    return (data.products || [])
      .filter((p: any) => p.product_name && p.nutriments)
      .map((p: any) => ({
        id: p.code || Math.random().toString(36).slice(2),
        name: p.product_name || 'Unknown',
        brand: p.brands || '',
        barcode: p.code,
        serving: p.serving_size || '100g',
        kcal: Math.round(p.nutriments['energy-kcal_100g'] || p.nutriments['energy-kcal'] || 0),
        protein: Math.round((p.nutriments.proteins_100g || p.nutriments.proteins || 0) * 10) / 10,
        carbs: Math.round((p.nutriments.carbohydrates_100g || p.nutriments.carbohydrates || 0) * 10) / 10,
        fat: Math.round((p.nutriments.fat_100g || p.nutriments.fat || 0) * 10) / 10,
        fiber: p.nutriments.fiber_100g ? Math.round(p.nutriments.fiber_100g * 10) / 10 : undefined,
        sugar: p.nutriments.sugars_100g ? Math.round(p.nutriments.sugars_100g * 10) / 10 : undefined,
        sodium: p.nutriments.sodium_100g ? Math.round(p.nutriments.sodium_100g * 1000) : undefined,
        image: p.image_front_small_url,
        source: 'openfoodfacts' as const,
      }))
  } catch {
    return []
  }
}

// Lookup by barcode
export async function lookupBarcode(barcode: string): Promise<FoodItem | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}?fields=code,product_name,brands,nutriments,serving_size,image_front_small_url`)
    if (!res.ok) return null

    const data = await res.json()
    if (data.status !== 1 || !data.product) return null

    const p = data.product
    return {
      id: p.code,
      name: p.product_name || 'Producto desconocido',
      brand: p.brands || '',
      barcode: p.code,
      serving: p.serving_size || '100g',
      kcal: Math.round(p.nutriments?.['energy-kcal_100g'] || p.nutriments?.['energy-kcal'] || 0),
      protein: Math.round((p.nutriments?.proteins_100g || 0) * 10) / 10,
      carbs: Math.round((p.nutriments?.carbohydrates_100g || 0) * 10) / 10,
      fat: Math.round((p.nutriments?.fat_100g || 0) * 10) / 10,
      fiber: p.nutriments?.fiber_100g ? Math.round(p.nutriments.fiber_100g * 10) / 10 : undefined,
      sugar: p.nutriments?.sugars_100g ? Math.round(p.nutriments.sugars_100g * 10) / 10 : undefined,
      image: p.image_front_small_url,
      source: 'openfoodfacts',
    }
  } catch {
    return null
  }
}

// Get recent foods from storage
export function getRecentFoods(diary: DiaryEntry[]): FoodItem[] {
  const seen = new Set<string>()
  const recent: FoodItem[] = []

  // Most recent first
  const sorted = [...diary].sort((a, b) => b.date.localeCompare(a.date))

  for (const entry of sorted) {
    const key = entry.food.name + entry.food.brand
    if (!seen.has(key)) {
      seen.add(key)
      recent.push({ ...entry.food, source: 'recent' })
    }
    if (recent.length >= 20) break
  }

  return recent
}

// Get frequent foods (most logged)
export function getFrequentFoods(diary: DiaryEntry[]): FoodItem[] {
  const counts = new Map<string, { food: FoodItem; count: number }>()

  for (const entry of diary) {
    const key = entry.food.name + entry.food.brand
    const existing = counts.get(key)
    if (existing) {
      existing.count++
    } else {
      counts.set(key, { food: entry.food, count: 1 })
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 15)
    .map(e => ({ ...e.food, source: 'recent' as const }))
}

// Quick add - create a simple food entry from just calories/macros
export function quickAddFood(kcal: number, protein = 0, carbs = 0, fat = 0): FoodItem {
  return {
    id: 'quick-' + Date.now(),
    name: 'Adición rápida',
    brand: '',
    serving: '',
    kcal,
    protein,
    carbs,
    fat,
    source: 'custom',
  }
}

// Calculate diary totals for a specific date and optional meal filter
export function getDiaryTotals(
  diary: DiaryEntry[],
  date: string,
  meal?: string
): { kcal: number; protein: number; carbs: number; fat: number } {
  const entries = diary.filter(e =>
    e.date === date && (!meal || e.meal === meal)
  )

  return entries.reduce((acc, e) => ({
    kcal: acc.kcal + Math.round(e.food.kcal * e.servings),
    protein: acc.protein + Math.round(e.food.protein * e.servings),
    carbs: acc.carbs + Math.round(e.food.carbs * e.servings),
    fat: acc.fat + Math.round(e.food.fat * e.servings),
  }), { kcal: 0, protein: 0, carbs: 0, fat: 0 })
}
