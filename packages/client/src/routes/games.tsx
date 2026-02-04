import { A } from '@solidjs/router'
import { Swords, Users, ArrowRight } from 'lucide-solid'

export default function MilitoLanding() {
  return (
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div class="max-w-4xl mx-auto pt-8">
        {/* Header */}
        <div class="text-center mb-12">
          <div class="inline-flex items-center justify-center bg-gradient-to-r from-amber-500 to-red-500 p-4 rounded-2xl mb-6">
            <Swords class="w-12 h-12 text-white" />
          </div>
          <h1 class="text-5xl font-bold text-white mb-4">Milito</h1>
          <p class="text-xl text-gray-400 max-w-2xl mx-auto">
            Ancient tactical card game. Deploy units on a 5-column battlefield to conquer territory!
          </p>
        </div>

        {/* Game Card */}
        <A
          href="/lobby?gameId=milito"
          class="group block bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:border-amber-500 transition-all hover:scale-[1.02] cursor-pointer max-w-xl mx-auto"
        >
          <div class="flex flex-col items-center">
            <div class="text-8xl mb-6">⚔️</div>

            <div class="flex items-center gap-2 text-gray-400 mb-6">
              <Users size={20} />
              <span class="text-lg">2 players</span>
            </div>

            <div class="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-red-500 rounded-lg text-white font-semibold text-lg group-hover:from-amber-600 group-hover:to-red-600 transition-all">
              Play Now
              <ArrowRight size={20} />
            </div>
          </div>
        </A>

        {/* View Active Rooms */}
        <div class="text-center mt-8">
          <A
            href="/lobby?gameId=milito"
            class="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <Users size={18} />
            View Active Rooms
          </A>
        </div>
      </div>
    </div>
  )
}
