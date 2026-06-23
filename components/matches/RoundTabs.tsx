'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ROUNDS, ROUND_LABELS, type Round } from '@/types'

export default function RoundTabs({ currentRound }: { currentRound: Round }) {
  const router = useRouter()

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {ROUNDS.map((round) => (
        <button
          key={round}
          onClick={() => router.push(`/matches?round=${round}`)}
          className={cn(
            'whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            currentRound === round
              ? 'bg-primary text-white shadow'
              : 'glass text-muted-foreground hover:text-foreground'
          )}
        >
          {ROUND_LABELS[round]}
        </button>
      ))}
    </div>
  )
}
