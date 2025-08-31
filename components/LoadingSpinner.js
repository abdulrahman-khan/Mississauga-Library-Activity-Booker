export default function LoadingSpinner({ message }) {
  return (
    <div className="loading">
      <div className="spinner"></div>
      <span>{message}</span>
    </div>
  )
}