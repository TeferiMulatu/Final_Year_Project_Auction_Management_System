import { useState, useEffect } from 'react'

/**
 * CountdownTimer Component
 * 
 * A reusable countdown timer that displays time remaining until a specified end time.
 * Updates in real-time and provides visual cues based on time urgency.
 * 
 * @param {Object} props - Component props
 * @param {string} props.endTime - ISO string or Date parsable string representing the end time
 * @param {Function} props.onEnd - Callback function triggered when countdown reaches zero
 * @returns {JSX.Element} - Countdown timer display element
 */
const CountdownTimer = ({ endTime, onEnd }) => {
  // State to store the formatted time left string
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    /**
     * Calculate and format the time remaining until the end time
     * Updates the timeLeft state and triggers onEnd callback when timer expires
     */
    const calculateTimeLeft = () => {
      const now = new Date().getTime() // Current time in milliseconds
      const end = new Date(endTime).getTime() // End time in milliseconds
      const difference = end - now // Time difference in milliseconds

      // Check if countdown has ended
      if (difference <= 0) {
        setTimeLeft('Ended')
        if (onEnd) onEnd() // Execute callback if provided
        return
      }

      // Calculate time units from milliseconds
      const days = Math.floor(difference / (1000 * 60 * 60 * 24))
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((difference % (1000 * 60)) / 1000)

      // Format time string based on remaining duration
      if (days > 0) {
        // Show days and hours for longer durations (skip seconds for better readability)
        setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      } else if (hours > 0) {
        // Show hours, minutes, and seconds when under 1 day
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
      } else {
        // Show minutes and seconds when under 1 hour
        setTimeLeft(`${minutes}m ${seconds}s`)
      }
    }

    // Calculate initial time left immediately
    calculateTimeLeft()
    
    // Set up interval to update timer every second (1000ms)
    const timer = setInterval(calculateTimeLeft, 1000)

    // Cleanup function - clear interval when component unmounts or dependencies change
    return () => clearInterval(timer)
  }, [endTime, onEnd]) // Re-run effect when endTime or onEnd callback changes

  // Determine visual state based on time remaining
  const isEnded = timeLeft === 'Ended'
  const isUrgent = timeLeft.includes('m') && !timeLeft.includes('h') && !timeLeft.includes('d')

  /**
   * Color coding based on time urgency:
   * - Red: Auction has ended
   * - Orange: Less than 1 hour remaining (urgent)
   * - Gray: More than 1 hour remaining (normal)
   */
  return (
    <span className={`text-sm font-medium ${
      isEnded 
        ? 'text-red-600' // Ended state - red color
        : isUrgent 
          ? 'text-orange-600' // Urgent state (<1 hour) - orange color
          : 'text-gray-600' // Normal state - gray color
    }`}>
      {timeLeft}
    </span>
  )
}

export default CountdownTimer