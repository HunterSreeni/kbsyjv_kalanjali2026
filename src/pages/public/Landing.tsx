import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo'
import { primaryButtonClass, secondaryButtonClass } from '../../lib/ui'

export function Landing() {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-6">
        <Logo size={96} />
      </div>
      <h1 className="text-4xl font-bold mb-4 text-saffron-800 dark:text-saffron-200">Kalanjali 2026</h1>
      <p className="text-stone-600 dark:text-stone-300 max-w-xl mx-auto mb-8">
        Yuvajana Vibhagam's cultural competition, August 2026. Register for events, track live
        scores, and follow the leaderboard as it happens.
      </p>
      <div className="flex gap-4 justify-center">
        <Link to="/register" className={`${primaryButtonClass} px-5 py-2`}>
          Register Now
        </Link>
        <Link to="/games" className={`${secondaryButtonClass} px-5 py-2`}>
          View Games
        </Link>
      </div>
    </div>
  )
}
