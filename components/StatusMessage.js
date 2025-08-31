import { useEffect, useState } from 'react'

export default function StatusMessage({ message, error }) {
  const [displayMessage, setDisplayMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  useEffect(() => {
    if (error) {
      setDisplayMessage(error)
      setMessageType('error')
    } else if (message) {
      setDisplayMessage(message)
      setMessageType('info')
    }

    if (message || error) {
      const timer = setTimeout(() => {
        setDisplayMessage('')
        setMessageType('')
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [message, error])

  if (!displayMessage) return null

  return (
    <div className={`status-message status-${messageType}`}>
      {displayMessage}
    </div>
  )
}