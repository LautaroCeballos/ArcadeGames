export function PodiumCard() {
  return (
    <div className="flex flex-col items-center justify-center rounded-[10px] bg-arcade-green px-6 py-8 text-center">
      {/* Trophy icon */}
      <div className="mb-3 text-5xl">🏆</div>
      <p className="text-sm font-semibold text-arcade-dark">TOP de Jugadores</p>
      <p className="mt-1 text-xs text-arcade-dark/60">
        Los mejores puntajes de la comunidad
      </p>
    </div>
  )
}
