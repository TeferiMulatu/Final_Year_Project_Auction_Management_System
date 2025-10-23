import { useState, useEffect } from 'react'

const CountdownTimer = ({ endTime, onEnd }) => {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const end = new Date(endTime).getTime()
      const difference = end - now

      if (difference <= 0) {
        setTimeLeft('Ended')
        if (onEnd) onEnd()
        return
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`)
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [endTime, onEnd])

  const isEnded = timeLeft === 'Ended'
  const isUrgent = timeLeft.includes('m') && !timeLeft.includes('h') && !timeLeft.includes('d')

  return (
    <span className={`text-sm font-medium ${
      isEnded 
        ? 'text-red-500' 
        : isUrgent 
          ? 'text-orange-600' 
          : 'text-gray-600'
    }`}>
      {timeLeft}
    </span>
  )
}

export default CountdownTimer
