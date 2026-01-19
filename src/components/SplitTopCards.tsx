import { TopCards } from './TopCards'

export function SplitTopCards() {
  return (
    <>
      {/* First two cards - ABOVE 3D scene */}
      <div className="relative z-20" style={{ pointerEvents: 'none' }}>
        <TopCards cardIndices={[0, 1]} />
      </div>

      {/* Last two cards - BELOW 3D scene */}
      <div className="relative z-0" style={{ pointerEvents: 'none' }}>
        <TopCards cardIndices={[2, 3]} />
      </div>
    </>
  )
}
