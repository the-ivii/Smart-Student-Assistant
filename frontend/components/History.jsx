export default function History({ history, onHistoryClick, onClear, onDelete }) {
  if (history.length === 0) return null

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDelete = (e, itemId) => {
    e.stopPropagation() // Prevent triggering the item click
    if (onDelete) {
      onDelete(itemId)
    }
  }

  return (
    <section className="history-section">
      <div className="history-header">
        <h3>Recent Topics</h3>
        <button className="clear-button" onClick={onClear}>
          Clear History
        </button>
      </div>
      <div className="history-list">
        {history.map((item) => (
          <div
            key={item.id}
            className="history-item-wrapper"
          >
            <button
              className="history-item"
              onClick={() => onHistoryClick(item.topic, item.mode)}
            >
              <div className="history-topic">
                {item.topic}
              </div>
              <div className="history-time">{formatDate(item.timestamp)}</div>
            </button>
            {onDelete && (
              <button
                className="history-delete"
                onClick={(e) => handleDelete(e, item.id)}
                title="Delete this topic"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

