import { useState, useEffect } from 'react'

export default function MNSPromo({ game }) {
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!game) return

    const onChange = (_, key, value) => {
      if (key === 'showMNSPromo') setShow(value)
      if (key === 'mnsPromoMessage') setMessage(value)
    }

    game.registry.events.on('changedata', onChange)
    return () => game.registry.events.off('changedata', onChange)
  }, [game])

  if (!show) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/95 pointer-events-auto"
      style={{ fontFamily: '"Press Start 2P", monospace' }}>
      <div className="text-center p-8 max-w-lg">
        <div className="text-[12px] leading-relaxed mb-6 whitespace-pre-line"
          style={{ color: '#E8B800' }}>
          {message}
        </div>

        <a
          href="https://mns.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-[8px] px-4 py-2 border border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black transition-colors"
        >
          VISIT MNS.COM
        </a>

        <button
          onClick={() => {
            setShow(false)
            if (game) game.registry.set('showMNSPromo', false)
          }}
          className="block mx-auto mt-4 text-[6px] text-gray-500 hover:text-white transition-colors cursor-pointer"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          CONTINUE
        </button>
      </div>
    </div>
  )
}
